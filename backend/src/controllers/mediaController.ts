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
  uploadDirectoryToR2
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
      res.status(400).json({ message: 'Không tìm thấy file' });
      return;
    }
    
    // Sử dụng MediaService để upload video và tạo thumbnail
    const result = await mediaService.uploadEpisodeVideo(Number(movieId), Number(episodeId), file);
    
    // Bắt đầu xử lý HLS
    res.status(202).json({
      message: 'Đã nhận video, đang xử lý HLS',
      originalUrl: result.originalUrl,
      thumbnailUrl: result.thumbnailUrl,
      processingStatus: result.processingStatus,
      estimatedDuration: result.duration
    });
    
    // Tạo thư mục HLS output
    const hlsOutputDir = path.join(os.tmpdir(), `hls-${episodeId}`);
    if (!fs.existsSync(hlsOutputDir)) {
      fs.mkdirSync(hlsOutputDir, { recursive: true });
    }
    
    // Xử lý HLS bất đồng bộ sau khi đã trả về response
    mediaService.processVideoToHLS(file.path, movieId, episodeId)
      .then(async (hlsResult) => {
        logger.debug('HLS xử lý thành công:', hlsResult);
      })
      .catch(error => {
        logger.error(`Lỗi khi xử lý HLS cho episode ${episodeId}:`, error);
      });
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