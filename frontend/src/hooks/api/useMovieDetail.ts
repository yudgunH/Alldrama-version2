import { useEffect, useState, useRef } from 'react'
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
  
  // Add flag to track if episode fetch was already initiated
  const episodesFetchedRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Cache TTL check
  const isCacheValid = (key: string) => {
    return cacheManager.getMovieDetails(key) !== null;
  }

  // Function to fetch both movie and episodes
  const fetchMovieAndEpisodes = async (signal: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cachedMovie = cacheManager.getMovieDetails(movieId);
      const cachedEpisodes = cacheManager.getEpisodes(movieId);

      let movieData: Movie;
      let episodesData: Episode[] = [];

      if (cachedMovie) {
        movieData = cachedMovie;
        setMovie(movieData);
      } else {
        // Fetch movie details
        movieData = await apiClient.get<Movie>(
          API_ENDPOINTS.MOVIES.DETAIL(movieId),
          { signal }
        );
        
        if (!isMounted.current) return;
        
        setMovie(movieData);
        // Cache movie details for 30 minutes
        cacheManager.setMovieDetails(movieId, movieData, 30 * 60 * 1000);
      }

      if (cachedEpisodes) {
        episodesData = cachedEpisodes;
        setEpisodes(episodesData);
      } else {
        // Fetch episodes
        try {
          episodesData = await apiClient.get<Episode[]>(
            API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId),
            { signal }
          );
          
          if (!isMounted.current) return;
          
          setEpisodes(episodesData);
          // Cache episodes for 10 minutes
          cacheManager.setEpisodes(movieId, episodesData, 10 * 60 * 1000);
        } catch (episodeError) {
          console.warn('Error fetching episodes:', episodeError);
          // Don't fail the whole request if episodes fail
          setEpisodes([]);
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        console.log('Movie fetch aborted due to component unmount');
        return;
      }
      
      console.error('Error fetching movie details:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải thông tin phim');
      setIsLoading(false);
    }
  };
  
  // Function to fetch only episodes when we already have movie data
  const fetchEpisodesOnly = async (signal: AbortSignal) => {
    try {
      // Check cache first
      const cachedEpisodes = cacheManager.getEpisodes(movieId);
      
      if (cachedEpisodes) {
        setEpisodes(cachedEpisodes);
        return;
      }

      const fetchedEpisodes = await apiClient.get<Episode[]>(
        API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId),
        { signal }
      );
      
      if (!isMounted.current) return; // Exit early if unmounted
      
      setEpisodes(fetchedEpisodes);
      
      // Cache episodes for 10 minutes
      cacheManager.setEpisodes(movieId, fetchedEpisodes, 10 * 60 * 1000);
    } catch (err: any) {
      // Properly handle AbortError without logging them as real errors
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        console.log('Episode fetch aborted due to component unmount');
        return;
      }
      
      // Handle other errors but don't disrupt UI flow
      console.error('Error fetching episodes:', err);
    }
  };
  
  // Main effect to fetch data
  useEffect(() => {
    if (!movieId) return;

    // Create new AbortController for this effect
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
      
    if (initialData) {
      // If we have initial movie data, just fetch episodes
      if (!episodesFetchedRef.current) {
        episodesFetchedRef.current = true;
        fetchEpisodesOnly(signal);
      }
    } else {
      // Check cache first
      const cachedMovie = cacheManager.getMovieDetails(movieId);
      
      if (cachedMovie) {
        setMovie(cachedMovie);
          setIsLoading(false);
        
        // Still fetch episodes if not cached
        const cachedEpisodes = cacheManager.getEpisodes(movieId);
        if (!cachedEpisodes && !episodesFetchedRef.current) {
          episodesFetchedRef.current = true;
          fetchEpisodesOnly(signal);
        } else if (cachedEpisodes) {
          setEpisodes(cachedEpisodes);
        }
      } else {
        // Fetch both movie and episodes
        fetchMovieAndEpisodes(signal);
    }
  }
  
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [movieId, initialData]);

  return { 
    movie, 
    episodes, 
    isLoading, 
    error,
    // Expose cache stats for debugging
    cacheStats: process.env.NODE_ENV === 'development' ? cacheManager.getCacheStats() : undefined,
  };
}; 