import { useCallback } from 'react';
import useSWR from 'swr';
import { viewService, ViewResponse, ViewStats } from '@/lib/api/services/viewService';
import { useApiCache } from './useApiCache';
import { toast } from 'react-hot-toast';

export const useViews = () => {
  const { clearCache } = useApiCache();

  // Xóa cache cho lượt xem
  const clearViewCache = useCallback(() => {
    clearCache('views');
  }, [clearCache]);

  // Hook lấy lượt xem phim
  const useMovieViews = (movieId: string | number | null) => {
    const { data, error, isLoading, mutate } = useSWR(
      movieId ? `views/movie/${movieId}` : null,
      () => movieId ? viewService.getMovieViews(movieId) : null,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    // Tăng lượt xem phim với throttling
    const incrementView = useCallback(async (progress: number = 0, duration: number = 0) => {
      if (!movieId) return null;
      
      try {
        const result = await viewService.incrementMovieView(movieId, progress, duration);
        
        // Hiển thị thông báo nếu bị throttle
        if (!result.success) {
          toast.error(result.message);
          return result;
        }
        
        // Cập nhật cache SWR nếu thành công
        if (result.success && result.views !== undefined) {
          mutate({ views: result.views }, false);
        } else {
          // Refresh data từ server
          mutate();
        }
        
        return result;
      } catch (error) {
        console.error('Lỗi khi tăng lượt xem phim:', error);
        toast.error('Không thể cập nhật lượt xem');
        throw error;
      }
    }, [movieId, mutate]);

    // Kiểm tra có thể increment view không
    const canIncrement = useCallback(() => {
      return movieId ? viewService.canIncrementView(movieId) : false;
    }, [movieId]);

    return {
      views: data?.views,
      isLoading,
      isError: error,
      incrementView,
      canIncrement,
      mutate,
    };
  };

  // Hook lấy lượt xem tập phim
  const useEpisodeViews = (episodeId: string | number | null) => {
    const { data, error, isLoading, mutate } = useSWR(
      episodeId ? `views/episode/${episodeId}` : null,
      () => episodeId ? viewService.getEpisodeViews(episodeId) : null,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    // Tăng lượt xem tập phim với throttling
    const incrementView = useCallback(async (
      movieId: string | number,
      progress: number = 0, 
      duration: number = 0
    ) => {
      if (!episodeId) return null;
      
      try {
        const result = await viewService.incrementEpisodeView(episodeId, movieId, progress, duration);
        
        // Hiển thị thông báo nếu bị throttle
        if (!result.success) {
          toast.error(result.message);
          return result;
        }
        
        // Cập nhật cache SWR nếu thành công
        if (result.success && result.views !== undefined) {
          mutate({ views: result.views }, false);
        } else {
          // Refresh data từ server
          mutate();
        }
        
        return result;
      } catch (error) {
        console.error('Lỗi khi tăng lượt xem tập phim:', error);
        toast.error('Không thể cập nhật lượt xem');
        throw error;
      }
    }, [episodeId, mutate]);

    // Kiểm tra có thể increment view không
    const canIncrement = useCallback(() => {
      return episodeId ? viewService.canIncrementView(undefined, episodeId) : false;
    }, [episodeId]);

    return {
      views: data?.views,
      isLoading,
      isError: error,
      incrementView,
      canIncrement,
      mutate,
    };
  };

  return {
    useMovieViews,
    useEpisodeViews,
    clearViewCache,
    // Utility methods
    clearThrottleCache: viewService.clearThrottleCache,
    canIncrementMovieView: (movieId: string | number) => viewService.canIncrementView(movieId),
    canIncrementEpisodeView: (episodeId: string | number) => viewService.canIncrementView(undefined, episodeId),
  };
};