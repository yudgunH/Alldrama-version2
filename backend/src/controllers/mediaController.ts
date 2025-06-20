import { Logger } from '../utils/logger';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import fetch from 'node-fetch';
import { 
  uploadFileToR2, 
  downloadFromR2, 
  generatePresignedUrl, 
  deleteFileFromR2,
  deleteHlsFiles,
  uploadDirectoryToR2,
  downloadFromR2AsBuffer,
  listFiles,
  deleteFilesByPrefix as deleteFilesByPrefixR2
} from '../services/media/r2Service';
import { 
  convertToHls, 
  createThumbnail, 
  getVideoMetadata 
} from '../services/media/hlsService';
import { Episode } from '../models/Episode';
import { Movie } from '../models/Movie';
import { UserWatchHistory } from '../models/UserWatchHistory';
import sequelize from '../config/database';
import { MediaService } from '../services/media/mediaService';
import { execSync, spawn } from 'child_process';
import { exec } from 'child_process';

const logger = Logger.getLogger('mediaController');
// Tạo instance mediaService trực tiếp thay vì dùng getMediaService để tránh lỗi khi chạy test
const mediaService = new MediaService();

// Upload poster phim
export const uploadMoviePoster = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ message: 'Không tìm thấy file' });
      return;
    }
    
    // Sử dụng MediaService để upload
    const fileUrl = await mediaService.uploadMoviePoster(Number(movieId), file);
    
    // Trả về URL của file
    res.status(200).json({
      message: 'Upload poster thành công',
      url: fileUrl
    });
  } catch (error) {
    logger.error('Lỗi khi upload poster:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Lỗi khi upload poster' });
  }
};

// Upload backdrop phim
export const uploadMovieBackdrop = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ message: 'Không tìm thấy file' });
      return;
    }
    
    // Sử dụng MediaService để upload
    const fileUrl = await mediaService.uploadMovieBackdrop(Number(movieId), file);
    
    // Trả về URL của file
    res.status(200).json({
      message: 'Upload backdrop thành công',
      url: fileUrl
    });
  } catch (error) {
    logger.error('Lỗi khi upload backdrop:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Lỗi khi upload backdrop' });
  }
};

// Upload trailer phim
export const uploadMovieTrailer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const file = req.file;
    
    if (!file) {
      res.status(400).json({ message: 'Không tìm thấy file' });
      return;
    }
    
    // Sử dụng MediaService để upload
    const fileUrl = await mediaService.uploadMovieTrailer(Number(movieId), file);
    
    // Tạo thumbnail từ trailer (đã được xử lý trong MediaService)
    
    // Trả về URL của file
    res.status(200).json({
      message: 'Upload trailer thành công',
      trailerUrl: fileUrl
    });
  } catch (error) {
    logger.error('Lỗi khi upload trailer:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Lỗi khi upload trailer' });
  }
};

// Upload và xử lý video tập phim
export const uploadEpisodeVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId, episodeId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'Không có file được upload' });
      return;
    }

    logger.debug(`Upload video cho episode ${episodeId} của movie ${movieId}`);

    // Upload video và tạo thumbnail
    const result = await mediaService.uploadEpisodeVideo(Number(movieId), Number(episodeId), file);

    // Generate job ID for queue processing
    const jobId = `direct-upload-${Date.now()}-${episodeId}`;
    
    // Add to queue instead of direct processing
    try {
      // Get video key from the uploaded URL
      const videoUrl = new URL(result.originalUrl);
      const videoKey = videoUrl.pathname.substring(1); // Remove leading '/'
      
      const hlsQueueServiceModule = await import('../services/queue/hlsQueueService');
      const hlsQueueService = hlsQueueServiceModule.hlsQueueService;
      
      await hlsQueueService.addHLSJob({
        videoKey,
        movieId: Number(movieId),
        episodeId: Number(episodeId),
        jobId,
        priority: 1 // Higher priority for direct uploads
      });

      const queueInfo = await hlsQueueService.getQueueInfo();
      const queuePosition = queueInfo.waiting + queueInfo.active;

      logger.info(`Direct upload episode ${episodeId} added to queue at position ${queuePosition}`);

      res.status(200).json({
        message: 'Video đã được upload thành công và đã được thêm vào queue xử lý',
        originalUrl: result.originalUrl,  // Keep original field name for compatibility
        videoUrl: result.originalUrl,     // Also provide new field name
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        processingStatus: 'pending',
        queuePosition,
        estimatedDuration: result.duration
      });

    } catch (queueError) {
      logger.error('Error adding direct upload to queue:', queueError);
      
      // Fallback to old direct processing if queue fails
      logger.warn('Queue failed, falling back to direct processing');
      
      // HLS processing is now handled by queue system via Cloudflare Worker webhook
      // No direct processing here to avoid bypassing the queue
      logger.info(`Episode ${episodeId} uploaded. HLS processing will be handled by queue system.`);
      
      res.status(200).json({
        message: 'Video đã được upload thành công',
        originalUrl: result.originalUrl,  // Keep original field name for compatibility
        videoUrl: result.originalUrl,     // Also provide new field name
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        processingStatus: 'pending',
        estimatedDuration: result.duration
      });
    }

  } catch (error) {
    logger.error('Lỗi khi upload video:', error);
    
    // Xóa file tạm nếu có lỗi
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Lỗi khi upload video' });
  }
};

// Tạo presigned URL cho upload trực tiếp
export const getPresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId, episodeId, fileType } = req.body;
    logger.debug('Yêu cầu presigned URL:', { movieId, episodeId, fileType, user: req.user?.id });
    
    if (!movieId || !fileType) {
      res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
      return;
    }
    
    let type: string;
    let id: number;
    let fileName: string;
    
    // Xác định key và content type dựa vào loại file
    if (fileType === 'poster') {
      type = 'movie-poster';
      id = Number(movieId);
      fileName = 'poster.jpg';
    } else if (fileType === 'backdrop') {
      type = 'movie-backdrop';
      id = Number(movieId);
      fileName = 'backdrop.jpg';
    } else if (fileType === 'trailer') {
      type = 'movie-trailer';
      id = Number(movieId);
      fileName = 'trailer.mp4';
    } else if (fileType === 'video' && episodeId) {
      type = 'episode-video';
      console.log('Debug video upload:', { movieId, episodeId, type });
      id = Number(movieId);
      fileName = 'original.mp4';
    } else if (fileType === 'thumbnail' && episodeId) {
      type = 'episode-thumbnail';
      id = Number(`${movieId}-${episodeId}`);
      fileName = 'thumbnail.jpg';
    } else {
      res.status(400).json({ message: 'Loại file không hợp lệ' });
      return;
    }
    
    // Tạo presigned URL thông qua service
    let presignedUrl;
    if (fileType === 'video' && episodeId) {
      // Truyền movieId và episodeId riêng biệt
      // Tăng thời gian hết hạn cho file lớn (3 giờ)
      presignedUrl = await mediaService.getPresignedUploadUrl(type, Number(movieId), fileName, Number(episodeId), 10800);
    } else {
      presignedUrl = await mediaService.getPresignedUploadUrl(type, id, fileName);
    }
    
    // Xác định CDN URL - sử dụng tên miền Worker
    const cdnUrl = `https://${process.env.CLOUDFLARE_WORKER_DOMAIN || process.env.WORKER_DOMAIN}/`;
    
    res.status(200).json({
      presignedUrl,
      contentType: fileName.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
      cdnUrl,
      expiresIn: fileType === 'video' ? 10800 : 3600 // 3 giờ cho video, 1 giờ cho các file còn lại
    });
  } catch (error) {
    logger.error('Lỗi khi tạo presigned URL:', error);
    res.status(500).json({ message: 'Lỗi khi tạo presigned URL' });
  }
};

/**
 * Xóa media (poster, backdrop, trailer) của phim
 */
export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId, mediaType } = req.params;
    
    // Xác định URL cần xóa
    let url: string;
    let updateField: string | null = null;
    
    const workerDomain = process.env.CLOUDFLARE_WORKER_DOMAIN || process.env.WORKER_DOMAIN;
    
    switch (mediaType) {
      case 'poster':
        url = `https://${workerDomain}/movies/${movieId}/poster.jpg`;
        updateField = 'posterUrl';
        break;
      case 'backdrop':
        url = `https://${workerDomain}/movies/${movieId}/backdrop.jpg`;
        updateField = 'backdropUrl';
        break;
      case 'trailer':
        url = `https://${workerDomain}/movies/${movieId}/trailer.mp4`;
        updateField = 'trailerUrl';
        break;
      default:
        url = req.params.key; // Sử dụng path param key cho old API
        break;
    }
    
    // Sử dụng service để xóa
    const success = await mediaService.deleteMedia(url);
    
    if (success && updateField) {
      // Cập nhật database
      await Movie.update({ [updateField]: null }, { where: { id: movieId } });
    }
    
    res.json({
      success,
      message: success ? 'Đã xóa media thành công' : 'Không thể xóa media'
    });
  } catch (error) {
    logger.error('Error deleting media:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa tập phim và tất cả file liên quan
 */
export const deleteEpisode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId, episodeId } = req.params;
    
    // Tìm thông tin episode trước khi xóa
    const episode = await Episode.findByPk(episodeId);
    
    if (!episode) {
      res.status(404).json({ success: false, error: 'Không tìm thấy tập phim' });
      return;
    }
    
    // Xóa tất cả media liên quan đến tập phim
    await mediaService.deleteEpisodeMedia(movieId, episodeId);
    
    // Xóa thông tin episode từ database
    await Episode.destroy({ where: { id: episodeId } });
    
    // Xóa lịch sử xem liên quan
    await UserWatchHistory.destroy({ 
      where: { 
        movieId: Number(movieId),
        episodeId: Number(episodeId)
      } 
    });
    
    res.json({
      success: true,
      message: 'Đã xóa tập phim thành công'
    });
  } catch (error) {
    logger.error('Error deleting episode:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa toàn bộ phim và tất cả tập phim, media liên quan
 */
export const deleteMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    
    // Tìm thông tin phim trước khi xóa
    const movie = await Movie.findByPk(movieId, {
      include: [Episode]
    });
    
    if (!movie) {
      res.status(404).json({ success: false, error: 'Không tìm thấy phim' });
      return;
    }
    
    // Bắt đầu transaction để đảm bảo tính nhất quán
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Xóa tất cả media của phim (poster, backdrop, trailer)
      if (movie.posterUrl) await mediaService.deleteMedia(movie.posterUrl);
      if ((movie as any).backdropUrl) await mediaService.deleteMedia((movie as any).backdropUrl);
      if (movie.trailerUrl) await mediaService.deleteMedia(movie.trailerUrl);
      
      // 2. Xóa tất cả tập phim và file liên quan
      if (movie.episodes && movie.episodes.length > 0) {
        for (const episode of movie.episodes) {
          await mediaService.deleteEpisodeMedia(movieId, episode.id);
        }
      }
      
      // 3. Xóa tất cả lịch sử xem liên quan
      await UserWatchHistory.destroy({ 
        where: { movieId: Number(movieId) },
        transaction
      });
      
      // 4. Xóa tất cả tập phim từ database
      await Episode.destroy({ 
        where: { movieId: Number(movieId) },
        transaction
      });
      
      // 5. Xóa phim từ database
      await Movie.destroy({ 
        where: { id: Number(movieId) },
        transaction
      });
      
      // Commit transaction nếu tất cả thành công
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Đã xóa phim và tất cả tập phim thành công'
      });
    } catch (txError) {
      // Rollback nếu có lỗi
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    logger.error('Error deleting movie:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

// Lấy trạng thái xử lý video
export const getVideoProcessingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { episodeId } = req.params;
    
    // Lấy trạng thái từ service
    const status = await mediaService.getVideoProcessingStatus(Number(episodeId));
    
    res.status(200).json(status);
  } catch (error) {
    logger.error('Lỗi khi lấy trạng thái xử lý video:', error);
    res.status(500).json({ message: 'Lỗi khi lấy trạng thái xử lý video' });
  }
};

// Lấy trạng thái xử lý video chi tiết (bao gồm thông tin từ job-metadata)
export const getDetailedProcessingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId, episodeId } = req.params;
    
    // Lấy thông tin episode cơ bản
    const episode = await Episode.findByPk(episodeId);
    if (!episode) {
      res.status(404).json({ 
        success: false, 
        error: 'Không tìm thấy tập phim' 
      });
      return;
    }

    // Thông tin cơ bản
    const basicStatus = {
      episodeId: Number(episodeId),
      movieId: Number(movieId),
      processingStatus: episode.processingStatus || 'unknown',
      playlistUrl: episode.playlistUrl,
      thumbnailUrl: episode.thumbnailUrl
    };

    // Nếu đang xử lý, lấy thông tin chi tiết từ job-metadata
    if (episode.processingStatus === 'processing' || episode.processingStatus === 'pending') {
      try {
        const { downloadFromR2AsBuffer } = await import('../services/media/r2Service');
        const metadataKey = `episodes/${movieId}/${episodeId}/hls/job-metadata.json`;
        
        const metadataBuffer = await downloadFromR2AsBuffer(metadataKey);
        const jobMetadata = JSON.parse(metadataBuffer.toString());
        
        res.json({
          success: true,
          ...basicStatus,
          progress: jobMetadata.progress || 0,
          lastUpdated: jobMetadata.lastUpdated,
          estimatedTimeRemaining: jobMetadata.progress ? Math.round((100 - jobMetadata.progress) * 2) : null, // ước tính thời gian còn lại (giây)
          jobMetadata: {
            status: jobMetadata.status,
            progress: jobMetadata.progress,
            error: jobMetadata.error,
            thumbnailUrl: jobMetadata.thumbnailUrl,
            masterPlaylistUrl: jobMetadata.masterPlaylistUrl,
            lastUpdated: jobMetadata.lastUpdated
          }
        });
        return;
      } catch (metadataError) {
        logger.warn(`Không thể lấy job metadata cho episode ${episodeId}:`, metadataError);
        // Nếu không lấy được metadata, chỉ trả về thông tin cơ bản
      }
    }
    
    res.json({
      success: true,
      ...basicStatus
    });
  } catch (error) {
    logger.error('Lỗi khi lấy trạng thái xử lý video chi tiết:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi lấy trạng thái xử lý video' 
    });
  }
};

// Hàm xử lý yêu cầu từ Worker
export const processVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug("Received process-video request");
    logger.debug("Headers:", req.headers);
    logger.debug("Body:", req.body);
    
    // Xác thực Worker Secret
    const workerSecret = req.header('X-Worker-Secret');
    if (workerSecret !== process.env.WORKER_SECRET && workerSecret !== 'alldrama-worker-secret') {
      logger.debug("Unauthorized request - invalid worker secret");
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { videoKey, movieId, episodeId, jobId, callbackUrl } = req.body;
    
    if (!videoKey || !movieId || !episodeId) {
      logger.debug("Missing required fields");
      res.status(400).json({ 
        success: false,
        error: "Missing required fields: videoKey, movieId, or episodeId" 
      });
      return;
    }
    
    // Ghi log yêu cầu xử lý
    logger.info(`Processing video: ${videoKey} for movie ${movieId}, episode ${episodeId}`);
    
    // Tạo job ID nếu chưa có
    const processJobId = jobId || `job-${Date.now()}`;
    
    // Sử dụng MediaService để xử lý video và truyền thêm callbackUrl
    const result = await mediaService.processVideoFromWorker(
      videoKey, 
      movieId, 
      episodeId, 
      processJobId,
      callbackUrl
    );
    
    // Trả về response ngay để Worker không phải đợi
    res.json({ 
      success: result.success,
      jobId: result.jobId,
      error: result.error
    });
    
    // Log việc sẽ gọi callback
    if (callbackUrl) {
      logger.debug(`Callback URL sẽ được gọi khi hoàn thành: ${callbackUrl}`);
    }
  } catch (error: unknown) {
    logger.error('Error processing video:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Webhook từ Cloudflare Worker để xử lý video - NOW USES QUEUE SYSTEM
export const processVideoFromWorker = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug("Received process-video request from Worker");
    
    // Xác thực Worker Secret
    const workerSecret = req.header('X-Worker-Secret');
    if (workerSecret !== process.env.WORKER_SECRET && workerSecret !== 'alldrama-worker-secret') {
      logger.debug("Unauthorized request - invalid worker secret");
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { videoKey, movieId, episodeId } = req.body;
    
    // DEBUG: Log video key info
    logger.info(`🔍 DEBUG processVideoFromWorker: videoKey=${videoKey}, movieId=${movieId}, episodeId=${episodeId}`);
    logger.info(`🔍 DEBUG: Video key type: ${typeof videoKey}, length: ${videoKey?.length}`);
    
    if (!videoKey || !movieId || !episodeId) {
      logger.debug("Missing required fields");
      res.status(400).json({ 
        success: false,
        error: "Missing required fields: videoKey, movieId, or episodeId" 
      });
      return;
    }
    
    // Generate callback URL for queue system
    let backendHost;
    const isProd = process.env.NODE_ENV === 'production';
    
    if (isProd && process.env.PUBLIC_DOMAIN) {
      backendHost = process.env.PUBLIC_DOMAIN;
    } else {
      backendHost = '127.0.0.1';
    }
    
    const backendPort = process.env.PORT || '5000';
    const protocol = isProd ? 'https' : 'http';
    const callbackUrl = `${protocol}://${backendHost}${isProd ? '' : ':' + backendPort}/api/media/hls-processor/callback`;
    
    // Generate job ID
    const jobId = `worker-job-${Date.now()}-${episodeId}`;
    
    logger.info(`Worker processing video: ${videoKey} for movie ${movieId}, episode ${episodeId}, jobId: ${jobId}`);
    
    // Use MediaService to add job to queue
    const result = await mediaService.processVideoFromWorker(
      videoKey, 
      movieId, 
      episodeId, 
      jobId,
      callbackUrl
    );
    
        
    // Return response immediately for Worker
    res.json({ 
      success: result.success,
      jobId: result.jobId,
      queuePosition: result.queuePosition,
      error: result.error
    });
  } catch (error: unknown) {
    logger.error('Error processing video with Docker:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Callback từ HLS Processor Container
export const hlsProcessorCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug("Received callback from HLS processor container");
    
    // Xác thực Secret từ header nếu cần
    const backendSecret = req.header('X-Backend-Secret');
    if (backendSecret !== 'alldrama-backend-secret') {
      logger.warn("Unauthorized callback - invalid backend secret");
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { status, movieId, episodeId, error, volumeName } = req.body;
    
    if (!status || !movieId || !episodeId) {
      logger.warn("Missing required fields in callback");
      res.status(400).json({ 
        success: false,
        error: "Missing required fields in callback request"
      });
      return;
    }
    
    logger.info(`HLS processing ${status} for movie ${movieId}, episode ${episodeId}`);
    
    if (status === 'completed') {
      // Cập nhật trạng thái và URL playlist
      const workerDomain = process.env.CLOUDFLARE_WORKER_DOMAIN || process.env.WORKER_DOMAIN;
      const playlistUrl = `https://${workerDomain}/episodes/${movieId}/${episodeId}/hls/master.m3u8`;
      
      await Episode.update(
        { 
          processingStatus: 'completed',
          playlistUrl: playlistUrl
        },
        { where: { id: episodeId } }
      );
      
      logger.info(`HLS processing completed for episode ${episodeId}, updated playlist URL: ${playlistUrl}`);
    } else if (status === 'error') {
      // Cập nhật trạng thái lỗi
      await Episode.update(
        { 
          processingStatus: 'failed'
        },
        { where: { id: episodeId } }
      );
      
      logger.error(`HLS processing failed for episode ${episodeId}: ${error}`);
    }
    
    // Cleanup volume sau khi xử lý xong (sử dụng tên volume đúng từ callback)
    if (volumeName) {
      await cleanupVolume(volumeName);
    } else {
      // Fallback cho trường hợp cũ
      logger.warn(`No volumeName provided in callback, attempting cleanup with pattern`);
      await cleanupVolumesByPattern(`hls-processor-data-${movieId}-${episodeId}`);
    }
    
    res.json({ 
      success: true,
      message: `HLS processing callback processed for episode ${episodeId}`
    });
  } catch (error: unknown) {
    logger.error('Error handling HLS processor callback:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Utility functions for Docker volume management
const createVolumeIfNotExists = async (volumeName: string): Promise<boolean> => {
  try {
    // Kiểm tra volume đã tồn tại chưa
    const { stdout } = await new Promise<{stdout: string, stderr: string}>((resolve, reject) => {
      exec(`docker volume ls --format "{{.Name}}" | grep "^${volumeName}$"`, (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });

    if (!stdout.trim()) {
      // Volume chưa tồn tại, tạo mới
      execSync(`docker volume create ${volumeName}`);
      logger.debug(`Created new Docker volume: ${volumeName}`);
      return true;
    }

    logger.debug(`Docker volume ${volumeName} already exists`);
    return true;
  } catch (error) {
    logger.error(`Error managing Docker volume ${volumeName}:`, error);
    return false;
  }
};

const cleanupVolume = async (volumeName: string): Promise<void> => {
  try {
    // Kiểm tra và kill các container đang sử dụng volume
    const { stdout: usingContainers } = await new Promise<{stdout: string, stderr: string}>((resolve) => {
      exec(`docker ps -q --filter volume=${volumeName}`, (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });

    if (usingContainers.trim()) {
      // Kill các container đang sử dụng volume
      execSync(`docker rm -f ${usingContainers.split('\n').join(' ')}`);
      logger.debug(`Removed containers using volume ${volumeName}`);
    }

    // Xóa volume
    execSync(`docker volume rm -f ${volumeName}`);
    logger.debug(`Removed Docker volume: ${volumeName}`);
  } catch (error) {
    logger.warn(`Error cleaning up Docker volume ${volumeName}:`, error);
  }
};

const checkVolumeSpace = async (volumeName: string): Promise<boolean> => {
  try {
    // Tạo container tạm để kiểm tra dung lượng
    const tempContainer = `space-check-${Date.now()}`;
    execSync(`docker run --rm -v ${volumeName}:/data --name ${tempContainer} alpine df -h /data`);
    
    // Phân tích output để kiểm tra dung lượng trống
    const { stdout } = await new Promise<{stdout: string, stderr: string}>((resolve) => {
      exec(`docker run --rm -v ${volumeName}:/data alpine df /data | tail -1 | awk '{print $4}'`, (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });

    const availableSpace = parseInt(stdout.trim());
    // Yêu cầu ít nhất 5GB trống
    return availableSpace > 5000000;
  } catch (error) {
    logger.error(`Error checking volume space for ${volumeName}:`, error);
    return false;
  }
};

const cleanupVolumesByPattern = async (pattern: string): Promise<void> => {
  try {
    // Tìm tất cả volume có tên chứa pattern
    const { stdout: volumes } = await new Promise<{stdout: string, stderr: string}>((resolve) => {
      exec(`docker volume ls --format "{{.Name}}" | grep "${pattern}"`, (error, stdout, stderr) => {
        resolve({ stdout, stderr });
      });
    });

    if (volumes.trim()) {
      const volumeList = volumes.trim().split('\n');
      for (const volume of volumeList) {
        await cleanupVolume(volume.trim());
      }
      logger.debug(`Cleaned up volumes matching pattern: ${pattern}`);
    } else {
      logger.debug(`No volumes found matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.warn(`Error cleaning up volumes by pattern ${pattern}:`, error);
  }
};

// Lấy trạng thái xử lý của tất cả tập phim trong một phim
export const getMovieProcessingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    
    // Lấy tất cả tập phim của phim
    const episodes = await Episode.findAll({
      where: { movieId: Number(movieId) },
      order: [['episodeNumber', 'ASC']],
      attributes: ['id', 'episodeNumber', 'title', 'processingStatus', 'playlistUrl', 'thumbnailUrl']
    });
    
    if (episodes.length === 0) {
      res.status(404).json({ 
        success: false, 
        error: 'Không tìm thấy tập phim nào cho phim này' 
      });
      return;
    }

    // Phân loại trạng thái
    const statusSummary = {
      total: episodes.length,
      completed: 0,
      processing: 0,
      pending: 0,
      failed: 0,
      unknown: 0
    };

    const episodeStatuses = episodes.map(episode => {
      const status = episode.processingStatus || 'unknown';
      statusSummary[status as keyof typeof statusSummary]++;
      
      return {
        episodeId: episode.id,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        processingStatus: status,
        playlistUrl: episode.playlistUrl,
        thumbnailUrl: episode.thumbnailUrl
      };
    });

    res.json({
      success: true,
      movieId: Number(movieId),
      summary: statusSummary,
      episodes: episodeStatuses
    });
  } catch (error) {
    logger.error('Lỗi khi lấy trạng thái xử lý của phim:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Lỗi khi lấy trạng thái xử lý của phim' 
    });
  }
};

/**
 * Liệt kê files trên R2 theo prefix (admin only)
 */
export const listR2Files = async (req: Request, res: Response): Promise<void> => {
  try {
    const prefix = req.params.prefix || '';
    
    logger.info(`Admin đang liệt kê files với prefix: ${prefix}`);
    
    const files = await listFiles(prefix);
    
    res.json({
      success: true,
      prefix,
      totalFiles: files.length,
      files: files.map(file => ({
        key: file,
        url: `https://${process.env.CLOUDFLARE_WORKER_DOMAIN || process.env.WORKER_DOMAIN}/${file}`
      }))
    });
  } catch (error) {
    logger.error('Error listing R2 files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa tất cả file theo prefix (admin only - NGUY HIỂM)
 */
export const deleteFilesByPrefix = async (req: Request, res: Response): Promise<void> => {
  try {
    const prefix = req.params.prefix;
    
    if (!prefix || prefix.length < 3) {
      res.status(400).json({
        success: false,
        error: 'Prefix quá ngắn hoặc không hợp lệ (tối thiểu 3 ký tự)'
      });
      return;
    }
    
    logger.warn(`Admin đang xóa tất cả files với prefix: ${prefix}`);
    
    const totalDeleted = await deleteFilesByPrefixR2(prefix);
    
    res.json({
      success: true,
      message: `Đã xóa thành công ${totalDeleted} files`,
      prefix,
      totalDeleted
    });
  } catch (error) {
    logger.error('Error deleting files by prefix:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa file đơn lẻ theo key (admin only)
 */
export const deleteR2File = async (req: Request, res: Response): Promise<void> => {
  try {
    const key = req.params.key;
    
    if (!key) {
      res.status(400).json({
        success: false,
        error: 'Key file không được để trống'
      });
      return;
    }
    
    logger.info(`Admin đang xóa file: ${key}`);
    
    await deleteFileFromR2(key);
    
    res.json({
      success: true,
      message: `Đã xóa file thành công`,
      key
    });
  } catch (error) {
    logger.error('Error deleting R2 file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    });
  }
}; 