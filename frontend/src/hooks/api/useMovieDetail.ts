import { useEffect, useState, useRef, useCallback } from 'react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { Movie, Episode } from '@/types'
import { apiClient } from '@/lib/api/apiClient'
import { cacheManager } from '@/lib/cache/cacheManager'

/**
 * Custom hook for fetching movie details and episodes
 * Với caching để giảm tải cho backend và tăng tốc độ load
 */
export const useMovieDetail = (movieId: string | number, initialData?: Movie) => {
  const [movie, setMovie] = useState<Movie | null>(initialData || null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  
  // Sử dụng ref để theo dõi mounted state
  const isMounted = useRef(true)
  
  // AbortController để hủy requests khi component unmount
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Function to fetch only movie data
  const fetchMovieOnly = useCallback(async (signal: AbortSignal) => {
    try {
      // Check cache first
      const cachedMovie = cacheManager.getMovieDetails(movieId);
      
      if (cachedMovie) {
        setMovie(cachedMovie);
        setIsLoading(false);
        return;
      }

      // Fetch movie details
      const movieData = await apiClient.get<Movie>(
        API_ENDPOINTS.MOVIES.DETAIL(movieId),
        { signal }
      );
      
      if (!isMounted.current) return;
      
      setMovie(movieData);
      setIsLoading(false);
      // Cache movie details for 30 minutes
      cacheManager.setMovieDetails(movieId, movieData, 30 * 60 * 1000);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return;
      }
      
      console.error('Error fetching movie details:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải thông tin phim');
      setIsLoading(false);
    }
  }, [movieId]);

  // Function to fetch only episodes
  const fetchEpisodesOnly = useCallback(async (signal: AbortSignal) => {
    try {
      // Check cache first
      const cachedEpisodes = cacheManager.getEpisodes(movieId);
      
      if (cachedEpisodes !== null) {
        // We have cached data (even if empty array) - use it
        setEpisodes(cachedEpisodes);
        return;
      }

      // No cache - fetch from API
      const fetchedEpisodes = await apiClient.get<Episode[]>(
        API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId),
        { signal }
      );
      
      // Ensure episodes is always an array
      const validEpisodes = Array.isArray(fetchedEpisodes) ? fetchedEpisodes : [];
      setEpisodes(validEpisodes);
      
      // Cache episodes for 10 minutes (even if empty - to mark as "fetched")
      cacheManager.setEpisodes(movieId, validEpisodes, 10 * 60 * 1000);
    } catch (err: any) {
      // Properly handle AbortError without logging them as real errors
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        return;
      }
      
      // Handle other errors but don't disrupt UI flow
      console.error('Error fetching episodes:', err);
      // Set empty array on error to ensure UI doesn't break
      setEpisodes([]);
      // Cache empty array to mark as "attempted"
      cacheManager.setEpisodes(movieId, [], 5 * 60 * 1000); // Shorter cache for failures
    }
  }, [movieId]);

  // Effect to handle initialData changes
  useEffect(() => {
    if (initialData) {
      setMovie(initialData);
      setIsLoading(false);
      setError(null);
    }
  }, [initialData]);

  // Effect to fetch episodes (separate from movie fetching)
  useEffect(() => {
    if (!movieId) {
      setEpisodes([]);
      return;
    }

    // Create new AbortController for episodes
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    // Fetch episodes
    fetchEpisodesOnly(signal);

    return () => {
      controller.abort();
    };
  }, [movieId, fetchEpisodesOnly]);

  // Effect to fetch movie (only when no initialData)
  useEffect(() => {
    if (!movieId || initialData) return;

    // Reset state
    setMovie(null);
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const signal = controller.signal;

    // Fetch movie
    fetchMovieOnly(signal);

    return () => {
      controller.abort();
    };
  }, [movieId, initialData, fetchMovieOnly]);

  // Cache TTL check
  const isCacheValid = (key: string) => {
    return cacheManager.getMovieDetails(key) !== null;
  }

  return { 
    movie, 
    episodes, 
    isLoading, 
    error,
    // Helper function to force refresh episodes (useful for debugging)
    refreshEpisodes: () => {
      if (movieId && isMounted.current) {
        cacheManager.invalidateEpisodeCache(movieId);
        const controller = new AbortController();
        fetchEpisodesOnly(controller.signal);
      }
    },
  };
}; 