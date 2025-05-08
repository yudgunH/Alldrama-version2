import { useState, useEffect, useRef, useCallback } from 'react';
import { Movie } from '@/types';
import { useMovies } from '@/hooks/api/useMovies';
import { toast } from 'react-hot-toast';
import { movieService } from '@/lib/api/services/movieService';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import useSWR, { mutate as globalMutate } from 'swr';

interface HomepageData {
  newest: Movie[];
  popular: Movie[];
  featured: Movie[];
  trending: Movie[];
  genres: {
    [id: number]: Movie[];
  };
}

// Cache TTL in milliseconds (10 minutes)
const CACHE_TTL = 10 * 60 * 1000;

// SWR cache key for homepage data
const SWR_CACHE_KEY = 'homepage_data';

// Static method to clear homepage cache from anywhere
export const clearHomepageCache = () => {
  // Clear SWR cache
  globalMutate(SWR_CACHE_KEY, undefined, { revalidate: false });
  
  // Clear localStorage cache if available
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('homepage_data');
    } catch (e) {
      console.error('Failed to clear homepage localStorage cache:', e);
    }
  }
};

export const useHomepageData = () => {
  // Lưu dữ liệu vào localStorage với TTL
  const [persistedData, setPersistedData] = useLocalStorage<{data: HomepageData, timestamp: number} | null>(
    'homepage_data',
    null
  );
  
  // Sử dụng ref để theo dõi mounted state
  const isMounted = useRef(true);
  
  // AbortController để hủy requests khi component unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    getNewestMovies,
    getPopularMovies,
    getFeaturedMovies,
    getTrendingMovies,
  } = useMovies();

  // Kiểm tra xem cache có hết hạn chưa
  const isCacheValid = useCallback(() => {
    if (!persistedData) return false;
    const now = Date.now();
    return now - persistedData.timestamp < CACHE_TTL;
  }, [persistedData]);

  // Data fetcher for SWR
  const fetchHomepageData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // 1. Gọi các API riêng lẻ song song với Promise.allSettled để tránh lỗi nếu 1 API không thành công
      const [newestResult, popularResult, featuredResult, trendingResult] = await Promise.allSettled([
        getNewestMovies(),
        getPopularMovies(),
        getFeaturedMovies(),
        getTrendingMovies()
      ]);

      // Lấy dữ liệu hoặc mảng rỗng nếu API thất bại
      const newest = newestResult.status === 'fulfilled' ? newestResult.value : [];
      const popular = popularResult.status === 'fulfilled' ? popularResult.value : [];
      const featured = featuredResult.status === 'fulfilled' ? featuredResult.value : [];
      const trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [];
        
      // 2. Fetch genres song song - sử dụng Promise.allSettled để không bị lỗi nếu 1 request thất bại
      const genrePromises = [
        movieService.getMoviesByGenre(1, 10),
        movieService.getMoviesByGenre(3, 10)
      ];
      
      const [actionResult, dramaResult] = await Promise.allSettled(genrePromises);
      
      // Khởi tạo đối tượng genres
      const genres: {[id: number]: Movie[]} = {};
      
      // Xử lý kết quả genres
      if (actionResult.status === 'fulfilled' && actionResult.value && actionResult.value.movies) {
        genres[1] = actionResult.value.movies;
      } else {
        genres[1] = [];
      }
      
      if (dramaResult.status === 'fulfilled' && dramaResult.value && dramaResult.value.movies) {
        genres[3] = dramaResult.value.movies;
      } else {
        genres[3] = [];
      }

      const newData = {
        newest,
        popular,
        featured,
        trending,
        genres
      };
      
      // Lưu vào localStorage với timestamp
      if (isMounted.current) {
        setPersistedData({
          data: newData,
          timestamp: Date.now()
        });
      }
      
      return newData;
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      throw err;
    }
  }, [getNewestMovies, getPopularMovies, getFeaturedMovies, getTrendingMovies, setPersistedData]);

  // Setup SWR with initial data from localStorage if valid
  const initialData = isCacheValid() ? persistedData!.data : undefined;

  // Configure SWR options
  const swrOptions = {
    revalidateOnFocus: false,       // Don't revalidate when window gains focus
    revalidateOnReconnect: false,   // Don't revalidate when reconnecting
    revalidateIfStale: true,        // Revalidate if data is stale
    revalidateOnMount: !isCacheValid(), // Only revalidate on mount if cache is invalid
    dedupingInterval: 5000,         // Dedupe requests within 5 seconds
    fallbackData: initialData       // Use localStorage data as fallback
  };

  // Use SWR for fetching and caching
  const { 
    data, 
    error: swrError, 
    isLoading: swrIsLoading, 
    isValidating, 
    mutate 
  } = useSWR(
    SWR_CACHE_KEY, 
    fetchHomepageData, 
    swrOptions
  );

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Manual refresh function
  const refreshData = useCallback(() => {
    return mutate();
  }, [mutate]);

  return {
    ...data || initialData || { newest: [], popular: [], featured: [], trending: [], genres: {} },
    isLoading: swrIsLoading && !initialData,
    error: swrError,
    isRefreshing: isValidating && !swrIsLoading,
    refreshData
  };
};
