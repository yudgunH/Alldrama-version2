import { useMemo, useState, useEffect } from 'react'
import { getSafePosterUrl, getEpisodeThumbnailInfo } from '@/utils/image'
import { checkUrlExists } from '@/utils/url'
import { MovieWithSubtitles, EpisodeWithSubtitles } from './useWatchData'

interface UseVideoSourcesProps {
  movie: MovieWithSubtitles | null;
  activeEpisode: EpisodeWithSubtitles | null;
  isSeries: boolean;
}

interface VideoSourceResult {
  videoSrc: string;
  thumbnailSrc: string; 
  title: string;
  subtitles: any[];
  isHLS: boolean;
  sourceType: 'hls' | 'mp4' | 'test' | 'none';
  processingStatus?: 'processing' | 'completed' | 'failed' | 'pending' | 'unknown';
}

/**
 * LOGIC FALLBACK CHO VIDEO SOURCES:
 * 
 * 1. Khi processingStatus === 'processing':
 *    - Ưu tiên MP4 (original.mp4) vì đã sẵn sàng
 *    - Fallback về HLS nếu MP4 không có
 * 
 * 2. Khi processingStatus !== 'processing':
 *    - Ưu tiên HLS (master.m3u8) cho chất lượng adaptive
 *    - Fallback về MP4 nếu HLS không có
 * 
 * 3. Cache invalidation:
 *    - Cache key bao gồm processingStatus
 *    - Tự động clear cache khi status thay đổi
 */



export function useVideoSources({ movie, activeEpisode, isSeries }: UseVideoSourcesProps): VideoSourceResult {
  const [checkedSources, setCheckedSources] = useState<{[key: string]: 'hls' | 'mp4' | 'none'}>({});

  // Tạo key duy nhất để cache kết quả kiểm tra (bao gồm cả processing status)
  const cacheKey = useMemo(() => {
    if (movie?.id && activeEpisode?.id) {
      const processingStatus = (activeEpisode as any)?.processingStatus || 'unknown';
      return `episode-${movie.id}-${activeEpisode.id}-${processingStatus}`;
    }
    return 'no-episode';
  }, [movie?.id, activeEpisode?.id, activeEpisode]);

  // Clear cache khi processing status thay đổi (để re-check sources)
  useEffect(() => {
    const processingStatus = (activeEpisode as any)?.processingStatus;
    if (processingStatus) {
      const oldKeys = Object.keys(checkedSources).filter(key => 
        key.startsWith(`episode-${movie?.id}-${activeEpisode?.id}-`) && 
        !key.endsWith(`-${processingStatus}`)
      );
      
      if (oldKeys.length > 0) {
        setCheckedSources(prev => {
          const newSources = { ...prev };
          oldKeys.forEach(key => delete newSources[key]);
          return newSources;
        });
      }
    }
  }, [movie?.id, activeEpisode?.id, activeEpisode, checkedSources]);

  // Lấy các URL có thể (chỉ cho episodes)
  const possibleSources = useMemo(() => {
    if (!movie?.id || !isSeries || !activeEpisode) {
      return { hlsUrl: '', mp4Url: '' };
    }

    const hlsUrl = activeEpisode.playlistUrl || 
      `https://media.alldrama.tech/episodes/${movie.id}/${activeEpisode.id}/hls/master.m3u8`;
    const mp4Url = `https://media.alldrama.tech/episodes/${movie.id}/${activeEpisode.id}/original.mp4`;
    
    return { hlsUrl, mp4Url };
  }, [movie, activeEpisode, isSeries]);

  // Kiểm tra và xác định nguồn video tối ưu
  useEffect(() => {
    const checkSources = async () => {
      if (checkedSources[cacheKey]) return;

      // Lấy processing status để quyết định thứ tự kiểm tra
      const processingStatus = (activeEpisode as any)?.processingStatus;
      
      // Nếu HLS đang processing, sử dụng MP4 trực tiếp mà không cần check exists
      if (processingStatus === 'processing' && possibleSources.mp4Url) {
        // Sử dụng MP4 fallback ngay lập tức khi HLS đang processing
        setCheckedSources(prev => ({
          ...prev,
          [cacheKey]: 'mp4'
        }));
        return;
      }
      
      // Cần có ít nhất HLS URL để tiếp tục
      if (!possibleSources.hlsUrl) return;
      
      // Logic bình thường: ưu tiên HLS trước
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
  }, [possibleSources.hlsUrl, possibleSources.mp4Url, cacheKey, checkedSources, activeEpisode]);

  // Xác định nguồn video cuối cùng
  const videoSource = useMemo(() => {
    const sourceType = checkedSources[cacheKey];
    
    // Lấy processing status từ episode (chỉ hỗ trợ series)
    const processingStatus = (activeEpisode as any)?.processingStatus;
    
    if (!sourceType) {
      // Chưa kiểm tra xong, nhưng nếu HLS đang processing thì thử MP4 trước
      if (processingStatus === 'processing') {
        return {
          url: possibleSources.mp4Url,
          isHLS: false,
          sourceType: 'mp4' as const,
          processingStatus
        };
      }
      
      // Mặc định thử HLS trước
      return {
        url: possibleSources.hlsUrl,
        isHLS: true,
        sourceType: 'hls' as const,
        processingStatus
      };
    }

    switch (sourceType) {
      case 'hls':
        // Nếu HLS có sẵn nhưng đang processing, ưu tiên MP4 nếu có
        if (processingStatus === 'processing' && possibleSources.mp4Url) {
          return {
            url: possibleSources.mp4Url,
            isHLS: false,
            sourceType: 'mp4' as const,
            processingStatus
          };
        }
        
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

  // Get thumbnail URL - ưu tiên episode thumbnail nếu có, fallback về poster
  const thumbnailSrc = useMemo(() => {
    // Nếu là series và có episode, thử lấy episode thumbnail
    if (isSeries && activeEpisode && movie?.id) {
      const episodeThumbnailInfo = getEpisodeThumbnailInfo(
        activeEpisode.thumbnailUrl,
        movie.id,
        activeEpisode.id
      );
      
      // Nếu có episode thumbnail, sử dụng nó
      if (!episodeThumbnailInfo.shouldShowSkeleton) {
        return episodeThumbnailInfo.url;
      }
    }
    
    // Fallback về poster của movie
    if (movie?.posterUrl) {
      if (movie.posterUrl.startsWith('http')) {
        return movie.posterUrl;
      }
      return getSafePosterUrl(movie.posterUrl, movie.id);
    }
    
    return movie?.id ? getSafePosterUrl(null, movie.id) : '/placeholder.svg';
  }, [movie, activeEpisode, isSeries]);

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
    thumbnailSrc,
    title,
    subtitles,
    isHLS: videoSource.isHLS,
    sourceType: videoSource.sourceType,
    processingStatus: videoSource.processingStatus
  };
} 