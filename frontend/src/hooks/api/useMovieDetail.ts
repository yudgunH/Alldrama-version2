import { useEffect, useState, useRef } from 'react'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type { Movie, Episode } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { apiClient } from '@/lib/api/apiClient'

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

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
  
  // Cache cho movie details
  const [cachedMovies, setCachedMovies] = useLocalStorage<{
    [key: string]: {
      movie: Movie;
      episodes: Episode[];
      timestamp: number;
    }
  }>('movie_detail_cache', {})
  
  // Cache TTL check
  const isCacheValid = (key: string) => {
    if (!cachedMovies[key]) return false
    const now = Date.now()
    return now - cachedMovies[key].timestamp < CACHE_TTL
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Main data fetching effect
  useEffect(() => {
    // Reset flag when movieId changes
    episodesFetchedRef.current = false
    
    const fetchMovieData = async () => {
      if (!movieId) return
      
      // Create a new AbortController for this effect run
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal
      
      // If we have initialData, use it but only fetch episodes once
      if (initialData && !isLoading && !episodesFetchedRef.current) {
        episodesFetchedRef.current = true
        fetchEpisodesOnly(signal);
        return;
      }
      
      setIsLoading(true)
      setError(null)
      
      const cacheKey = String(movieId)
      
      // Nếu có cache hợp lệ, sử dụng cache
      if (isCacheValid(cacheKey)) {
        const cachedData = cachedMovies[cacheKey]
        setMovie(cachedData.movie)
        setEpisodes(cachedData.episodes)
        setIsLoading(false)
        
        // Nếu đang dùng cache, gọi ngầm API để cập nhật cache mới nhưng không cancel request hiện tại
        setTimeout(() => {
          if (isMounted.current) {
            refreshMovieData(false)
          }
        }, 0)
        return
      }
      
      // Không có cache hoặc cache hết hạn, gọi API
      refreshMovieData(true)
    }
    
    fetchMovieData()
  }, [movieId, initialData])
  
  // Function to fetch only episodes when we already have movie data
  const fetchEpisodesOnly = async (signal: AbortSignal) => {
    try {
      const fetchedEpisodes = await apiClient.get<Episode[]>(
        API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId),
        { signal }
      );
      
      if (isMounted.current) {
        setEpisodes(fetchedEpisodes);
        
        // Update cache with new episodes but keep existing movie
        if (movie) {
          setCachedMovies(prev => ({
            ...prev,
            [String(movieId)]: {
              movie: movie,
              episodes: fetchedEpisodes,
              timestamp: Date.now()
            }
          }));
        }
        
        // Track view even with initialData
        incrementViewCount(movie);
      }
    } catch (err) {
      // Handle errors but don't disrupt UI flow
      console.error('Error fetching episodes:', err);
    }
  };
  
  // Tách hàm gọi API ra để tái sử dụng
  const refreshMovieData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
        setError(null)
      }
      
      // Get the current AbortController signal
      const signal = abortControllerRef.current?.signal;
      
      if (!signal) return;
      
      try {
        // Fetch movie details và episodes song song
        const [movieData, episodesData] = await Promise.all([
          apiClient.get<Movie>(API_ENDPOINTS.MOVIES.DETAIL(movieId), { signal }),
          apiClient.get<Episode[]>(API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId), { signal })
        ]);
        
        // Chỉ update state và cache nếu component vẫn mounted
        if (isMounted.current) {
          setMovie(movieData);
          setEpisodes(episodesData || []);
          
          // Lưu vào cache
          setCachedMovies(prev => ({
            ...prev,
            [String(movieId)]: {
              movie: movieData,
              episodes: episodesData || [],
              timestamp: Date.now()
            }
          }));
          
          if (showLoading) {
            setIsLoading(false);
          }
          
          // Gọi API view count riêng biệt và không cần đợi kết quả
          incrementViewCount(movieData);
        }
      } catch (err) {
        throw err;
      }
    } catch (err) {
      console.error('Error fetching movie details:', err)
      if (isMounted.current && showLoading) {
        setError('Không thể tải thông tin phim. Vui lòng thử lại sau.')
        setIsLoading(false)
      }
    }
  }
  
  // Tách riêng hàm increment view count để không ảnh hưởng đến UX chính
  const incrementViewCount = async (movie: Movie | null) => {
    if (!movie) return
    
    try {
      // Không cần đợi kết quả từ API này
      apiClient.post(
        API_ENDPOINTS.VIEWS.INCREMENT_MOVIE(movieId),
        {
          progress: 0,
          duration: movie.duration || 0
        }
      ).catch(err => {
        console.error('Error incrementing view count:', err)
      })
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  return { 
    movie, 
    episodes, 
    isLoading, 
    error,
    refresh: () => refreshMovieData(true)
  }
} 