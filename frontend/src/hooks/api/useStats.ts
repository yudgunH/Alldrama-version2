import { useCallback } from 'react';
import useSWR from 'swr';
import { statsService } from '@/lib/api/services/statsService';
import { useApiCache } from './useApiCache';

export const useStats = () => {
  const { clearCache } = useApiCache();

  const clearStatsCache = useCallback(() => {
    clearCache('stats');
  }, [clearCache]);

  // Top movies hook
  const useTopMovies = (limit?: number) => {
    const cacheKey = limit ? `stats/top-movies?limit=${limit}` : 'stats/top-movies';

    const { data, error, isLoading, mutate } = useSWR(
      cacheKey,
      () => statsService.getTopMovies(limit),
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    return {
      topMovies: data || [],
      isLoading,
      isError: error,
      mutate,
    };
  };

  // Top episodes hook
  const useTopEpisodes = (limit?: number) => {
    const cacheKey = limit ? `stats/top-episodes?limit=${limit}` : 'stats/top-episodes';

    const { data, error, isLoading, mutate } = useSWR(
      cacheKey,
      () => statsService.getTopEpisodes(limit),
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    return {
      topEpisodes: data || [],
      isLoading,
      isError: error,
      mutate,
    };
  };

  // Movie stats hook
  const useMovieStats = (movieId: string | number | null) => {
    const cacheKey = movieId ? `stats/movies/${movieId}` : null;

    const { data, error, isLoading, mutate } = useSWR(
      cacheKey,
      () => movieId ? statsService.getMovieStats(movieId) : null,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    return {
      movieStats: data,
      isLoading,
      isError: error,
      mutate,
    };
  };

  // Episode stats hook
  const useEpisodeStats = (episodeId: string | number | null) => {
    const cacheKey = episodeId ? `stats/episodes/${episodeId}` : null;

    const { data, error, isLoading, mutate } = useSWR(
      cacheKey,
      () => episodeId ? statsService.getEpisodeStats(episodeId) : null,
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    return {
      episodeStats: data,
      isLoading,
      isError: error,
      mutate,
    };
  };

  // Keep for backward compatibility - will be removed later
  const useOverview = () => {
    const { data, error, isLoading, mutate } = useSWR(
      'stats/overview',
      () => statsService.getOverview(),
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 phút
      }
    );

    return {
      overview: data,
      isLoading,
      isError: error,
      mutate,
    };
  };

  return {
    useTopMovies,
    useTopEpisodes,
    useMovieStats,
    useEpisodeStats,
    useOverview,
    clearStatsCache
  };
};