import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { mediaService, PresignedUrlRequest, ProcessingStatusResponse } from '@/lib/api/services/mediaService';

export const useMedia = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  // Upload poster for movie
  const uploadPoster = useCallback(async (movieId: string | number, file: File): Promise<string | null> => {
    if (!file) {
      setError('Không có file được chọn');
      return null;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ file ảnh (jpeg, jpg, png, webp)');
      toast.error('Chỉ hỗ trợ file ảnh (jpeg, jpg, png, webp)');
      return null;
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Kích thước file không được vượt quá 5MB');
      toast.error('Kích thước file không được vượt quá 5MB');
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate upload progress (since we don't have real progress events)
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prevProgress + 10;
        });
      }, 300);

      const response = await mediaService.uploadPoster(movieId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);
      
      toast.success('Đã tải poster lên thành công');
      return response.url;
    } catch (err) {
      setError('Không thể tải poster lên');
      toast.error('Không thể tải poster lên');
      setUploading(false);
      setProgress(0);
      return null;
    }
  }, []);

  // Upload backdrop for movie
  const uploadBackdrop = useCallback(async (movieId: string | number, file: File): Promise<string | null> => {
    if (!file) {
      setError('Không có file được chọn');
      return null;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ file ảnh (jpeg, jpg, png, webp)');
      toast.error('Chỉ hỗ trợ file ảnh (jpeg, jpg, png, webp)');
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prevProgress + 10;
        });
      }, 300);

      const response = await mediaService.uploadBackdrop(movieId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);
      
      toast.success('Đã tải backdrop lên thành công');
      return response.url;
    } catch (err) {
      setError('Không thể tải backdrop lên');
      toast.error('Không thể tải backdrop lên');
      setUploading(false);
      setProgress(0);
      return null;
    }
  }, []);

  // Upload trailer for movie
  const uploadTrailer = useCallback(async (movieId: string | number, file: File): Promise<string | null> => {
    if (!file) {
      setError('Không có file được chọn');
      return null;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ file video MP4, WebM');
      toast.error('Chỉ hỗ trợ file video MP4, WebM');
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prevProgress + 10;
        });
      }, 300);

      const response = await mediaService.uploadTrailer(movieId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);
      
      toast.success('Đã tải trailer lên thành công');
      return response.trailerUrl;
    } catch (err) {
      setError('Không thể tải trailer lên');
      toast.error('Không thể tải trailer lên');
      setUploading(false);
      setProgress(0);
      return null;
    }
  }, []);

  // Upload video for episode
  const uploadEpisodeVideo = useCallback(async (
    movieId: string | number, 
    episodeId: string | number, 
    file: File
  ): Promise<{
    originalUrl: string;
    thumbnailUrl: string;
    processingStatus: string;
  } | null> => {
    if (!file) {
      setError('Không có file được chọn');
      return null;
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ file video MP4, WebM, MKV');
      toast.error('Chỉ hỗ trợ file video MP4, WebM, MKV');
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setProcessingStatus('processing');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prevProgress + 5;
        });
      }, 500);

      const response = await mediaService.uploadEpisodeVideo(movieId, episodeId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);
      
      toast.success('Đã tải video lên thành công, đang xử lý');
      
      return {
        originalUrl: response.originalUrl,
        thumbnailUrl: response.thumbnailUrl,
        processingStatus: response.processingStatus
      };
    } catch (err) {
      setError('Không thể tải video lên');
      toast.error('Không thể tải video lên');
      setUploading(false);
      setProgress(0);
      setProcessingStatus('failed');
      return null;
    }
  }, []);

  // Get presigned URL for direct upload
  const getPresignedUrl = useCallback(async (
    data: PresignedUrlRequest
  ): Promise<{ presignedUrl: string; cdnUrl: string } | null> => {
    try {
      const response = await mediaService.getPresignedUrl(data);
      return {
        presignedUrl: response.presignedUrl,
        cdnUrl: response.cdnUrl
      };
    } catch (err) {
      setError('Không thể lấy presigned URL');
      toast.error('Không thể lấy presigned URL');
      return null;
    }
  }, []);

  // Delete media
  const deleteMedia = useCallback(async (
    movieId: string | number,
    mediaType: 'poster' | 'backdrop' | 'trailer'
  ): Promise<boolean> => {
    try {
      await mediaService.deleteMedia(movieId, mediaType);
      toast.success(`Đã xóa ${mediaType} thành công`);
      return true;
    } catch (err) {
      toast.error(`Không thể xóa ${mediaType}`);
      return false;
    }
  }, []);

  // Delete episode
  const deleteEpisode = useCallback(async (
    movieId: string | number,
    episodeId: string | number
  ): Promise<boolean> => {
    try {
      await mediaService.deleteEpisode(movieId, episodeId);
      toast.success('Đã xóa tập phim thành công');
      return true;
    } catch (err) {
      toast.error('Không thể xóa tập phim');
      return false;
    }
  }, []);

  // Delete movie
  const deleteMovie = useCallback(async (
    movieId: string | number
  ): Promise<boolean> => {
    try {
      await mediaService.deleteMovie(movieId);
      toast.success('Đã xóa phim thành công');
      return true;
    } catch (err) {
      toast.error('Không thể xóa phim');
      return false;
    }
  }, []);

  // Check video processing status
  const checkProcessingStatus = useCallback(async (
    episodeId: string | number
  ): Promise<ProcessingStatusResponse | null> => {
    try {
      return await mediaService.getProcessingStatus(episodeId);
    } catch (err) {
      console.error('Không thể kiểm tra trạng thái xử lý video', err);
      return null;
    }
  }, []);

  // Get image URL helper
  const getImageUrl = useCallback((path?: string): string => {
    return mediaService.getImageUrl(path);
  }, []);

  return {
    uploading,
    progress,
    error,
    processingStatus,
    uploadPoster,
    uploadBackdrop,
    uploadTrailer,
    uploadEpisodeVideo,
    getPresignedUrl,
    deleteMedia,
    deleteEpisode,
    deleteMovie,
    checkProcessingStatus,
    getImageUrl,
    reset: () => {
      setUploading(false);
      setProgress(0);
      setError(null);
      setProcessingStatus('idle');
    },
  };
};