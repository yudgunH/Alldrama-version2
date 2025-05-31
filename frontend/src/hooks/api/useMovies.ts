import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { MovieSearchParams, MovieListResponse, Movie } from '@/types';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { movieService } from '@/lib/api/services/movieService';
import { apiClient } from '@/lib/api/apiClient';

export const useMovies = (initialParams?: MovieSearchParams) => {
  const [searchParams, setSearchParams] = useState<MovieSearchParams>(initialParams || {});

  // Create key for SWR based on params - memoized for performance
  const swrKey = useMemo(() => {
    const params = searchParams;
    const queryParams: Record<string, string> = {};
    
    // Add search query if exists
    if (params.q) {
      queryParams.q = params.q;
    }
    
    // Add genre if exists
    if (params.genre) {
      queryParams.genre = String(params.genre);
    }
    
    // Add pagination params
    if (params.page) {
      queryParams.page = params.page.toString();
    }
    if (params.limit) {
      queryParams.limit = params.limit.toString();
    }
    
    // Add sorting params
    if (params.sort) {
      queryParams.sort = params.sort;
    }
    if (params.order) {
      queryParams.order = params.order;
    }
    
    // Add year if exists
    if (params.year) {
      queryParams.year = params.year.toString();
    }

    // Determine endpoint based on params
    const endpoint = params.q || params.genre 
      ? API_ENDPOINTS.MOVIES.SEARCH 
      : API_ENDPOINTS.MOVIES.LIST;

    // Build query string
    const queryString = new URLSearchParams(queryParams).toString();
    const finalKey = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('useMovies - SWR key generated:', finalKey);
    }
    
    return finalKey;
  }, [searchParams]);

  // Fetcher function for SWR
  const fetcher = useCallback(async (url: string) => {
    try {
      return await apiClient.get<MovieListResponse>(url);
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  }, []);

  // Use SWR hook with caching
  const { data, error, isLoading, isValidating, mutate } = useSWR<MovieListResponse>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Increased from 5s to 10s
      revalidateIfStale: false,
      revalidateOnReconnect: false
    }
  );

  // Get featured movies with SWR caching
  const { data: featuredMovies } = useSWR(
    'movies-featured',
    () => movieService.getMovies({
      sort: 'rating',
      order: 'DESC',
      limit: 10
    }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  // Get popular movies with SWR caching
  const { data: popularMovies } = useSWR(
    'movies-popular',
    () => movieService.getPopularMovies(10),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  // Get trending movies with SWR caching
  const { data: trendingMovies } = useSWR(
    'movies-trending',
    () => movieService.getMovies({
      sort: 'views',
      order: 'DESC',
      limit: 10
    }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  // Get newest movies with SWR caching
  const { data: newestMovies } = useSWR(
    'movies-newest',
    () => movieService.getNewestMovies(10),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  // Get featured movies (popular with high rating)
  const getFeaturedMovies = useCallback(async () => {
    try {
      if (featuredMovies?.movies) {
        return featuredMovies.movies;
      }
      const result = await movieService.getMovies({
        sort: 'rating',
        order: 'DESC',
        limit: 10
      });
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải phim đặc sắc');
      return [];
    }
  }, [featuredMovies]);

  // Get popular movies
  const getPopularMovies = useCallback(async () => {
    try {
      if (popularMovies?.movies) {
        return popularMovies.movies;
      }
      const result = await movieService.getPopularMovies(10);
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải phim phổ biến');
      return [];
    }
  }, [popularMovies]);

  // Get trending movies
  const getTrendingMovies = useCallback(async () => {
    try {
      if (trendingMovies?.movies) {
        return trendingMovies.movies;
      }
      const result = await movieService.getMovies({
        sort: 'views',
        order: 'DESC',
        limit: 10
      });
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải phim xu hướng');
      return [];
    }
  }, [trendingMovies]);

  // Get newest movies
  const getNewestMovies = useCallback(async () => {
    try {
      if (newestMovies?.movies) {
        return newestMovies.movies;
      }
      const result = await movieService.getNewestMovies(10);
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải phim mới nhất');
      return [];
    }
  }, [newestMovies]);

  // Get similar movies with caching
  const getSimilarMovies = useCallback(async (movieId: string | number) => {
    try {
      const movie = await movieService.getMovieById(movieId);
      
      if (movie.genres && movie.genres.length > 0) {
        const primaryGenreId = movie.genres[0].id;
        const result = await movieService.getMoviesByGenre(Number(primaryGenreId), 10);
        return result.movies.filter(m => String(m.id) !== String(movieId));
      }
      
      return [];
    } catch (err) {
      console.error('Không thể tải phim tương tự:', err);
      return [];
    }
  }, []);

  // Get movie details by ID with caching
  const getMovie = useCallback(async (id: string | number): Promise<Movie | null> => {
    try {
      return await movieService.getMovieById(id);
    } catch (err) {
      toast.error('Không thể tải thông tin phim');
      return null;
    }
  }, []);

  // Search movies - optimized to avoid unnecessary re-renders
  const searchMovies = useCallback(async (params: MovieSearchParams) => {
    // Only update if params actually changed
    const paramsChanged = JSON.stringify(params) !== JSON.stringify(searchParams);
    if (paramsChanged) {
    setSearchParams(params);
    await mutate();
    }
  }, [mutate, searchParams]);

  // Get all movies at once - cached
  const getAllMovies = useCallback(async () => {
    try {
      const result = await movieService.getMovies({
        limit: 1000
      });
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải danh sách phim');
      return [];
    }
  }, []);

  return {
    movies: data?.movies || [],
    pagination: data?.pagination || { total: 0, totalPages: 0, currentPage: 1, limit: 10 },
    loading: isLoading,
    isValidating,
    error,
    searchParams,
    searchMovies,
    getMovie,
    getFeaturedMovies,
    getPopularMovies,
    getTrendingMovies,
    getNewestMovies,
    getSimilarMovies,
    getAllMovies,
    refreshMovies: mutate
  };
};