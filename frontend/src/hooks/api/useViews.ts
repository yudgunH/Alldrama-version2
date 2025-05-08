import { useCallback } from 'react';
import useSWR from 'swr';
import { viewService } from '@/lib/api/services/viewService';
import { useApiCache } from './useApiCache';

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

    // Tăng lượt xem phim
    const incrementView = useCallback(async () => {
      if (!movieId) return;
      
      try {
        const result = await viewService.incrementMovieView(movieId);
        mutate(result, false);
        return result;
      } catch (error) {
        console.error('Lỗi khi tăng lượt xem phim:', error);
        throw error;
      }
    }, [movieId, mutate]);

    return {
      views: data?.views,
      isLoading,
      isError: error,
      incrementView,
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

    // Tăng lượt xem tập phim
    const incrementView = useCallback(async () => {
      if (!episodeId) return;
      
      try {
        const result = await viewService.incrementEpisodeView(episodeId);
        mutate(result, false);
        return result;
      } catch (error) {
        console.error('Lỗi khi tăng lượt xem tập phim:', error);
        throw error;
      }
    }, [episodeId, mutate]);

    return {
      views: data?.views,
      isLoading,
      isError: error,
      incrementView,
      mutate,
    };
  };

  return {
    useMovieViews,
    useEpisodeViews,
    clearViewCache,
  };
};