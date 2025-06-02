import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { viewService } from '@/lib/api/services/viewService';
import { useApiCache } from './useApiCache';

export const useViews = () => {
  const { clearCache } = useApiCache();

  const clearViewCache = useCallback(() => {
    clearCache('views');
  }, [clearCache]);

  // Hook để tăng lượt xem phim
  const useMovieViewIncrement = () => {
    // Tăng lượt xem phim với throttling
    const incrementView = useCallback(async (
      movieId: string | number,
      progress: number = 0, 
      duration: number = 0
    ) => {
      console.log('🎬 useMovieViewIncrement called:', { movieId, progress, duration })
      try {
        const result = await viewService.incrementMovieView(movieId, progress, duration);
        
        // Hiển thị thông báo nếu bị throttle
        if (!result.success) {
          toast.error(result.message);
          return result;
        }
        
        // Xóa cache stats để refresh dữ liệu mới
        clearViewCache();
        
        return result;
      } catch (error) {
        console.error('Lỗi khi tăng lượt xem phim:', error);
        toast.error('Không thể cập nhật lượt xem');
        throw error;
      }
    }, [clearViewCache]);

    // Kiểm tra có thể increment view không
    const canIncrement = useCallback((movieId: string | number) => {
      return viewService.canIncrementView(movieId);
    }, []);

    return {
      incrementView,
      canIncrement,
    };
  };

  // Hook để tăng lượt xem tập phim
  const useEpisodeViewIncrement = () => {
    // Tăng lượt xem tập phim với throttling
    const incrementView = useCallback(async (
      episodeId: string | number,
      movieId: string | number,
      progress: number = 0, 
      duration: number = 0
    ) => {
      console.log('📺 useEpisodeViewIncrement called:', { episodeId, movieId, progress, duration })
      try {
        const result = await viewService.incrementEpisodeView(episodeId, movieId, progress, duration);
        
        // Hiển thị thông báo nếu bị throttle
        if (!result.success) {
          toast.error(result.message);
          return result;
        }
        
        // Xóa cache stats để refresh dữ liệu mới
        clearViewCache();
        
        return result;
      } catch (error) {
        console.error('Lỗi khi tăng lượt xem tập phim:', error);
        toast.error('Không thể cập nhật lượt xem');
        throw error;
      }
    }, [clearViewCache]);

    // Kiểm tra có thể increment view không
    const canIncrement = useCallback((episodeId: string | number) => {
      return viewService.canIncrementView(undefined, episodeId);
    }, []);

    return {
      incrementView,
      canIncrement,
    };
  };

  return {
    useMovieViewIncrement,
    useEpisodeViewIncrement,
    clearViewCache,
    // Utility methods
    clearThrottleCache: viewService.clearThrottleCache,
    canIncrementMovieView: (movieId: string | number) => viewService.canIncrementView(movieId),
    canIncrementEpisodeView: (episodeId: string | number) => viewService.canIncrementView(undefined, episodeId),
  };
};