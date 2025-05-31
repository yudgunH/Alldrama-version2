import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Episode, EpisodeViewRequest } from '@/types';
import { toast } from 'react-hot-toast';
import { episodeService } from '@/lib/api/services/episodeService';
import { viewService } from '@/lib/api/services/viewService';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const useEpisodes = (movieId: string | number | null) => {
  // SWR key - only fetch if we have a movieId
  const key = movieId ? API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId) : null;

  // Fetcher function for SWR
  const fetcher = useCallback(
    async (url: string) => {
      try {
        return await episodeService.getEpisodesByMovieId(movieId!);
      } catch (error) {
        console.error('Error fetching episodes:', error);
        throw error;
      }
    },
    [movieId]
  );

  // Using SWR hook with caching
  const { data, error, isLoading, isValidating, mutate } = useSWR<Episode[]>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
      revalidateIfStale: false
    }
  );

  // Get episode details with caching
  const getEpisode = useCallback(
    async (episodeId: string | number): Promise<Episode | null> => {
      try {
        return await episodeService.getEpisodeById(episodeId);
      } catch (err) {
        toast.error('Không thể tải thông tin tập phim');
        return null;
      }
    },
    []
  );

  // Increment view count using new viewService
  const incrementView = useCallback(
    async (episodeId: string | number, movieId: number, progress: number, duration: number) => {
      try {
        const result = await viewService.incrementEpisodeView(episodeId, movieId, progress, duration);
        
        if (!result.success) {
          toast.error(result.message);
        }
        
        return result;
      } catch (err) {
        console.error('Không thể tăng lượt xem:', err);
        toast.error('Không thể cập nhật lượt xem');
        return null;
      }
    },
    []
  );

  // Get processing status for episode video
  const getProcessingStatus = useCallback(
    async (episodeId: string | number) => {
      try {
        return await episodeService.getProcessingStatus(episodeId);
      } catch (err) {
        console.error('Không thể lấy trạng thái xử lý video:', err);
        return null;
      }
    },
    []
  );

  // Find next episode in the sequence
  const findNextEpisode = useCallback(
    (currentEpisodeId: string | number): Episode | undefined => {
      if (!data || data.length === 0) return undefined;
      
      const currentEpisode = data.find(ep => 
        String(ep.id) === String(currentEpisodeId)
      );
      
      if (!currentEpisode) return undefined;
      
      return data.find(ep => 
        ep.episodeNumber === currentEpisode.episodeNumber + 1
      );
    },
    [data]
  );

  // Find previous episode in the sequence
  const findPreviousEpisode = useCallback(
    (currentEpisodeId: string | number): Episode | undefined => {
      if (!data || data.length === 0) return undefined;
      
      const currentEpisode = data.find(ep => 
        String(ep.id) === String(currentEpisodeId)
      );
      
      if (!currentEpisode) return undefined;
      
      return data.find(ep => 
        ep.episodeNumber === currentEpisode.episodeNumber - 1
      );
    },
    [data]
  );

  return {
    episodes: data || [],
    loading: isLoading,
    isValidating,
    error,
    getEpisode,
    findNextEpisode,
    findPreviousEpisode,
    incrementView,
    getProcessingStatus,
    refreshEpisodes: mutate,
  };
};