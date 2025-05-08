import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

export interface PresignedUrlRequest {
  movieId?: number;
  episodeId?: number;
  fileType: 'poster' | 'backdrop' | 'trailer' | 'video' | 'thumbnail';
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  contentType: string;
  cdnUrl: string;
  expiresIn: number;
}

export interface ProcessingStatusResponse {
  episodeId: number;
  isProcessed: boolean;
  processingError: string | null;
  playlistUrl: string;
  thumbnailUrl: string;
}

export const mediaService = {
  /**
   * Upload hình ảnh poster cho phim
   * @param movieId ID của phim
   * @param file File hình ảnh
   */
  async uploadPoster(
    movieId: string | number,
    file: File
  ): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append('poster', file);

    return apiClient.post<{ url: string; message: string }>(
      API_ENDPOINTS.MEDIA.UPLOAD_POSTER(movieId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Upload hình nền (backdrop) cho phim
   * @param movieId ID của phim
   * @param file File hình ảnh
   */
  async uploadBackdrop(
    movieId: string | number,
    file: File
  ): Promise<{ url: string; message: string }> {
    const formData = new FormData();
    formData.append('backdrop', file);

    return apiClient.post<{ url: string; message: string }>(
      API_ENDPOINTS.MEDIA.UPLOAD_BACKDROP(movieId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Upload trailer cho phim
   * @param movieId ID của phim
   * @param file File video
   */
  async uploadTrailer(
    movieId: string | number,
    file: File
  ): Promise<{ trailerUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('trailer', file);

    return apiClient.post<{ trailerUrl: string; message: string }>(
      API_ENDPOINTS.MEDIA.UPLOAD_TRAILER(movieId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Upload video cho tập phim
   * @param movieId ID của phim
   * @param episodeId ID của tập phim
   * @param file File video
   */
  async uploadEpisodeVideo(
    movieId: string | number,
    episodeId: string | number,
    file: File
  ): Promise<{
    originalUrl: string;
    thumbnailUrl: string;
    processingStatus: string;
    estimatedDuration: number;
    message: string;
  }> {
    const formData = new FormData();
    formData.append('video', file);

    return apiClient.post<{
      originalUrl: string;
      thumbnailUrl: string;
      processingStatus: string;
      estimatedDuration: number;
      message: string;
    }>(API_ENDPOINTS.MEDIA.UPLOAD_EPISODE_VIDEO(movieId, episodeId), 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },

  /**
   * Lấy presigned URL để upload trực tiếp
   * @param data Dữ liệu yêu cầu
   */
  async getPresignedUrl(
    data: PresignedUrlRequest
  ): Promise<PresignedUrlResponse> {
    return apiClient.post<PresignedUrlResponse>(
      API_ENDPOINTS.MEDIA.PRESIGNED_URL,
      data
    );
  },

  /**
   * Xóa media của phim
   * @param movieId ID của phim
   * @param mediaType Loại media (poster, backdrop, trailer)
   */
  async deleteMedia(
    movieId: string | number,
    mediaType: 'poster' | 'backdrop' | 'trailer'
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.MEDIA.DELETE_MEDIA(movieId, mediaType)
    );
  },

  /**
   * Xóa tập phim và tất cả file liên quan
   * @param movieId ID của phim
   * @param episodeId ID của tập phim
   */
  async deleteEpisode(
    movieId: string | number,
    episodeId: string | number
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.MEDIA.DELETE_EPISODE(movieId, episodeId)
    );
  },

  /**
   * Xóa phim và tất cả tập phim, file liên quan
   * @param movieId ID của phim
   */
  async deleteMovie(
    movieId: string | number
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.MEDIA.DELETE_MOVIE(movieId)
    );
  },

  /**
   * Kiểm tra trạng thái xử lý video của tập phim
   * @param episodeId ID của tập phim
   */
  async getProcessingStatus(
    episodeId: string | number
  ): Promise<ProcessingStatusResponse> {
    return apiClient.get<ProcessingStatusResponse>(
      API_ENDPOINTS.MEDIA.PROCESSING_STATUS(episodeId)
    );
  },

  /**
   * Liệt kê các file trong R2 Storage theo prefix (chỉ dùng cho debugging)
   * @param prefix Tiền tố đường dẫn cần liệt kê
   */
  async listFiles(
    prefix: string
  ): Promise<{ files: string[] }> {
    return apiClient.get<{ files: string[] }>(
      API_ENDPOINTS.MEDIA.LIST_FILES(prefix)
    );
  },

  /**
   * Lấy URL đầy đủ cho tài nguyên media
   * @param path Đường dẫn tương đối của tài nguyên
   */
  getImageUrl(path?: string): string {
    if (!path) return '';
    
    // Nếu đã là URL đầy đủ, trả về nguyên bản
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Dùng API base URL từ biến môi trường hoặc giá trị mặc định
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
};