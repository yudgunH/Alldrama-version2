"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/api/useAuth";
import { useFavorites } from "@/hooks/api/useFavorites";
import { useEpisodeData } from "@/hooks/api/useEpisodeData";
import { cacheManager } from "@/lib/cache/cacheManager";
import EpisodeList from "@/components/features/episode/EpisodeList";

export default function EpisodeListPage() {
  // Auth and favorites
  const { isAuthenticated } = useAuth();
  const { refreshFavorites } = useFavorites();

  // Fetch all episode data using custom hook
  const {
    movies,
    latestEpisodes,
    topEpisodes,
    isLoading,
    error
  } = useEpisodeData();

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

  return (
    <EpisodeList
      latestEpisodes={latestEpisodes}
      topEpisodes={topEpisodes}
      movies={movies}
      isLoading={isLoading}
      error={error}
    />
  );
}
