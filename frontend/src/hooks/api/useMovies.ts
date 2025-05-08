import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { MovieSearchParams, MovieListResponse, Movie } from '@/types';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { movieService } from '@/lib/api/services/movieService';

export const useMovies = (initialParams?: MovieSearchParams) => {
  const [searchParams, setSearchParams] = useState<MovieSearchParams>(initialParams || {});

  // Create key for SWR based on params
  const getKey = useCallback((params: MovieSearchParams) => {
    if (params.q) {
      // If there's a search query, use search endpoint
      const searchPath = API_ENDPOINTS.MOVIES.SEARCH;
      let queryString = new URLSearchParams({
        ...(params.q ? { q: params.q } : {}),
        ...(params.page ? { page: params.page.toString() } : {}),
        ...(params.limit ? { limit: params.limit.toString() } : {}),
        ...(params.genre ? { genre: String(params.genre) } : {}),
        ...(params.year ? { year: params.year.toString() } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        ...(params.order ? { order: params.order } : {})
      }).toString();
      
      return queryString ? `${searchPath}?${queryString}` : searchPath;
    } else if (params.genre) {
      // If genre is specified, use the search endpoint with genre parameter
      const searchPath = API_ENDPOINTS.MOVIES.SEARCH;
      let queryString = new URLSearchParams({
        ...(params.genre ? { genre: String(params.genre) } : {}),
        ...(params.page ? { page: params.page.toString() } : {}),
        ...(params.limit ? { limit: params.limit.toString() } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        ...(params.order ? { order: params.order } : {})
      }).toString();
      
      return queryString ? `${searchPath}?${queryString}` : searchPath;
    } else {
      // Otherwise use the list endpoint
      const listPath = API_ENDPOINTS.MOVIES.LIST;
      let queryString = new URLSearchParams({
        ...(params.page ? { page: params.page.toString() } : {}),
        ...(params.limit ? { limit: params.limit.toString() } : {}),
        ...(params.year ? { year: params.year.toString() } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        ...(params.order ? { order: params.order } : {})
      }).toString();
      
      return queryString ? `${listPath}?${queryString}` : listPath;
    }
  }, []);

  // Fetcher function for SWR - sử dụng URL tương đối (không có API_BASE_URL)
  const fetcher = useCallback(async (url: string) => {
    console.log('Fetching movies from:', url);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  }, []);

  // Use SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR<MovieListResponse>(
    getKey(searchParams),
    fetcher
  );

  // Get featured movies (popular with high rating)
  const getFeaturedMovies = useCallback(async () => {
    try {
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
  }, []);

  // Get popular movies
  const getPopularMovies = useCallback(async () => {
    try {
      const result = await movieService.getPopularMovies(10);
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải phim phổ biến');
      return [];
    }
  }, []);

  // Get trending movies (highest views in last week - simulated with sort by views)
  const getTrendingMovies = useCallback(async () => {
    try {
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
  }, []);

  // Get newest movies
  const getNewestMovies = useCallback(async () => {
    try {
      const result = await movieService.getNewestMovies(10);
      return result.movies;
    } catch (err) {
      toast.error('Không thể tải phim mới nhất');
      return [];
    }
  }, []);

  // Get similar movies (movies with same genres - simulated with genre search)
  const getSimilarMovies = useCallback(async (movieId: string | number) => {
    try {
      // Get movie details first to know its genres
      const movie = await movieService.getMovieById(movieId);
      
      // If movie has genres, search for movies with same primary genre
      if (movie.genres && movie.genres.length > 0) {
        const primaryGenreId = movie.genres[0].id;
        const result = await movieService.getMoviesByGenre(Number(primaryGenreId), 10);
        // Filter out the current movie
        return result.movies.filter(m => String(m.id) !== String(movieId));
      }
      
      return [];
    } catch (err) {
      console.error('Không thể tải phim tương tự:', err);
      return [];
    }
  }, []);

  // Get movie details by ID
  const getMovie = useCallback(async (id: string | number): Promise<Movie | null> => {
    try {
      return await movieService.getMovieById(id);
    } catch (err) {
      toast.error('Không thể tải thông tin phim');
      return null;
    }
  }, []);

  // Search movies
  const searchMovies = useCallback(async (params: MovieSearchParams) => {
    setSearchParams(params);
    await mutate();
  }, [mutate]);

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
    refreshMovies: mutate
  };
};