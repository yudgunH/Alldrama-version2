import { Logger } from '../utils/logger';
import { Request, Response } from 'express';
import hlsQueueService, { HLSJobData } from '../services/queue/hlsQueueService';

const logger = Logger.getLogger('QueueController');

/**
 * Thêm job HLS vào queue
 */
export const addHLSJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoKey, movieId, episodeId, priority } = req.body;

    if (!videoKey || !movieId || !episodeId) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: videoKey, movieId, episodeId'
      });
      return;
    }

    const jobId = `hls-job-${Date.now()}-${episodeId}`;
    
    const jobData: HLSJobData = {
      videoKey,
      movieId: parseInt(movieId),
      episodeId: parseInt(episodeId),
      jobId,
      priority: priority || 0
    };

    const job = await hlsQueueService.addHLSJob(jobData);

    res.json({
      success: true,
      jobId: job.id,
      message: 'Job added to queue successfully',
      queuePosition: await getQueuePosition(job.id as string)
    });

  } catch (error) {
    logger.error('Error adding HLS job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Lấy thông tin trạng thái queue
 */
export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const queueInfo = await hlsQueueService.getQueueInfo();
    
    res.json({
      success: true,
      queue: queueInfo,
      concurrency: parseInt(process.env.HLS_QUEUE_CONCURRENCY || '2'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Lấy thông tin job cụ thể
 */
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: 'Missing jobId parameter'
      });
      return;
    }

    const job = await hlsQueueService.getJob(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    const jobInfo = {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      attemptsMade: job.attemptsMade,
      attemptsMax: job.opts.attempts
    };

    res.json({
      success: true,
      job: jobInfo
    });

  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Hủy job
 */
export const cancelJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: 'Missing jobId parameter'
      });
      return;
    }

    const cancelled = await hlsQueueService.cancelJob(jobId);

    if (!cancelled) {
      res.status(404).json({
        success: false,
        error: 'Job not found or cannot be cancelled'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    logger.error('Error cancelling job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Retry job thất bại
 */
export const retryJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        error: 'Missing jobId parameter'
      });
      return;
    }

    const job = await hlsQueueService.getJob(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
      return;
    }

    const state = await job.getState();
    if (state !== 'failed') {
      res.status(400).json({
        success: false,
        error: 'Only failed jobs can be retried'
      });
      return;
    }

    await job.retry();

    res.json({
      success: true,
      message: 'Job queued for retry'
    });

  } catch (error) {
    logger.error('Error retrying job:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Lấy vị trí của job trong queue
 */
async function getQueuePosition(jobId: string): Promise<number | null> {
  try {
    const waitingJobs = await hlsQueueService.getQueue().getWaiting();
    const position = waitingJobs.findIndex(job => job.id === jobId);
    return position >= 0 ? position + 1 : null;
  } catch (error) {
    logger.error('Error getting queue position:', error);
    return null;
  }
}

/**
 * Lấy danh sách jobs theo trạng thái
 */
export const getJobsByState = async (req: Request, res: Response): Promise<void> => {
  try {
    const { state } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!['waiting', 'active', 'completed', 'failed', 'delayed'].includes(state)) {
      res.status(400).json({
        success: false,
        error: 'Invalid state. Must be one of: waiting, active, completed, failed, delayed'
      });
      return;
    }

    let jobs: any[] = [];
    const queue = hlsQueueService.getQueue();

    switch (state) {
      case 'waiting':
        jobs = await queue.getWaiting(Number(offset), Number(offset) + Number(limit));
        break;
      case 'active':
        jobs = await queue.getActive(Number(offset), Number(offset) + Number(limit));
        break;
      case 'completed':
        jobs = await queue.getCompleted(Number(offset), Number(offset) + Number(limit));
        break;
      case 'failed':
        jobs = await queue.getFailed(Number(offset), Number(offset) + Number(limit));
        break;
      case 'delayed':
        jobs = await queue.getDelayed(Number(offset), Number(offset) + Number(limit));
        break;
    }

    const jobsData = await Promise.all(jobs.map(async (job: any) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      createdAt: new Date(job.timestamp),
      processedOn: job.processedOn ? new Date(job.processedOn) : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : null,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade
    })));

    res.json({
      success: true,
      jobs: jobsData,
      state,
      total: jobsData.length,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (error) {
    logger.error('Error getting jobs by state:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Pause/Resume queue
 */
export const toggleQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action } = req.body; // 'pause' hoặc 'resume'

    if (!action || !['pause', 'resume'].includes(action)) {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "pause" or "resume"'
      });
      return;
    }

    const queue = hlsQueueService.getQueue();

    if (action === 'pause') {
      await queue.pause();
      logger.info('Queue paused');
    } else {
      await queue.resume();
      logger.info('Queue resumed');
    }

    res.json({
      success: true,
      message: `Queue ${action}d successfully`,
      isPaused: await queue.isPaused()
    });

  } catch (error) {
    logger.error('Error toggling queue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 