import { useMemo } from 'react'
import { getSafePosterUrl, getEpisodeThumbnailUrl } from '@/utils/image'
import { MovieWithSubtitles, EpisodeWithSubtitles } from '../../../hooks/watch/useWatchData'

interface UseVideoSourcesProps {
  movie: MovieWithSubtitles | null;
  activeEpisode: EpisodeWithSubtitles | null;
  isSeries: boolean;
}

export function useVideoSources({ movie, activeEpisode, isSeries }: UseVideoSourcesProps) {
  // Get video source URL with proper fallbacks
  const videoSrc = useMemo(() => {
    // For episode, use its playlist if available
    if (isSeries && activeEpisode) {
      if (activeEpisode.playlistUrl && activeEpisode.playlistUrl.startsWith('http')) {
        return activeEpisode.playlistUrl;
      }
      // If not, try to construct it intelligently
      if (movie?.id && activeEpisode.episodeNumber) {
        return `https://media.alldrama.tech/episodes/${movie.id}/${activeEpisode.episodeNumber}/hls/master.m3u8`;
      }
    }
    
    // For movie, use its playlist if available
    if (movie?.playlistUrl && movie.playlistUrl.startsWith('http')) {
      return movie.playlistUrl;
    }
    
    // Fallback to constructed URL
    return movie ? `https://media.alldrama.tech/movies/${movie.id}/hls/master.m3u8` : '';
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