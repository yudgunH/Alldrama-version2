import { useState, useEffect, useCallback } from 'react';
import { cacheManager } from '@/lib/cache/cacheManager';
import { Movie, Genre } from '@/types';

interface CacheState {
  movies: Movie[];
  genres: Genre[];
  totalCachedMovies: number;
  hasCache: boolean;
  isFromCache: boolean;
}

interface UseSharedCacheOptions {
  enableMovieCache?: boolean;
  enableGenreCache?: boolean;
  enableEpisodeCache?: boolean;
  autoLoadCache?: boolean;
}

export function useSharedCache(options: UseSharedCacheOptions = {}) {
  const {
    enableMovieCache = true,
    enableGenreCache = true,
    enableEpisodeCache = false,
    autoLoadCache = true
  } = options;

  const [cacheState, setCacheState] = useState<CacheState>({
    movies: [],
    genres: [],
    totalCachedMovies: 0,
    hasCache: false,
    isFromCache: false
  });

  // Load cache on mount
  useEffect(() => {
    if (!autoLoadCache) return;

    const loadCache = () => {
      const cachedMovies = enableMovieCache ? cacheManager.getAllCachedMovies() : [];
      const cachedGenres = enableGenreCache ? cacheManager.getGenres() || [] : [];
      const stats = cacheManager.getCacheStats();

      setCacheState({
        movies: cachedMovies,
        genres: cachedGenres,
        totalCachedMovies: stats.totalCachedMovies,
        hasCache: cachedMovies.length > 0 || cachedGenres.length > 0,
        isFromCache: cachedMovies.length > 0
      });
    };

    loadCache();
  }, [enableMovieCache, enableGenreCache, autoLoadCache]);

  // Cache management functions
  const cacheMovies = useCallback((movies: Movie[]) => {
    if (!enableMovieCache) return;
    
    cacheManager.addDiscoveredMovies(movies);
    setCacheState(prev => ({
      ...prev,
      movies: [...prev.movies, ...movies],
      totalCachedMovies: cacheManager.getCacheStats().totalCachedMovies,
      hasCache: true
    }));
  }, [enableMovieCache]);

  const cacheGenres = useCallback((genres: Genre[]) => {
    if (!enableGenreCache) return;
    
    cacheManager.setGenres(genres, 60 * 60 * 1000); // 1 hour
    setCacheState(prev => ({
      ...prev,
      genres: genres,
      hasCache: true
    }));
  }, [enableGenreCache]);

  // Search functions with cache priority
  const searchCachedMovies = useCallback((query: string = '', genre: string = '', year: string = '') => {
    return cacheManager.searchCachedMovies(query, genre, year);
  }, []);

  const getCachedGenres = useCallback(() => {
    return cacheManager.getGenres() || [];
  }, []);

  const getCachedEpisodes = useCallback((movieId: string | number) => {
    return cacheManager.getEpisodes(movieId) || [];
  }, []);

  // Check if specific data is cached
  const hasMoviesForGenre = useCallback((genreName: string) => {
    const movies = cacheManager.searchCachedMovies('', genreName, '');
    return movies.length > 0;
  }, []);

  const getAvailableYears = useCallback(() => {
    const cachedMovies = cacheManager.getAllCachedMovies();
    const years = new Set(
      cachedMovies
        .map(movie => movie.releaseYear)
        .filter(Boolean) as number[]
    );
    return Array.from(years).sort((a, b) => b - a);
  }, []);

  // Cache statistics
  const getCacheStats = useCallback(() => {
    return cacheManager.getCacheStats();
  }, []);

  // Clear cache functions
  const clearMovieCache = useCallback(() => {
    cacheManager.clearDiscoveredMovies();
    setCacheState(prev => ({
      ...prev,
      movies: [],
      totalCachedMovies: 0,
      hasCache: prev.genres.length > 0,
      isFromCache: false
    }));
  }, []);

  const clearAllCache = useCallback(() => {
    cacheManager.clearAllCache();
    setCacheState({
      movies: [],
      genres: [],
      totalCachedMovies: 0,
      hasCache: false,
      isFromCache: false
    });
  }, []);

  // Refresh cache state
  const refreshCacheState = useCallback(() => {
    const cachedMovies = enableMovieCache ? cacheManager.getAllCachedMovies() : [];
    const cachedGenres = enableGenreCache ? cacheManager.getGenres() || [] : [];
    const stats = cacheManager.getCacheStats();

    setCacheState({
      movies: cachedMovies,
      genres: cachedGenres,
      totalCachedMovies: stats.totalCachedMovies,
      hasCache: cachedMovies.length > 0 || cachedGenres.length > 0,
      isFromCache: cachedMovies.length > 0
    });
  }, [enableMovieCache, enableGenreCache]);

  return {
    // Cache state
    cacheState,
    
    // Cache management
    cacheMovies,
    cacheGenres,
    
    // Search functions
    searchCachedMovies,
    getCachedGenres,
    getCachedEpisodes,
    
    // Utility functions
    hasMoviesForGenre,
    getAvailableYears,
    getCacheStats,
    
    // Cache control
    clearMovieCache,
    clearAllCache,
    refreshCacheState
  };
} 