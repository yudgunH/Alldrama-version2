import { Logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { 
  uploadFileToR2, 
  generatePresignedUrl, 
  deleteFileFromR2,
  deleteHlsFiles,
  downloadFromR2,
  uploadDirectoryToR2,
  downloadFromR2AsBuffer
} from './r2Service';
import { 
  convertToHls, 
  createThumbnail, 
  getVideoMetadata 
} from './hlsService';
import { Episode } from '../../models/Episode';
import { Movie } from '../../models/Movie';
import { UserWatchHistory } from '../../models/UserWatchHistory';
import sequelize from '../../config/database';
import os from 'os';

const logger = Logger.getLogger('MediaService');

/**
 * Service xử lý media (ảnh, video)
 */
export class MediaService {
  private readonly logger = Logger.getLogger('MediaService');

  /**
   * Upload poster cho phim
   */
  public async uploadMoviePoster(movieId: number, file: Express.Multer.File): Promise<string> {
    try {
      // Tạo key cho file trên R2
      const key = `movies/${movieId}/poster${path.extname(file.originalname)}`;
      
      // Upload lên R2
      const fileUrl = await uploadFileToR2(file.path, key, file.mimetype);
      
      // Cập nhật URL trong database
      await Movie.update({ posterUrl: fileUrl }, { where: { id: movieId } });
      
      // Xóa file tạm
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return fileUrl;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      throw error;
    }
  }
  
  /**
   * Upload backdrop cho phim
   */
  public async uploadMovieBackdrop(movieId: number, file: Express.Multer.File): Promise<string> {
    try {
      // Tạo key cho file trên R2
      const key = `movies/${movieId}/backdrop${path.extname(file.originalname)}`;
      
      // Upload lên R2
      const fileUrl = await uploadFileToR2(file.path, key, file.mimetype);
      
      // Cập nhật URL trong database
      await Movie.update({ backdropUrl: fileUrl }, { where: { id: movieId } });
      
      // Xóa file tạm
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return fileUrl;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      throw error;
    }
  }
  
  /**
   * Upload video trailer cho phim
   */
  public async uploadMovieTrailer(movieId: number, file: Express.Multer.File): Promise<string> {
    try {
      // Tạo key cho file trên R2
      const key = `movies/${movieId}/trailer${path.extname(file.originalname)}`;
      
      // Upload lên R2
      const fileUrl = await uploadFileToR2(file.path, key, file.mimetype);
      
      // Cập nhật URL trong database
      await Movie.update({ trailerUrl: fileUrl }, { where: { id: movieId } });
      
      // Xóa file tạm
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return fileUrl;
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      throw error;
    }
  }
  
  /**
   * Upload video tập phim
   */
  public async uploadEpisodeVideo(movieId: number, episodeId: number, file: Express.Multer.File): Promise<{ 
    originalUrl: string;
    thumbnailUrl: string;
    duration: number;
    processingStatus: string;
  }> {
    try {
      // Tạo key cho file trên R2 (thống nhất với cấu trúc trong controller)
      const originalKey = `episodes/${movieId}/${episodeId}/original${path.extname(file.originalname)}`;
      
      // Upload video gốc lên R2
      const originalUrl = await uploadFileToR2(file.path, originalKey, file.mimetype);
      
      // Tạo thumbnail
      const thumbnailPath = path.join(os.tmpdir(), `thumbnail-${episodeId}.jpg`);
      await createThumbnail(file.path, thumbnailPath);
      
      // Upload thumbnail lên R2
      const thumbnailKey = `episodes/${movieId}/${episodeId}/thumbnail.jpg`;
      const thumbnailUrl = await uploadFileToR2(thumbnailPath, thumbnailKey, 'image/jpeg');
      
      // Lấy metadata video để biết thời lượng
      const metadata = await getVideoMetadata(file.path);
      const duration = Math.floor(parseFloat(metadata.format?.duration || '0'));
      
      // Cập nhật thông tin video vào database (chưa đánh dấu là đã xử lý HLS)
      await Episode.update({ 
        videoUrl: originalUrl,
        thumbnailUrl,
        duration,
        isProcessed: false 
      }, { where: { id: episodeId } });
      
      // Xóa file tạm
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
      } catch (error) {
        logger.error('Lỗi khi xóa file tạm:', error);
      }
      
      return {
        originalUrl,
        thumbnailUrl,
        duration,
        processingStatus: 'processing'
      };
    } catch (error) {
      // Xóa file tạm nếu có lỗi
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (e) {
        logger.error('Lỗi khi xóa file tạm:', e);
      }
      
      throw error;
    }
  }
  
  /**
   * Xử lý chuyển đổi video sang định dạng HLS
   */
  public async processVideoToHLS(videoPath: string, movieId: number | string, episodeId: number | string, jobId?: string): Promise<{
    success: boolean;
    playlistUrl?: string;
    thumbnailUrl?: string;
    error?: string;
  }> {
    try {
      logger.info(`Bắt đầu xử lý HLS cho video: episodeId=${episodeId}, movieId=${movieId}`);
      
      // Tạo thư mục tạm để xử lý
      const tempDir = path.join(os.tmpdir(), `hls-${jobId || Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      const outputDir = path.join(tempDir, 'hls');
      fs.mkdirSync(outputDir, { recursive: true });
      
      // Nếu videoPath là key trên R2, tải xuống trước
      let localVideoPath = videoPath;
      let needToCleanupVideo = false;
      
      if (videoPath.startsWith('episodes/')) {
        try {
          localVideoPath = path.join(tempDir, 'original.mp4');
          // Thử tải video tối đa 3 lần trước khi bỏ cuộc
          let downloadSuccess = false;
          let lastError: any = null;
          
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              logger.info(`Tải video từ R2, lần thử ${attempt}/3: ${videoPath}`);
              await downloadFromR2(videoPath, localVideoPath);
              
              // Đảm bảo file đã được tải xuống thành công và có kích thước > 0
              const stats = fs.statSync(localVideoPath);
              if (stats.size === 0) {
                throw new Error('File tải về có kích thước 0 byte');
              }
              
              logger.info(`Đã tải video từ R2 thành công, kích thước: ${stats.size} bytes`);
              downloadSuccess = true;
              break;
            } catch (attemptError) {
              lastError = attemptError;
              logger.warn(`Lỗi khi tải video từ R2 (lần ${attempt}/3):`, attemptError);
              // Đợi 2 giây trước khi thử lại
              if (attempt < 3) {
                logger.info(`Đợi 2 giây trước khi thử lại...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
          
          if (!downloadSuccess) {
            throw new Error(`Không thể tải video sau 3 lần thử: ${lastError?.message || 'Lỗi không xác định'}`);
          }
          
          needToCleanupVideo = true;
        } catch (downloadError) {
          logger.error(`Lỗi khi tải video từ R2: ${downloadError}`);
          
          // Cập nhật trạng thái lỗi cho episode
          await Episode.update(
            {
              isProcessed: false,
              processingError: `Lỗi khi tải video: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
            },
            { where: { id: episodeId, movieId } }
          );
          
          throw new Error(`Không thể tải video từ R2: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`);
        }
      }
      
      // Tạo thumbnail nếu chưa có
      const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');
      await createThumbnail(localVideoPath, thumbnailPath);
      logger.info('Đã tạo thumbnail');
      
      // Upload thumbnail lên R2
      const thumbnailKey = `episodes/${movieId}/${episodeId}/thumbnail.jpg`;
      const thumbnailUrl = await uploadFileToR2(thumbnailPath, thumbnailKey, 'image/jpeg');
      logger.info('Đã upload thumbnail lên R2');
      
      // Chuyển đổi video sang HLS
      await convertToHls(localVideoPath, outputDir, movieId, episodeId);
      logger.info('Đã hoàn thành chuyển đổi HLS');
      
      // Tạo URL playlist - Sử dụng domain Worker
      const playlistUrl = `https://${process.env.CLOUDFLARE_WORKER_DOMAIN || process.env.WORKER_DOMAIN}/episodes/${movieId}/${episodeId}/hls/master.m3u8`;
      
      // Cập nhật trạng thái episode trong database
      await Episode.update(
        {
          isProcessed: true,
          processingError: null,
          playlistUrl,
          thumbnailUrl
        },
        { where: { id: episodeId, movieId } }
      );
      
      // Kiểm tra xem update đã được thực hiện thành công chưa
      const updatedEpisode = await Episode.findOne({ where: { id: episodeId, movieId } });
      this.logger.info(`Đã cập nhật trạng thái episode ${episodeId} thành đã xử lý. playlistUrl: ${updatedEpisode?.playlistUrl}, thumbnailUrl: ${updatedEpisode?.thumbnailUrl}`);
      
      // Nếu playlistUrl hoặc thumbnailUrl chưa được cập nhật, thử cập nhật lại
      if (!updatedEpisode?.playlistUrl || !updatedEpisode?.thumbnailUrl) {
        this.logger.warn(`URLs chưa được cập nhật đúng cho episode ${episodeId}, thử cập nhật lại`);
        try {
          await this.updateEpisodeWithMediaUrls(Number(episodeId), playlistUrl, thumbnailUrl);
        } catch (updateError) {
          this.logger.error(`Lỗi khi cập nhật lại URLs:`, updateError);
        }
      }
      
      // Dọn dẹp thư mục tạm
      try {
        if (needToCleanupVideo && fs.existsSync(localVideoPath)) fs.unlinkSync(localVideoPath);
        if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        logger.debug(`Đã dọn dẹp thư mục tạm: ${tempDir}`);
      } catch (cleanupError) {
        logger.warn('Lỗi khi dọn dẹp thư mục tạm:', cleanupError);
      }
      
      return {
        success: true,
        playlistUrl,
        thumbnailUrl
      };
    } catch (error) {
      logger.error('Lỗi khi xử lý video HLS:', error);
      
      // Cập nhật trạng thái lỗi
      try {
        await Episode.update(
          {
            isProcessed: false,
            processingError: error instanceof Error ? error.message : 'Lỗi không xác định'
          },
          { where: { id: episodeId, movieId } }
        );
      } catch (dbError) {
        logger.error('Lỗi khi cập nhật trạng thái lỗi cho episode:', dbError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }
  
  /**
   * Gửi callback đến Worker khi xử lý HLS hoàn tất
   */
  private async sendCallbackToWorker(
    callbackUrl: string, 
    status: 'completed' | 'error', 
    movieId: number | string, 
    episodeId: number | string, 
    jobId: string,
    error?: string
  ): Promise<boolean> {
    try {
      logger.info(`Gửi callback đến Worker: ${callbackUrl}`);
      
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Backend-Secret': process.env.BACKEND_SECRET || 'alldrama-backend-secret'
        },
        body: JSON.stringify({
          status,
          movieId,
          episodeId,
          jobId,
          error
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Callback không thành công: ${errorData}`);
      }
      
      logger.info(`Callback thành công cho jobId=${jobId}`);
      return true;
    } catch (error) {
      logger.error(`Lỗi khi gửi callback: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Xử lý HLS cho video đã upload
   * Phương thức này được gọi từ Worker API
   */
  public async processVideoFromWorker(
    videoKey: string, 
    movieId: number | string, 
    episodeId: number | string, 
    jobId: string,
    callbackUrl?: string
  ): Promise<{
    success: boolean;
    jobId: string;
    error?: string;
  }> {
    try {
      logger.info(`Xử lý yêu cầu Worker cho video: ${videoKey}, movieId=${movieId}, episodeId=${episodeId}, jobId=${jobId}`);
      
      // Cập nhật trạng thái episode là đang xử lý
      await Episode.update(
        { isProcessed: false, processingError: null },
        { where: { id: episodeId, movieId } }
      );
      
      // Xử lý bất đồng bộ nếu có callbackUrl
      if (callbackUrl) {
        (async () => {
          try {
            const result = await this.processVideoToHLS(videoKey, movieId, episodeId, jobId);
            
            // Gửi callback khi hoàn thành
            await this.sendCallbackToWorker(
              callbackUrl, 
              result.success ? 'completed' : 'error', 
              movieId, 
              episodeId, 
              jobId,
              result.error
            );
            
            logger.info(`Đã hoàn thành xử lý HLS cho jobId=${jobId}, kết quả=${result.success}`);
          } catch (error) {
            logger.error(`Lỗi khi xử lý HLS bất đồng bộ cho jobId=${jobId}:`, error);
            
            // Gửi callback báo lỗi
            if (callbackUrl) {
              await this.sendCallbackToWorker(
                callbackUrl, 
                'error', 
                movieId, 
                episodeId, 
                jobId,
                error instanceof Error ? error.message : 'Lỗi không xác định'
              );
            }
          }
        })();
      } else {
        // Xử lý đồng bộ nếu không có callbackUrl
        this.processVideoToHLS(videoKey, movieId, episodeId, jobId)
          .then(result => {
            logger.info(`Đã hoàn thành xử lý HLS cho jobId=${jobId}, kết quả=${result.success}`);
          })
          .catch(error => {
            logger.error(`Lỗi khi xử lý HLS cho jobId=${jobId}:`, error);
          });
      }
      
      return {
        success: true,
        jobId
      };
    } catch (error) {
      logger.error('Lỗi khi xử lý yêu cầu từ Worker:', error);
      return {
        success: false,
        jobId,
        error: error instanceof Error ? error.message : 'Lỗi không xác định'
      };
    }
  }
  
  /**
   * Xóa media
   */
  public async deleteMedia(fileUrl: string): Promise<boolean> {
    try {
      // Trích xuất key từ URL
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Bỏ dấu / ở đầu
      
      // Xóa file trên R2
      await deleteFileFromR2(key);
      
      return true;
    } catch (error) {
      logger.error('Lỗi khi xóa media:', error);
      return false;
    }
  }
  
  /**
   * Tạo presigned URL cho upload trực tiếp
   */
  public async getPresignedUploadUrl(type: string, id: number, fileName: string, episodeId?: number, expiresIn: number = 3600): Promise<string> {
    // Tạo key dựa trên loại và ID
    let key = '';
    
    if (type === 'movie-poster') {
      key = `movies/${id}/poster${path.extname(fileName)}`;
    } else if (type === 'movie-backdrop') {
      key = `movies/${id}/backdrop${path.extname(fileName)}`;
    } else if (type === 'movie-trailer') {
      key = `movies/${id}/trailer${path.extname(fileName)}`;
    } else if (type === 'episode-video') {
      // Sử dụng movieId và episodeId riêng biệt thay vì tách chuỗi
      // Kiểm tra nếu có episodeId được truyền vào
      const episodeIdValue = episodeId || id; // Nếu không có episodeId riêng, sử dụng id
      console.log('Creating episode key:', { id, episodeId: episodeIdValue });
      key = `episodes/${id}/${episodeIdValue}/original${path.extname(fileName)}`;
    } else {
      throw new Error('Loại tài nguyên không hợp lệ');
    }
    
    // Tạo presigned URL với thời hạn được chỉ định
    const presignedUrl = await generatePresignedUrl(key, path.extname(fileName), expiresIn);
    
    return presignedUrl;
  }
  
  /**
   * Xóa tất cả media của một tập phim
   */
  public async deleteEpisodeMedia(movieId: number | string, episodeId: number | string): Promise<boolean> {
    try {
      // Xóa video gốc
      try {
        await deleteFileFromR2(`episodes/${movieId}/${episodeId}/original.mp4`);
      } catch (err) {
        logger.warn(`Cảnh báo: Không thể xóa video gốc của tập ${episodeId}:`, err);
      }
      
      // Xóa thumbnail
      try {
        await deleteFileFromR2(`episodes/${movieId}/${episodeId}/thumbnail.jpg`);
      } catch (err) {
        logger.warn(`Cảnh báo: Không thể xóa thumbnail của tập ${episodeId}:`, err);
      }
      
      // Xóa tất cả file HLS
      try {
        await deleteHlsFiles(movieId, episodeId);
      } catch (err) {
        logger.warn(`Cảnh báo: Không thể xóa một số file HLS của tập ${episodeId}:`, err);
      }
      
      return true;
    } catch (error) {
      logger.error(`Lỗi khi xóa media của tập phim ${episodeId}:`, error);
      return false;
    }
  }
  
  /**
   * Kiểm tra trạng thái xử lý video
   */
  public async getVideoProcessingStatus(episodeId: number): Promise<{
    episodeId: number;
    isProcessed: boolean;
    processingError: string | null;
    playlistUrl: string | null;
    thumbnailUrl: string | null;
    processingStatus?: string;
    progress?: number;
    lastUpdated?: string;
    jobMetadata?: any;
  }> {
    const episode = await Episode.findByPk(episodeId);
    
    if (!episode) {
      throw new Error('Không tìm thấy tập phim');
    }

    // Thông tin cơ bản từ database
    const basicStatus = {
      episodeId,
      isProcessed: episode.isProcessed,
      processingError: episode.processingError,
      playlistUrl: episode.playlistUrl,
      thumbnailUrl: episode.thumbnailUrl,
      processingStatus: episode.processingStatus || 'unknown'
    };

    // Nếu đang xử lý, lấy thêm thông tin chi tiết từ job-metadata
    if (episode.processingStatus === 'processing' || episode.processingStatus === 'pending') {
      try {
        // Lấy movieId từ episode
        const movieId = episode.movieId;
        
        // Tải job-metadata từ R2
        const metadataKey = `episodes/${movieId}/${episodeId}/hls/job-metadata.json`;
        
        const metadataBuffer = await downloadFromR2AsBuffer(metadataKey);
        const jobMetadata = JSON.parse(metadataBuffer.toString());
        
        return {
          ...basicStatus,
          progress: jobMetadata.progress || 0,
          lastUpdated: jobMetadata.lastUpdated,
          jobMetadata: {
            status: jobMetadata.status,
            progress: jobMetadata.progress,
            error: jobMetadata.error,
            thumbnailUrl: jobMetadata.thumbnailUrl,
            masterPlaylistUrl: jobMetadata.masterPlaylistUrl,
            lastUpdated: jobMetadata.lastUpdated
          }
        };
      } catch (metadataError) {
        // Nếu không lấy được metadata, chỉ trả về thông tin cơ bản
        this.logger.warn(`Không thể lấy job metadata cho episode ${episodeId}:`, metadataError);
      }
    }
    
    return basicStatus;
  }

  /**
   * Cập nhật URL playlist và thumbnail cho episode sau khi xử lý HLS
   */
  private async updateEpisodeWithMediaUrls(episodeId: number, playlistUrl?: string, thumbnailUrl?: string): Promise<void> {
    try {
      const updateData: any = {};
      
      if (playlistUrl) {
        updateData.playlistUrl = playlistUrl;
      }
      
      if (thumbnailUrl) {
        updateData.thumbnailUrl = thumbnailUrl;
      }
      
      // Chỉ cập nhật khi có dữ liệu
      if (Object.keys(updateData).length > 0) {
        await Episode.update(updateData, {
          where: { id: episodeId }
        });
        
        this.logger.info(`Đã cập nhật URLs cho episode ${episodeId}:`, updateData);
      }
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật URLs cho episode ${episodeId}:`, error);
      throw error;
    }
  }
} 