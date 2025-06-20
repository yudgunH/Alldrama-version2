import { Logger } from '../../utils/logger';
import { Queue, Worker, Job, JobProgress } from 'bullmq';
import IORedis from 'ioredis';
import { execSync, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Episode } from '../../models/Episode';
import { downloadFromR2AsBuffer } from '../media/r2Service';

const logger = Logger.getLogger('HLSQueueService');

// Interface cho data của job
export interface HLSJobData {
  videoKey: string;
  movieId: number;
  episodeId: number;
  jobId: string;
  callbackUrl?: string;
  priority?: number;
}

// Interface cho kết quả job
export interface HLSJobResult {
  success: boolean;
  playlistUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  processingTime?: number;
  outputFiles?: string[];
}

class HLSQueueService {
  private queue: Queue<HLSJobData, HLSJobResult>;
  private worker: Worker<HLSJobData, HLSJobResult>;
  private redisConnection: IORedis;
  private isRunning = false;

  constructor() {
    // Tạo kết nối Redis riêng cho queue theo BullMQ best practices
    this.redisConnection = new IORedis({
      host: process.env.REDIS_HOST || '172.17.0.2',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // Essential for BullMQ workers
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 60000, // 60s connection timeout
      commandTimeout: 60000, // 60s command timeout for long operations
      enableOfflineQueue: true, // Enable for workers as per BullMQ docs
      retryStrategy: (times: number) => {
        // Exponential backoff with max 20s, min 1s
        return Math.max(Math.min(Math.exp(times), 20000), 1000);
      },
    });

    // Thêm error handlers cho Redis
    this.redisConnection.on('error', (error) => {
      logger.error('Redis connection error:', error);
      // Force reconnect on timeout errors
      if (error.message.includes('timeout')) {
        logger.warn('Forcing Redis reconnect due to timeout...');
        this.redisConnection.disconnect();
        setTimeout(() => {
          this.redisConnection.connect();
        }, 1000);
      }
    });

    this.redisConnection.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    this.redisConnection.on('ready', () => {
      logger.info('Redis connection ready');
    });

    this.redisConnection.on('close', () => {
      logger.warn('Redis connection closed');
    });

    // Khởi tạo queue với proper Redis config for production
    this.queue = new Queue<HLSJobData, HLSJobResult>('hls-processing', {
      connection: {
        host: process.env.REDIS_HOST || '172.17.0.2',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false, // Disable for Queue instances as per BullMQ docs
        connectTimeout: 60000,
        commandTimeout: 60000,
        retryStrategy: (times: number) => {
          return Math.max(Math.min(Math.exp(times), 20000), 1000);
        },
      },
      defaultJobOptions: {
        removeOnComplete: 10, // Giữ lại 10 job hoàn thành gần nhất
        removeOnFail: 50,     // Giữ lại 50 job thất bại gần nhất
        attempts: parseInt(process.env.HLS_QUEUE_RETRY_ATTEMPTS || '3'),
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.HLS_QUEUE_RETRY_DELAY || '30000'),
        },
      },
    });

    // Khởi tạo worker với separate Redis connection optimized for workers
    this.worker = new Worker<HLSJobData, HLSJobResult>(
      'hls-processing',
      this.processHLSJob.bind(this),
      {
        connection: this.redisConnection, // Use the worker-optimized connection
        concurrency: parseInt(process.env.HLS_QUEUE_CONCURRENCY || '2'),
        removeOnComplete: { count: 10 },
        removeOnFail: { count: 50 },
      }
    );

    this.setupEventListeners();
  }

  /**
   * Thiết lập các event listener cho queue và worker
   */
  private setupEventListeners(): void {
    // Queue events
    this.queue.on('error', (error: Error) => {
      logger.error('Queue error:', error);
    });

    // Worker events
    this.worker.on('completed', (job: Job<HLSJobData, HLSJobResult>) => {
      logger.info(`Job ${job.id} completed successfully for episode ${job.data.episodeId}`);
    });

    this.worker.on('failed', (job: Job<HLSJobData, HLSJobResult> | undefined, error: Error) => {
      if (job) {
        logger.error(`Job ${job.id} failed for episode ${job.data.episodeId}:`, error);
      } else {
        logger.error('Job failed with no job data:', error);
      }
    });

    this.worker.on('progress', (job: Job<HLSJobData, HLSJobResult>, progress: JobProgress) => {
      const progressValue = typeof progress === 'number' ? progress : parseInt(progress as string) || 0;
      logger.debug(`Job ${job.id} progress: ${progressValue}%`);
    });

    this.worker.on('stalled', (jobId: string) => {
      logger.warn(`Job ${jobId} stalled`);
    });

    this.worker.on('error', (error: Error) => {
      logger.error('Worker error:', error);
    });
  }

  /**
   * Thêm job vào queue
   */
  public async addHLSJob(data: HLSJobData): Promise<Job<HLSJobData, HLSJobResult>> {
    try {
      const job = await this.queue.add('process-hls', data, {
        priority: data.priority || 0,
        jobId: data.jobId,
        delay: 0, // Có thể thêm delay nếu cần
      });

      logger.info(`Added HLS job ${job.id} to queue for episode ${data.episodeId}`);
      return job;
    } catch (error) {
      logger.error('Error adding job to queue:', error);
      throw error;
    }
  }

  /**
   * Xử lý job HLS (được gọi bởi worker)
   */
  private async processHLSJob(job: Job<HLSJobData, HLSJobResult>): Promise<HLSJobResult> {
    const startTime = Date.now();
    const { videoKey, movieId, episodeId, jobId, callbackUrl } = job.data;

    try {
      logger.info(`Starting HLS processing for job ${job.id}, episode ${episodeId}`);

      // Cập nhật progress
      await job.updateProgress(5);

      // Cập nhật trạng thái episode
      await Episode.update(
        { processingStatus: 'processing' },
        { where: { id: episodeId } }
      );

      await job.updateProgress(10);

      // Tạo unique volume cho mỗi job
      const volumeName = `hls-processor-data-${movieId}-${episodeId}-${job.id}-${Date.now()}`;
      logger.info(`🔍 DEBUG: Creating volume: ${volumeName}`);
      await this.setupDockerVolume(volumeName, videoKey);

      await job.updateProgress(20);

      // Khởi chạy Docker container để xử lý
      const result = await this.runHLSProcessor(
        volumeName,
        movieId,
        episodeId,
        jobId,
        callbackUrl,
        job
      );

      await job.updateProgress(90);

      // Cleanup volume - đảm bảo container đã dừng hoàn toàn
      logger.info(`🔍 DEBUG: Starting cleanup for volume: ${volumeName}`);
      await this.cleanupVolume(volumeName);
      logger.info(`🔍 DEBUG: Cleanup completed for volume: ${volumeName}`);

      await job.updateProgress(100);

      const processingTime = Date.now() - startTime;
      logger.info(`HLS processing completed for episode ${episodeId} in ${processingTime}ms`);

      return {
        success: true,
        playlistUrl: result.playlistUrl,
        thumbnailUrl: result.thumbnailUrl,
        processingTime,
      };

    } catch (error) {
      logger.error(`HLS processing failed for episode ${episodeId}:`, error);

      // Cập nhật trạng thái thất bại
      await Episode.update(
        { processingStatus: 'failed' },
        { where: { id: episodeId } }
      );

      // Cleanup volume nếu có lỗi
      try {
        const volumeName = `hls-processor-data-${movieId}-${episodeId}-${job.id}-`;
        logger.info(`🔍 DEBUG: Attempting cleanup after error for volumes matching: ${volumeName}*`);
        
        // Tìm volume có pattern tương tự
        const { stdout: volumeList } = await new Promise<{ stdout: string; stderr: string }>((resolve) => {
          exec(`docker volume ls -q | grep "${volumeName}"`, (error, stdout, stderr) => {
            resolve({ stdout, stderr });
          });
        });
        
        if (volumeList.trim()) {
          const volumes = volumeList.trim().split('\n');
          for (const volume of volumes) {
            if (volume.trim()) {
              logger.info(`🔍 DEBUG: Cleaning up volume after error: ${volume}`);
              await this.cleanupVolume(volume.trim());
            }
          }
        }
      } catch (cleanupError) {
        logger.warn('Error during error cleanup:', cleanupError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Thiết lập Docker volume và download video
   */
  private async setupDockerVolume(volumeName: string, videoKey: string): Promise<void> {
    try {
      // Tạo volume
      await this.createVolumeIfNotExists(volumeName);

      // Tạo container tạm thời để copy file
      const tempContainer = `temp-copy-${Date.now()}`;
      
      try {
        execSync(`docker run -d --name ${tempContainer} -v ${volumeName}:/data node:18-slim tail -f /dev/null`);
        
        // Tạo thư mục
        execSync(`docker exec ${tempContainer} mkdir -p /data/input /data/output`);
        execSync(`docker exec ${tempContainer} chmod 777 /data/input /data/output`);

        // Download video từ R2
        logger.info(`🔍 DEBUG: Downloading video from R2 with key: ${videoKey}`);
        logger.info(`🔍 DEBUG: Video key length: ${videoKey.length}`);
        logger.info(`🔍 DEBUG: Video key starts with: ${videoKey.substring(0, 50)}...`);
        
        const videoData = await downloadFromR2AsBuffer(videoKey);
        logger.info(`🔍 DEBUG: Downloaded video buffer size: ${videoData.length} bytes`);
        
        // Ghi file tạm
        const tempFile = path.join(os.tmpdir(), `original-${Date.now()}.mp4`);
        fs.writeFileSync(tempFile, videoData);
        
        // Copy vào container
        execSync(`docker cp ${tempFile} ${tempContainer}:/data/input/original.mp4`);
        execSync(`docker exec ${tempContainer} chmod 666 /data/input/original.mp4`);
        
        // Cleanup file tạm
        fs.unlinkSync(tempFile);
        
      } finally {
        // Cleanup container tạm
        try {
          execSync(`docker rm -f ${tempContainer}`);
        } catch (e) {
          logger.warn('Error cleaning up temp container:', e);
        }
      }

    } catch (error) {
      logger.error('Error setting up Docker volume:', error);
      throw error;
    }
  }

  /**
   * Chạy HLS processor container
   */
  private async runHLSProcessor(
    volumeName: string,
    movieId: number,
    episodeId: number,
    jobId: string,
    callbackUrl: string | undefined,
    job: Job<HLSJobData, HLSJobResult>
  ): Promise<{ playlistUrl?: string; thumbnailUrl?: string }> {
    
    // Build image nếu cần
    try {
      execSync('docker image inspect alldrama-hls-processor', { stdio: 'ignore' });
    } catch {
      logger.info('Building HLS processor Docker image...');
      execSync('cd hls-processor && docker build -t alldrama-hls-processor .', { stdio: 'inherit' });
    }

    await job.updateProgress(30);

    // Chuẩn bị parameters
    const containerName = `hls-processor-${episodeId}-${Date.now()}`;
    const backendHost = process.env.NODE_ENV === 'production' && process.env.PUBLIC_DOMAIN 
      ? process.env.PUBLIC_DOMAIN 
      : '127.0.0.1';
    const backendPort = process.env.PORT || '5000';
    
    // Use HTTPS in production, HTTP in development
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const actualCallbackUrl = callbackUrl || `${protocol}://${backendHost}${process.env.NODE_ENV === 'production' ? '' : ':' + backendPort}/api/media/hls-processor/callback`;

    const dockerCommand = [
      'docker', 'run',
      '-d',
      '--name', containerName,
      '--rm',
      '--network', 'host',
      '--add-host=host.docker.internal:host-gateway',
      '-v', `${volumeName}:/data`,
      'alldrama-hls-processor',
      '/data/input/original.mp4',
      '/data/output',
      `${movieId}`,
      `${episodeId}`,
      process.env.R2_ACCOUNT_ID || '',
      process.env.R2_ACCESS_KEY_ID || '',
      process.env.R2_SECRET_ACCESS_KEY || '',
      process.env.R2_BUCKET || 'movie-web-vn',
      actualCallbackUrl,
      volumeName
    ].join(' ');

    await job.updateProgress(40);

    return new Promise((resolve, reject) => {
      logger.debug(`Executing Docker command: ${dockerCommand}`);
      
      exec(dockerCommand, async (error, stdout, stderr) => {
        if (error && !stdout) {
          reject(new Error(`Docker execution failed: ${error.message}`));
          return;
        }

        const containerId = stdout.trim();
        logger.info(`Started container ${containerName} with ID: ${containerId}`);

        await job.updateProgress(50);

        // Theo dõi container
        this.monitorContainer(containerName, job, resolve, reject);
      });
    });
  }

  /**
   * Theo dõi trạng thái container
   */
  private async monitorContainer(
    containerName: string,
    job: Job<HLSJobData, HLSJobResult>,
    resolve: (value: { playlistUrl?: string; thumbnailUrl?: string }) => void,
    reject: (reason: any) => void
  ): Promise<void> {
    const maxWaitTime = 30 * 60 * 1000; // 30 phút
    const checkInterval = 5000; // 5 giây
    let elapsed = 0;

    const checkStatus = async () => {
      try {
        const { stdout } = await new Promise<{ stdout: string; stderr: string }>((res) => {
          exec(`docker ps -a --filter "name=${containerName}" --format "{{.Status}}"`, 
            (error, stdout, stderr) => {
              res({ stdout, stderr });
            }
          );
        });

        const status = stdout.trim();
        logger.debug(`Container ${containerName} status: ${status}`);

        if (status.includes('Exited (0)')) {
          // Container đã hoàn thành thành công
          logger.info(`🔍 DEBUG: Container ${containerName} completed successfully`);
          
          // Wait extra time để đảm bảo container thực sự đã dừng
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const workerDomain = process.env.CLOUDFLARE_WORKER_DOMAIN || process.env.WORKER_DOMAIN;
          const playlistUrl = `https://${workerDomain}/episodes/${job.data.movieId}/${job.data.episodeId}/hls/master.m3u8`;
          const thumbnailUrl = `https://${workerDomain}/episodes/${job.data.movieId}/${job.data.episodeId}/thumbnail.jpg`;

          await Episode.update(
            { 
              processingStatus: 'completed',
              playlistUrl: playlistUrl,
              thumbnailUrl: thumbnailUrl
            },
            { where: { id: job.data.episodeId } }
          );

          resolve({ playlistUrl, thumbnailUrl });
          return;
        }

        if (status.includes('Exited') && !status.includes('Exited (0)')) {
          // Container đã thoát với lỗi
          logger.error(`🔍 DEBUG: Container ${containerName} exited with error: ${status}`);
          
          // Wait và cleanup container trước khi reject
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
          } catch (cleanupError) {
            logger.warn(`Error cleaning up failed container: ${cleanupError}`);
          }
          
          reject(new Error(`Container exited with error: ${status}`));
          return;
        }

        elapsed += checkInterval;
        if (elapsed >= maxWaitTime) {
          // Force kill container if timeout
          try {
            execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
            logger.warn(`Force killed container ${containerName} due to timeout`);
          } catch (killError) {
            logger.error(`Error killing timed out container: ${killError}`);
          }
          reject(new Error(`Container processing timeout after ${maxWaitTime}ms`));
          return;
        }

        // Cập nhật progress dựa trên thời gian
        const progressPercentage = Math.min(50 + (elapsed / maxWaitTime) * 30, 80);
        await job.updateProgress(progressPercentage);

        // Tiếp tục check sau 5 giây
        setTimeout(checkStatus, checkInterval);

      } catch (error) {
        reject(error);
      }
    };

    // Bắt đầu check
    setTimeout(checkStatus, checkInterval);
  }

  /**
   * Tạo Docker volume nếu chưa tồn tại
   */
  private async createVolumeIfNotExists(volumeName: string): Promise<void> {
    try {
      execSync(`docker volume inspect ${volumeName}`, { stdio: 'ignore' });
      logger.debug(`Volume ${volumeName} already exists`);
    } catch {
      execSync(`docker volume create ${volumeName}`);
      logger.debug(`Created volume ${volumeName}`);
    }
  }

  /**
   * Cleanup Docker volume
   */
  private async cleanupVolume(volumeName: string): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    logger.info(`🔍 DEBUG: Starting cleanup for volume ${volumeName}`);

    while (retryCount < maxRetries) {
      try {
        // Wait longer before cleanup to ensure container is fully stopped
        await new Promise(resolve => setTimeout(resolve, 3000));

        // First, check for any containers using this volume (including stopped ones)
        try {
          const { stdout: allContainers } = await new Promise<{ stdout: string; stderr: string }>((resolve) => {
            exec(`docker ps -a -q --filter volume=${volumeName}`, (error, stdout, stderr) => {
              resolve({ stdout, stderr });
            });
          });

          if (allContainers.trim()) {
            logger.warn(`🔍 DEBUG: Found containers using volume ${volumeName}, removing them`);
            const containerIds = allContainers.trim().split('\n').filter(id => id.trim());
            for (const containerId of containerIds) {
              try {
                execSync(`docker rm -f ${containerId}`, { stdio: 'ignore' });
                logger.info(`🔍 DEBUG: Removed container ${containerId}`);
              } catch (removeError) {
                logger.warn(`🔍 DEBUG: Error removing container ${containerId}:`, removeError);
              }
            }
            // Wait after killing containers
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            logger.info(`🔍 DEBUG: No containers found using volume ${volumeName}`);
          }
        } catch (containerError) {
          logger.warn(`🔍 DEBUG: Error checking containers for volume ${volumeName}:`, containerError);
        }

        // Check if volume exists before trying to remove
        try {
          execSync(`docker volume inspect ${volumeName}`, { stdio: 'ignore' });
          logger.info(`🔍 DEBUG: Volume ${volumeName} exists, attempting to remove`);
        } catch {
          logger.info(`🔍 DEBUG: Volume ${volumeName} does not exist, cleanup complete`);
          return;
        }

        // Try to remove the volume
        execSync(`docker volume rm ${volumeName}`, { stdio: 'ignore' });
        logger.info(`🔍 DEBUG: Successfully cleaned up volume ${volumeName}`);
        return;

      } catch (error) {
        retryCount++;
        logger.warn(`🔍 DEBUG: Cleanup attempt ${retryCount}/${maxRetries} failed for volume ${volumeName}:`, error);

        if (retryCount >= maxRetries) {
          logger.error(`🔍 DEBUG: Failed to cleanup volume ${volumeName} after ${maxRetries} attempts - volume may still exist`);
          // Don't throw error, just log it to prevent job failure
          return;
        }

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
      }
    }
  }

  /**
   * Lấy thông tin về queue
   */
  public async getQueueInfo(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();
    const delayed = await this.queue.getDelayed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Lấy thông tin job theo ID
   */
  public async getJob(jobId: string): Promise<Job<HLSJobData, HLSJobResult> | null> {
    const job = await this.queue.getJob(jobId);
    return job || null;
  }

  /**
   * Hủy job
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.getJob(jobId);
      if (job) {
        await job.remove();
        logger.info(`Cancelled job ${jobId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error cancelling job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Khởi động service
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('HLS Queue Service is already running');
      return;
    }

    try {
      await this.redisConnection.ping();
      logger.info('HLS Queue Service started successfully');
      this.isRunning = true;
    } catch (error) {
      logger.error('Failed to start HLS Queue Service:', error);
      throw error;
    }
  }

  /**
   * Dừng service
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.worker.close();
      await this.queue.close();
      await this.redisConnection.quit();
      this.isRunning = false;
      logger.info('HLS Queue Service stopped');
    } catch (error) {
      logger.error('Error stopping HLS Queue Service:', error);
    }
  }

  /**
   * Lấy queue instance (để sử dụng với Bull Board)
   */
  public getQueue(): Queue<HLSJobData, HLSJobResult> {
    return this.queue;
  }
}

// Export singleton instance
export const hlsQueueService = new HLSQueueService();
export default hlsQueueService; 