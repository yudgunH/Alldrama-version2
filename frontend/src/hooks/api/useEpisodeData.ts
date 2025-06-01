import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { Episode, Movie } from '@/types';
import { movieService, episodeService } from '@/lib/api';
import { statsService } from '@/lib/api/services/statsService';
import { cacheManager } from '@/lib/cache/cacheManager';
import { getSafePosterUrl } from '@/utils/image';
import { EnhancedEpisode, EnhancedTopEpisode } from '@/components/features/episode/EpisodeList';

export const useEpisodeData = () => {
  // Fetch movies with episodes - optimized with caching (max 10 for series section)
  const { data: movies, error: moviesError, isLoading: moviesLoading } = useSWR(
    "movies-with-episodes", 
    async () => {
      // Check cache first
      const cached = cacheManager.getMovies('movies-with-episodes');
      if (cached) {
        console.log('Using cached movies data for episodes page');
        return cached;
      }

      console.log('Fetching movies data from API for episodes page');
      const response = await movieService.getMovies({ limit: 10 }); // Keep at 10 for series section
      const movies = response.movies;
      
      // Cache the result
      cacheManager.setMovies('movies-with-episodes', movies, 15 * 60 * 1000); // Cache for 15 minutes
      
      return movies;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch top/trending episodes - optimized to get max 20 episodes with most views
  const { data: topEpisodes, error: topEpisodesError, isLoading: topEpisodesLoading } = useSWR(
    movies ? "top-episodes" : null, // Only fetch when movies are loaded
    async () => {
      // Check cache first
      const cached = cacheManager.getStats('top-episodes');
      if (cached) {
        console.log('Using cached top episodes data');
        return cached;
      }

      console.log('Fetching top episodes data from API');
      const episodes = await statsService.getTopEpisodes(20); // Increased to 20 for trending
      
      // Create a map of movies for faster lookup
      const movieMap = new Map(movies!.map(movie => [movie.id, movie]));
      
      // Enhance top episodes with movie information using cached data
      const enhancedTopEpisodes: EnhancedTopEpisode[] = episodes.map((ep) => {
        const movie = movieMap.get(ep.movieId) || ep.movie;
        return {
          id: ep.id,
          movieId: ep.movieId,
          episodeNumber: ep.episodeNumber,
          views: ep.views,
          movieTitle: movie?.title || 'Unknown Movie',
          moviePoster: movie?.posterUrl || getSafePosterUrl(null, ep.movieId),
          thumbnailUrl: movie?.posterUrl || getSafePosterUrl(null, ep.movieId)
        };
      });
      
      // Cache the result
      cacheManager.setStats('top-episodes', enhancedTopEpisodes, 5 * 60 * 1000); // Cache for 5 minutes
      
      return enhancedTopEpisodes;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch latest episodes – optimized to get max 20 latest episodes
  const { data: enhancedEpisodes, error: episodesError, isLoading: episodesLoading } = useSWR(
    movies ? "all-episodes" : null,
    async () => {
      console.log('Starting to fetch episodes for', movies?.length || 0, 'movies');
      
      // Check cache first
      const cacheKey = 'all-enhanced-episodes';
      const cached = cacheManager.getStats(cacheKey);
      if (cached) {
        console.log('Using cached enhanced episodes data');
        return cached;
      }

      console.log('Fetching all episodes data from API');
      const all: EnhancedEpisode[] = [];
      
      // Process movies in smaller batches to avoid overwhelming the API
      const batchSize = 3; // Increased batch size since we're getting fewer episodes per movie
      for (let i = 0; i < movies!.length; i += batchSize) {
        const batch = movies!.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}, movies:`, batch.map(m => m.id));
        
        await Promise.all(
          batch.map(async (movie) => {
            try {
              // Always check individual movie episode cache first
              let episodes: Episode[];
              const cachedEpisodes = cacheManager.getEpisodes(movie.id);
              
              if (cachedEpisodes && cachedEpisodes.length > 0) {
                console.log(`Using cached episodes for movie ${movie.id} (${movie.title}) - ${cachedEpisodes.length} episodes`);
                episodes = cachedEpisodes;
              } else {
                console.log(`Fetching episodes for movie ${movie.id} (${movie.title})`);
                episodes = await episodeService.getEpisodesByMovieId(movie.id);
                console.log(`Fetched ${episodes.length} episodes for movie ${movie.id}`);
                
                // Only cache if we got episodes
                if (episodes.length > 0) {
                  cacheManager.setEpisodes(movie.id, episodes, 10 * 60 * 1000); // Cache for 10 minutes
                }
              }
              
              // Only process if we have episodes
              if (episodes.length > 0) {
                // Take only the latest 2 episodes per movie to get a good mix across movies
                const latestEpisodes = episodes
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 2); // Reduced to 2 per movie to get better distribution
                  
                console.log(`Adding ${latestEpisodes.length} latest episodes from movie ${movie.id}`);
                  
                latestEpisodes.forEach((ep) =>
                  all.push({
                    ...ep,
                    movieTitle: movie.title,
                    moviePoster: movie.posterUrl || getSafePosterUrl(null, movie.id),
                    thumbnailUrl: ep.thumbnailUrl || movie.posterUrl || getSafePosterUrl(null, movie.id)
                  })
                );
              } else {
                console.log(`No episodes found for movie ${movie.id} (${movie.title})`);
              }
            } catch (err) {
              console.error(`Error fetching episodes for movie ${movie.id} (${movie.title}):`, err);
              // Continue with other movies even if one fails
            }
          })
        );
        
        // Add small delay between batches to avoid overwhelming API
        if (i + batchSize < movies!.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Total episodes collected: ${all.length}`);
      
      const sortedEpisodes = all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`Episodes sorted, final count: ${sortedEpisodes.length}`);
      
      // Cache the enhanced episodes result for 5 minutes
      cacheManager.setStats(cacheKey, sortedEpisodes, 5 * 60 * 1000);
      
      return sortedEpisodes;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      errorRetryCount: 2,
      shouldRetryOnError: (error) => {
        // Only retry on network errors, not 4xx errors
        return !error?.response || error.response.status >= 500;
      }
    }
  );

  // Memoize filtered episodes to avoid recalculation - limit to 20 latest episodes
  const latestEpisodes = useMemo(() => 
    enhancedEpisodes?.slice(0, 20) || [], // Changed from 16 to 20
    [enhancedEpisodes]
  );

  const isLoading = moviesLoading || episodesLoading || topEpisodesLoading;
  const error = moviesError || episodesError || topEpisodesError;

  return {
    movies: movies || [],
    latestEpisodes,
    topEpisodes: topEpisodes || [],
    isLoading,
    error,
    // Individual loading states for more granular control
    moviesLoading,
    episodesLoading,
    topEpisodesLoading,
    // Individual errors
    moviesError,
    episodesError,
    topEpisodesError
  };
}; 