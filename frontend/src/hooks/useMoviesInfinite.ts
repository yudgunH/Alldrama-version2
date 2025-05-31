import { useState, useCallback, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Movie, MovieListResponse } from '@/types/movie';
import { movieService } from '@/lib/api/services/movieService';
import { cacheManager } from '@/lib/cache/cacheManager';

interface MovieSearchParams {
  genre?: number;
  sort?: 'views' | 'createdAt' | 'rating';
  order?: 'ASC' | 'DESC';
  search?: string;
}

interface UseMoviesInfiniteOptions {
  initialPageSize?: number;
  pageSize?: number;
  preloadCount?: number;
  enableCache?: boolean;
}

interface UseMoviesInfiniteReturn {
  movies: Movie[];
  loading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
  } | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  isValidating: boolean;
  searchMovies: (params: MovieSearchParams) => void;
}

export function useMoviesInfinite(
  searchParams: MovieSearchParams,
  options: UseMoviesInfiniteOptions = {}
): UseMoviesInfiniteReturn {
  const {
    initialPageSize = 15,
    pageSize = 20,
    preloadCount = 5,
    enableCache = true,
  } = options;

  const [currentParams, setCurrentParams] = useState(searchParams);

  // Generate SWR key for infinite loading
  const getKey = useCallback(
    (pageIndex: number, previousPageData: MovieListResponse | null) => {
      // If we've reached the end, return null to stop fetching
      if (previousPageData && previousPageData.pagination.currentPage >= previousPageData.pagination.totalPages) {
        return null;
      }

      const page = pageIndex + 1;
      const limit = page === 1 ? initialPageSize : pageSize;
      
      return [
        'movies-infinite',
        {
          ...currentParams,
          page,
          limit,
        },
      ];
    },
    [currentParams, initialPageSize, pageSize]
  );

  // Fetcher function with caching
  const fetcher = useCallback(
    async ([_, params]: [string, any]) => {
      const cacheKey = `movies_${JSON.stringify(params)}`;
      
      // Try to get from cache first if enabled
      if (enableCache) {
        const cached = cacheManager.getMovies(cacheKey);
        if (cached) {
          // Convert cached movies to MovieListResponse format
          return {
            movies: cached,
            pagination: {
              total: cached.length,
              totalPages: 1,
              currentPage: params.page || 1,
              limit: params.limit || 20,
            }
          } as MovieListResponse;
        }
      }

      // Fetch from API
      const result = await movieService.getMovies(params);
      
      // Cache the result if enabled
      if (enableCache && result?.movies) {
        cacheManager.setMovies(cacheKey, result.movies, 15 * 60 * 1000); // 15 minutes TTL
      }

      // Preload movie details for better UX
      if (result?.movies && preloadCount > 0) {
        const moviesToPreload = result.movies.slice(0, preloadCount);
        moviesToPreload.forEach((movie: Movie) => {
          // Preload in background without blocking
          setTimeout(() => {
            // Check if movie details are already cached
            if (!cacheManager.getMovieDetails(movie.id)) {
              // This would need to be implemented in movieService
              // For now, we'll skip preloading to avoid errors
              console.log(`Would preload movie ${movie.id}`);
            }
          }, 100);
        });
      }

      return result;
    },
    [enableCache, preloadCount]
  );

  // SWR Infinite hook
  const {
    data,
    error,
    size,
    setSize,
    isValidating,
    mutate,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 2,
    errorRetryInterval: 3000,
  });

  // Process data
  const { movies, pagination, hasMore } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        movies: [],
        pagination: null,
        hasMore: false,
      };
    }

    // Flatten all movies from all pages
    const allMovies = data.reduce((acc: Movie[], page: MovieListResponse) => {
      if (page?.movies) {
        return [...acc, ...page.movies];
      }
      return acc;
    }, []);

    // Get pagination info from the last page
    const lastPage = data[data.length - 1];
    const paginationInfo = lastPage ? {
      currentPage: lastPage.pagination.currentPage,
      totalPages: lastPage.pagination.totalPages,
      totalItems: lastPage.pagination.total,
      hasNextPage: lastPage.pagination.currentPage < lastPage.pagination.totalPages,
    } : null;

    const hasMoreData = lastPage ? lastPage.pagination.currentPage < lastPage.pagination.totalPages : false;

    return {
      movies: allMovies,
      pagination: paginationInfo,
      hasMore: hasMoreData,
    };
  }, [data]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (hasMore && !isValidating) {
      await setSize(size + 1);
    }
  }, [hasMore, isValidating, setSize, size]);

  // Search function
  const searchMovies = useCallback((params: MovieSearchParams) => {
    setCurrentParams(params);
    // Reset to first page when searching
    setSize(1);
    // Clear cache for new search if enabled
    if (enableCache) {
      cacheManager.clearMovieCache();
    }
  }, [setSize, enableCache]);

  const loading = !data && !error;

  return {
    movies,
    loading: !data && !error,
    pagination,
    hasMore,
    loadMore,
    isValidating,
    searchMovies
  };
} 