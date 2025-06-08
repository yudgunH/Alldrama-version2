import { useState, useEffect, useMemo } from 'react'
import { movieService, episodeService } from '@/lib/api'
import { cacheManager } from '@/lib/cache/cacheManager'
import useSWR from 'swr'
import { Movie, Episode } from '@/types'

// Extend base types to include subtitles
export interface MovieWithSubtitles extends Movie {
  subtitles?: Array<{
    src: string;
    label: string;
    lang: string;
    default?: boolean;
  }>;
}

export interface EpisodeWithSubtitles extends Episode {
  subtitles?: Array<{
    src: string;
    label: string;
    lang: string;
    default?: boolean;
  }>;
}

interface UseWatchDataProps {
  slug: string;
  episodeId?: string | null;
}

export function useWatchData({ slug, episodeId }: UseWatchDataProps) {
  const [activeEpisode, setActiveEpisode] = useState<EpisodeWithSubtitles | null>(null)
  const [nextEp, setNextEp] = useState<EpisodeWithSubtitles | null>(null)
  const [prevEp, setPrevEp] = useState<EpisodeWithSubtitles | null>(null)

  /* Extract movie ID from slug */
  const movieId = useMemo(() => {
    if (!slug) return null;
    const id = slug.split('-').pop();
    return id && !isNaN(Number(id)) ? Number(id) : null;
  }, [slug]);

  /* Fetch movie data with SWR and cache */
  const { data: movie, error: movieError, isLoading: movieLoading } = useSWR(
    movieId ? `movie-detail-${movieId}` : null,
    async () => {
      if (!movieId) return null;
      
      const cached = cacheManager.getMovieDetails(movieId);
      if (cached) {
        return cached;
      }
      
      const movieData = await movieService.getMovieById(movieId);
      cacheManager.setMovieDetails(movieId, movieData, 30 * 60 * 1000);
      
      return movieData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000,
      errorRetryCount: 2,
      shouldRetryOnError: (error) => {
        return !error?.response || error.response.status >= 500;
      }
    }
  );

  /* Fetch episodes data with SWR and cache */
  const { data: episodes, error: episodesError, isLoading: episodesLoading } = useSWR(
    movieId ? `episodes-${movieId}` : null,
    async () => {
      if (!movieId) return [];

      // console.log(`🔍 Fetching episodes for movie ${movieId}`);
      
      const cached = cacheManager.getEpisodes(movieId);
      if (cached) {
        // console.log(`💾 Using cached episodes for movie ${movieId}:`, cached.length, 'episodes');
        return cached;
      }
      
      // console.log(`🌐 Fetching episodes from API for movie ${movieId}`);
      const episodesData = await episodeService.getEpisodesByMovieId(movieId);
      // console.log(`📦 Received episodes data for movie ${movieId}:`, episodesData?.length || 0, 'episodes');
      
      cacheManager.setEpisodes(movieId, episodesData, 10 * 60 * 1000);
      
      return episodesData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  /* Set active episode and navigation */
  useEffect(() => {
    // console.log(`🎯 Setting active episode for movie ${movieId}:`, {
    //   episodesCount: episodes?.length || 0,
    //   episodeId,
    //   hasEpisodes: !!(episodes && episodes.length > 0)
    // });

    if (!episodes || episodes.length === 0) {
      setActiveEpisode(null);
      setNextEp(null);
      setPrevEp(null);
      return;
    }

    let current = episodes[0];
    if (episodeId) {
      const found = episodes.find((e: EpisodeWithSubtitles) => String(e.id) === episodeId);
      if (found) {
        current = found;
        // console.log(`✅ Found episode ${episodeId}:`, current);
      } else {
        console.warn(`❌ Episode ${episodeId} not found in episodes list`);
      }
    }
    setActiveEpisode(current);

    const idx = episodes.findIndex((e: EpisodeWithSubtitles) => e.id === current.id);
    setPrevEp(idx > 0 ? episodes[idx - 1] : null);
    setNextEp(idx < episodes.length - 1 ? episodes[idx + 1] : null);
  }, [episodes, episodeId, movieId]);

  const isLoading = movieLoading || episodesLoading;
  const error = movieError || episodesError;
  const isSeries = Boolean(
    (movie && movie.totalEpisodes > 0) || 
    (episodes && episodes.length > 0)
  );

  // console.log(`🎬 useWatchData result for movie ${movieId}:`, {
  //   hasMovie: !!movie,
  //   totalEpisodes: movie?.totalEpisodes,
  //   episodesCount: episodes?.length || 0,
  //   activeEpisodeId: activeEpisode?.id,
  //   isSeries,
  //   isLoading,
  //   error: !!error
  // });

  return {
    movie,
    episodes,
    activeEpisode,
    nextEp,
    prevEp,
    movieId,
    isLoading,
    error,
    isSeries
  };
} 