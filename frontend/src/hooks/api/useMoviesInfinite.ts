import { useState, useCallback, useEffect, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import { MovieSearchParams, MovieListResponse, Movie } from '@/types';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { apiClient } from '@/lib/api/apiClient';
import { cacheManager } from '@/lib/cache/cacheManager';
import { movieService } from '@/lib/api/services/movieService';

interface UseMoviesInfiniteOptions {
  initialPageSize?: number;
  pageSize?: number;
  preloadCount?: number;
  enableCache?: boolean;
}

export const useMoviesInfinite = (
  searchParams: MovieSearchParams = {},
  options: UseMoviesInfiniteOptions = {}
) => {
  const {
    initialPageSize = 15, // Load 15 movies initially
    pageSize = 20, // Load 20 movies per subsequent page
    preloadCount = 5, // Preload 5 movie details
    enableCache = true,
  } = options;

  const [allMovies, setAllMovies] = useState<Movie[]>([]);

  // Create cache key for the search params
  const cacheKey = useMemo(() => {
    const params = { ...searchParams };
    delete params.page; // Remove page from cache key since we're using infinite scroll
    return JSON.stringify(params);
  }, [searchParams]);

  // SWR Infinite key generator
  const getKey = useCallback(
    (pageIndex: number, previousPageData: MovieListResponse | null) => {
      // If we've reached the end, return null to stop fetching
      if (previousPageData && previousPageData.movies.length === 0) return null;
      if (previousPageData && !previousPageData.pagination?.totalPages) return null;
      if (previousPageData && pageIndex >= previousPageData.pagination.totalPages) return null;

      const queryParams: Record<string, string> = {};
      
      // Add search query if exists
      if (searchParams.q) {
        queryParams.q = searchParams.q;
      }
      
      // Add genre if exists
      if (searchParams.genre) {
        queryParams.genre = String(searchParams.genre);
      }
      
      // Add sorting params
      if (searchParams.sort) {
        queryParams.sort = searchParams.sort;
      }
      if (searchParams.order) {
        queryParams.order = searchParams.order;
      }
      
      // Add year if exists
      if (searchParams.year) {
        queryParams.year = searchParams.year.toString();
      }

      // Set page size based on whether it's the first page or not
      const currentPageSize = pageIndex === 0 ? initialPageSize : pageSize;
      queryParams.limit = currentPageSize.toString();
      queryParams.page = (pageIndex + 1).toString();

      // Determine endpoint based on params
      const endpoint = searchParams.q || searchParams.genre 
        ? API_ENDPOINTS.MOVIES.SEARCH 
        : API_ENDPOINTS.MOVIES.LIST;

      // Build query string
      const queryString = new URLSearchParams(queryParams).toString();
      return queryString ? `${endpoint}?${queryString}` : endpoint;
    },
    [searchParams, initialPageSize, pageSize]
  );

  // Fetcher function with caching
  const fetcher = useCallback(async (url: string): Promise<MovieListResponse> => {
    try {
      // Check cache first if enabled
      if (enableCache) {
        const cached = cacheManager.getMovies(url);
        if (cached) {
          return {
            movies: cached,
            pagination: {
              total: cached.length,
              totalPages: 1,
              currentPage: 1,
              limit: cached.length
            }
          };
        }
      }

      const result = await apiClient.get<MovieListResponse>(url);
      
      // Cache the result if enabled
      if (enableCache && result.movies) {
        cacheManager.setMovies(url, result.movies, 10 * 60 * 1000); // Cache for 10 minutes
      }

      return result;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  }, [enableCache]);

  // Use SWR Infinite
  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = useSWRInfinite<MovieListResponse>(
    getKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
      parallel: false, // Load pages sequentially
    }
  );

  // Flatten all movies from all pages
  const movies = useMemo(() => {
    if (!data) return [];
    return data.flatMap(page => page.movies || []);
  }, [data]);

  // Update allMovies state when movies change
  useEffect(() => {
    setAllMovies(movies);
  }, [movies]);

  // Preload movie details for better UX
  useEffect(() => {
    if (movies.length > 0 && enableCache) {
      const moviesToPreload = movies
        .slice(0, preloadCount)
        .map(movie => movie.id);
      
      cacheManager.preloadMovies(moviesToPreload, movieService.getMovieById);
    }
  }, [movies, preloadCount, enableCache]);

  // Check if there are more pages to load
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return true;
    const lastPage = data[data.length - 1];
    if (!lastPage.pagination) return false;
    return size < lastPage.pagination.totalPages;
  }, [data, size]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (hasMore && !isValidating) {
      await setSize(size + 1);
    }
  }, [hasMore, isValidating, setSize, size]);

  // Reset function for new searches
  const reset = useCallback(async () => {
    await setSize(1);
  }, [setSize]);

  // Get pagination info
  const pagination = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, totalPages: 0, currentPage: 1, limit: initialPageSize };
    }
    const lastPage = data[data.length - 1];
    return lastPage.pagination || { total: 0, totalPages: 0, currentPage: size, limit: pageSize };
  }, [data, size, initialPageSize, pageSize]);

  // Search function that resets pagination
  const searchMovies = useCallback(async (newParams: MovieSearchParams) => {
    // Clear cache for old search if params changed significantly
    if (enableCache && JSON.stringify(newParams) !== JSON.stringify(searchParams)) {
      cacheManager.clearMovieCache();
    }
    
    await reset();
  }, [reset, enableCache, searchParams]);

  return {
    movies: allMovies,
    pagination,
    loading: isLoading,
    isValidating,
    error,
    hasMore,
    loadMore,
    reset,
    searchMovies,
    refreshMovies: mutate,
    cacheStats: enableCache ? cacheManager.getCacheStats() : null,
  };
}; 