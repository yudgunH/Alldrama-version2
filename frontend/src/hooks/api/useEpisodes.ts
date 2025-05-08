import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Episode, EpisodeViewRequest } from '@/types';
import { toast } from 'react-hot-toast';
import { episodeService } from '@/lib/api/services/episodeService';
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

  // Using SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR<Episode[]>(
    key,
    fetcher
  );

  // Get episode details
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

  // Increment view count
  const incrementView = useCallback(
    async (episodeId: string | number, movieId: number, progress: number, duration: number) => {
      try {
        const viewData: EpisodeViewRequest = {
          movieId,
          progress,
          duration
        };
        
        return await episodeService.incrementView(episodeId, viewData);
      } catch (err) {
        // View count increment errors are not critical, just log them
        console.error('Không thể tăng lượt xem:', err);
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

  // Find next episode in the sequence (based on episode numbers)
  const findNextEpisode = useCallback(
    (currentEpisodeId: string | number): Episode | undefined => {
      if (!data || data.length === 0) return undefined;
      
      // Find current episode
      const currentEpisode = data.find(ep => 
        String(ep.id) === String(currentEpisodeId)
      );
      
      if (!currentEpisode) return undefined;
      
      // Find episode with the next episode number
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
      
      // Find current episode
      const currentEpisode = data.find(ep => 
        String(ep.id) === String(currentEpisodeId)
      );
      
      if (!currentEpisode) return undefined;
      
      // Find episode with the previous episode number
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