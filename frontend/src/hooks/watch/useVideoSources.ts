import { useMemo } from 'react'
import { getSafePosterUrl, getEpisodeThumbnailUrl } from '@/utils/image'
import { MovieWithSubtitles, EpisodeWithSubtitles } from './useWatchData'

interface UseVideoSourcesProps {
  movie: MovieWithSubtitles | null;
  activeEpisode: EpisodeWithSubtitles | null;
  isSeries: boolean;
}

export function useVideoSources({ movie, activeEpisode, isSeries }: UseVideoSourcesProps) {
  // Get video source URL with proper fallbacks
  const videoSrc = useMemo(() => {
    console.log('🎬 useVideoSources debug:', { 
      movieId: movie?.id, 
      movieTitle: movie?.title,
      totalEpisodes: movie?.totalEpisodes,
      isSeries, 
      activeEpisodeId: activeEpisode?.id,
      activeEpisodeNumber: activeEpisode?.episodeNumber,
      hasMoviePlaylistUrl: !!movie?.playlistUrl,
      hasActiveEpisodePlaylistUrl: !!activeEpisode?.playlistUrl
    });

    // For episode, use its playlist if available
    if (isSeries && activeEpisode) {
      if (activeEpisode.playlistUrl && activeEpisode.playlistUrl.startsWith('http')) {
        console.log('📺 Using episode playlistUrl:', activeEpisode.playlistUrl);
        return activeEpisode.playlistUrl;
      }
      // If not, try to construct it intelligently
      if (movie?.id && activeEpisode.episodeNumber) {
        const constructedUrl = `https://media.alldrama.tech/episodes/${movie.id}/${activeEpisode.episodeNumber}/hls/master.m3u8`;
        console.log('🔨 Constructed episode URL:', constructedUrl);
        return constructedUrl;
      }
    }

    // If it's a series but no activeEpisode available yet, log this for debugging
    if (isSeries && !activeEpisode) {
      console.warn(`⚠️ Series detected (movie ID: ${movie?.id}) but no activeEpisode available. This might indicate episodes data hasn't loaded yet or is missing.`);
    }
    
    // For movie, use its playlist if available
    if (movie?.playlistUrl && movie.playlistUrl.startsWith('http')) {
      console.log('🎥 Using movie playlistUrl:', movie.playlistUrl);
      return movie.playlistUrl;
    }
    
    // Fallback to constructed URL
    const fallbackUrl = movie ? `https://media.alldrama.tech/movies/${movie.id}/hls/master.m3u8` : '';
    console.log('🔄 Using fallback movie URL:', fallbackUrl);
    return fallbackUrl;
  }, [isSeries, activeEpisode, movie]);

  // Get poster URL with proper fallbacks
  const posterSrc = useMemo(() => {
    // For episode, use its thumbnail if available
    if (isSeries && activeEpisode) {
      if (activeEpisode.thumbnailUrl && activeEpisode.thumbnailUrl.startsWith('http')) {
        return activeEpisode.thumbnailUrl;
      }
      // If not, try to construct it intelligently using utility function
      if (movie?.id && activeEpisode.episodeNumber) {
        return getEpisodeThumbnailUrl(movie.id, activeEpisode.episodeNumber);
      }
    }
    
    // For movie, use its poster if available
    if (movie?.posterUrl) {
      if (movie.posterUrl.startsWith('http')) {
        return movie.posterUrl;
      }
      return getSafePosterUrl(movie.posterUrl, movie.id);
    }
    
    // Fallback to auto-detected poster or placeholder
    return movie?.id ? getSafePosterUrl(null, movie.id) : '/placeholder.svg';
  }, [isSeries, activeEpisode, movie]);

  // Get video title
  const title = useMemo(() => {
    return isSeries && activeEpisode
      ? `${movie?.title} - Tập ${activeEpisode.episodeNumber}: ${activeEpisode.title}`
      : movie?.title || '';
  }, [isSeries, activeEpisode, movie]);

  // Get subtitles with proper types
  const subtitles = useMemo(() => {
    return isSeries && activeEpisode
      ? (activeEpisode.subtitles || [])
      : ((movie as MovieWithSubtitles)?.subtitles || []);
  }, [isSeries, activeEpisode, movie]);

  return {
    videoSrc,
    posterSrc,
    title,
    subtitles
  };
} 