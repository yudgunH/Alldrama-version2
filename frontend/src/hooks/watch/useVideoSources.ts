import { useMemo, useState, useEffect } from 'react'
import { getSafePosterUrl } from '@/utils/image'
import { checkUrlExists } from '@/utils/url'
import { MovieWithSubtitles, EpisodeWithSubtitles } from './useWatchData'

interface UseVideoSourcesProps {
  movie: MovieWithSubtitles | null;
  activeEpisode: EpisodeWithSubtitles | null;
  isSeries: boolean;
}

interface VideoSourceResult {
  videoSrc: string;
  posterSrc: string; 
  title: string;
  subtitles: any[];
  isHLS: boolean;
  sourceType: 'hls' | 'mp4' | 'test' | 'none';
  processingStatus?: 'processing' | 'completed' | 'failed' | 'pending' | 'unknown';
}



export function useVideoSources({ movie, activeEpisode, isSeries }: UseVideoSourcesProps): VideoSourceResult {
  const [checkedSources, setCheckedSources] = useState<{[key: string]: 'hls' | 'mp4' | 'none'}>({});

  // Tạo key duy nhất để cache kết quả kiểm tra (chỉ cho episodes)
  const cacheKey = useMemo(() => {
    if (movie?.id && activeEpisode?.episodeNumber) {
      return `episode-${movie.id}-${activeEpisode.episodeNumber}`;
    }
    return 'no-episode';
  }, [movie?.id, activeEpisode?.episodeNumber]);

  // Lấy các URL có thể (chỉ cho episodes)
  const possibleSources = useMemo(() => {
    if (!movie?.id || !isSeries || !activeEpisode) {
      return { hlsUrl: '', mp4Url: '' };
    }

    const hlsUrl = activeEpisode.playlistUrl || 
      `https://media.alldrama.tech/episodes/${movie.id}/${activeEpisode.episodeNumber}/hls/master.m3u8`;
    const mp4Url = `https://media.alldrama.tech/episodes/${movie.id}/${activeEpisode.episodeNumber}/original.mp4`;
    
    return { hlsUrl, mp4Url };
  }, [movie, activeEpisode, isSeries]);

  // Kiểm tra và xác định nguồn video tối ưu
  useEffect(() => {
    const checkSources = async () => {
      if (!possibleSources.hlsUrl || checkedSources[cacheKey]) return;

      // Ưu tiên kiểm tra HLS trước
      const hlsExists = await checkUrlExists(possibleSources.hlsUrl);
      
      if (hlsExists) {
        setCheckedSources(prev => ({
          ...prev,
          [cacheKey]: 'hls'
        }));
        return;
      }

      // Nếu HLS không có, kiểm tra MP4
      const mp4Exists = await checkUrlExists(possibleSources.mp4Url);
      
      if (mp4Exists) {
        setCheckedSources(prev => ({
          ...prev,
          [cacheKey]: 'mp4'
        }));
        return;
      }

      // Nếu cả hai đều không có
      setCheckedSources(prev => ({
        ...prev,
        [cacheKey]: 'none'
      }));
    };

    checkSources();
  }, [possibleSources.hlsUrl, possibleSources.mp4Url, cacheKey, checkedSources]);

  // Xác định nguồn video cuối cùng
  const videoSource = useMemo(() => {
    const sourceType = checkedSources[cacheKey];
    
    // Lấy processing status từ episode (chỉ hỗ trợ series)
    const processingStatus = (activeEpisode as any)?.processingStatus;
    
    if (!sourceType) {
      // Chưa kiểm tra xong, mặc định thử HLS trước
      return {
        url: possibleSources.hlsUrl,
        isHLS: true,
        sourceType: 'hls' as const,
        processingStatus
      };
    }

    switch (sourceType) {
      case 'hls':
        return {
          url: possibleSources.hlsUrl,
          isHLS: true,
          sourceType: 'hls' as const,
          processingStatus
        };
      case 'mp4':
        return {
          url: possibleSources.mp4Url,
          isHLS: false,
          sourceType: 'mp4' as const,
          processingStatus
        };
      default:
        return {
          url: '',
          isHLS: true,
          sourceType: 'none' as const,
          processingStatus
        };
    }
  }, [checkedSources, cacheKey, possibleSources, activeEpisode]);

  // Get poster URL với fallback thông thường
  const posterSrc = useMemo(() => {
    if (movie?.posterUrl) {
      if (movie.posterUrl.startsWith('http')) {
        return movie.posterUrl;
      }
      return getSafePosterUrl(movie.posterUrl, movie.id);
    }
    
    return movie?.id ? getSafePosterUrl(null, movie.id) : '/placeholder.svg';
  }, [movie]);

  // Get video title
  const title = useMemo(() => {
    return isSeries && activeEpisode
      ? `${movie?.title} - Tập ${activeEpisode.episodeNumber}: ${activeEpisode.title}`
      : movie?.title || '';
  }, [isSeries, activeEpisode, movie]);

  // Get subtitles
  const subtitles = useMemo(() => {
    return isSeries && activeEpisode
      ? (activeEpisode.subtitles || [])
      : ((movie as MovieWithSubtitles)?.subtitles || []);
  }, [isSeries, activeEpisode, movie]);

  return {
    videoSrc: videoSource.url,
    posterSrc,
    title,
    subtitles,
    isHLS: videoSource.isHLS,
    sourceType: videoSource.sourceType,
    processingStatus: videoSource.processingStatus
  };
} 