"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/api/useAuth";
import { useFavorites } from "@/hooks/api/useFavorites";
import { useEpisodeData } from "@/hooks/api/useEpisodeData";
import { cacheManager } from "@/lib/cache/cacheManager";
import EpisodeList from "@/components/features/episode/EpisodeList";

export default function EpisodeListPage() {
  // Auth and favorites
  const { isAuthenticated } = useAuth();
  const { refreshFavorites } = useFavorites();
  
  // Cache state
  const [cachedData, setCachedData] = useState<{
    movies: any[];
    episodes: any[];
    hasCache: boolean;
  }>({
    movies: [],
    episodes: [],
    hasCache: false
  });

  // Fetch all episode data using custom hook
  const {
    movies,
    latestEpisodes,
    topEpisodes,
    isLoading,
    error
  } = useEpisodeData();

  // Check cache on component mount
  useEffect(() => {
    const checkCache = () => {
      // Get cached movies first
      const cachedMovies = cacheManager.getAllCachedMovies();
      
      // Get cached episodes if any (check multiple movie caches)
      const cachedEpisodes: any[] = [];
      cachedMovies.forEach(movie => {
        const episodes = cacheManager.getEpisodes(movie.id);
        if (episodes && episodes.length > 0) {
          // Add movie info to episodes for better display
          const episodesWithMovie = episodes.map(ep => ({
            ...ep,
            movie: movie
          }));
          cachedEpisodes.push(...episodesWithMovie);
        }
      });
      
      if (cachedMovies.length > 0 || cachedEpisodes.length > 0) {
        setCachedData({
          movies: cachedMovies,
          episodes: cachedEpisodes,
          hasCache: true
        });
      }
    };
    
    checkCache();
  }, []);

  // Auto-refresh favorites when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const lastRefresh = cacheManager.getStats('favorites-last-refresh');
      const now = Date.now();
      
      if (!lastRefresh || now - lastRefresh > 60000) { // Refresh max once per minute
        refreshFavorites();
        cacheManager.setStats('favorites-last-refresh', now, 60000);
      }
    }
  }, [isAuthenticated, refreshFavorites]);

  // Cache API results when they come in
  useEffect(() => {
    if (movies && movies.length > 0) {
      // Cache the movies from API
      cacheManager.addDiscoveredMovies(movies);
    }
  }, [movies]);

  // Merge cached data with API data intelligently
  const mergedData = {
    // For movies: Use API data if available, otherwise use cache, avoid duplicates
    movies: (() => {
      if (movies && movies.length > 0) {
        return movies; // Fresh API data
      }
      return cachedData.movies; // Fallback to cache
    })(),
    
    // For latest episodes: Use API data if available, otherwise use cache
    latestEpisodes: (() => {
      if (latestEpisodes && latestEpisodes.length > 0) {
        return latestEpisodes; // Fresh API data
      }
      // Use cached episodes sorted by creation date
      return cachedData.episodes
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 12); // Limit to 12 latest
    })(),
    
    // For top episodes: Use API data if available, otherwise use cache sorted by views
    topEpisodes: (() => {
      if (topEpisodes && topEpisodes.length > 0) {
        return topEpisodes; // Fresh API data
      }
      // Use cached episodes sorted by views or rating
      return cachedData.episodes
        .sort((a, b) => {
          const viewsA = a.views || 0;
          const viewsB = b.views || 0;
          return viewsB - viewsA;
        })
        .slice(0, 12); // Limit to 12 top episodes
    })(),
    
    // Show loading only if we don't have cache and API is loading
    isLoading: isLoading && !cachedData.hasCache,
    error
  };

  return (
    <EpisodeList
      latestEpisodes={mergedData.latestEpisodes}
      topEpisodes={mergedData.topEpisodes}
      movies={mergedData.movies}
      isLoading={mergedData.isLoading}
      error={error}
    />
  );
}
