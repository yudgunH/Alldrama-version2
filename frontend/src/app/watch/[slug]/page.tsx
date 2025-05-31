'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import VideoPlayer from '@/components/features/movie/VideoPlayer'
import NotFoundMessage from '@/components/features/watch/NotFoundMessage'
import MobileEpisodeSheet from '@/components/features/watch/MobileEpisodeSheet'
import ContentInfoCard from '@/components/features/watch/ContentInfoCard'
import CommentSection from '@/components/features/movie/CommentSection'
import RelatedMovies from '@/components/features/watch/RelatedMovies'
import { generateWatchUrl } from '@/utils/url'
import { useWatchHistory } from '@/hooks/api/useWatchHistory'
import { useAuth } from '@/hooks/api/useAuth'
import { Movie, Episode } from '@/types'
import { movieService, episodeService } from '@/lib/api'
import { cacheManager } from '@/lib/cache/cacheManager'
import useSWR from 'swr'
import { getSafePosterUrl, getEpisodeThumbnailUrl } from '@/utils/image'

// Extend base types to include subtitles
interface MovieWithSubtitles extends Movie {
  subtitles?: Array<{
    src: string;
    label: string;
    lang: string;
    default?: boolean;
  }>;
}

interface EpisodeWithSubtitles extends Episode {
  subtitles?: Array<{
    src: string;
    label: string;
    lang: string;
    default?: boolean;
  }>;
}

export default function WatchPage() {
  /* ----------------- URL params ----------------- */
  const params = useParams<{ slug: string }>()
  const slug = params?.slug || ''
  const searchParams = useSearchParams()
  const router = useRouter()

  const episodeId = searchParams?.get('episode')      // ?episode=123
  const episodeNum = searchParams?.get('ep')          // ?ep=1
  const savedProgress = searchParams?.get('progress') // ?progress=123 (thời gian đã xem trước đó)
  
  /* ----------------- Extract movie ID from slug ----------------- */
  const movieId = useMemo(() => {
    if (!slug) return null;
    const id = slug.split('-').pop();
    return id && !isNaN(Number(id)) ? Number(id) : null;
  }, [slug]);
  
  /* ----------------- local state ----------------- */
  const [activeEpisode, setActiveEpisode] = useState<EpisodeWithSubtitles | null>(null)
  const [nextEp, setNextEp] = useState<EpisodeWithSubtitles | null>(null)
  const [prevEp, setPrevEp] = useState<EpisodeWithSubtitles | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  
  /* ----------------- Auth & Watch History ----------------- */
  const { isAuthenticated } = useAuth()
  const { updateProgress } = useWatchHistory()
  
  /* ----------------- Fetch movie data with SWR and cache ----------------- */
  const { data: movie, error: movieError, isLoading: movieLoading } = useSWR(
    movieId ? `movie-detail-${movieId}` : null,
    async () => {
      if (!movieId) return null;
      
      // Check cache first
      const cached = cacheManager.getMovieDetails(movieId);
      if (cached) {
        console.log(`Using cached movie data for watch page: ${movieId}`);
        return cached;
      }
      
      // Fetch from API if not cached
      console.log(`Fetching movie data from API for watch page: ${movieId}`);
      const movieData = await movieService.getMovieById(movieId);
      
      // Cache the result for 30 minutes
      cacheManager.setMovieDetails(movieId, movieData, 30 * 60 * 1000);
      
      return movieData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      shouldRetryOnError: (error) => {
        return !error?.response || error.response.status >= 500;
      }
    }
  );

  /* ----------------- Fetch episodes data with SWR and cache ----------------- */
  const { data: episodes, error: episodesError, isLoading: episodesLoading } = useSWR(
    movieId && movie && movie.totalEpisodes > 0 ? `episodes-${movieId}` : null,
    async () => {
      if (!movieId) return [];
      
      // Check cache first
      const cached = cacheManager.getEpisodes(movieId);
      if (cached) {
        console.log(`Using cached episodes data for movie: ${movieId}`);
        return cached;
      }
      
      // Fetch from API if not cached
      console.log(`Fetching episodes data from API for movie: ${movieId}`);
      const episodesData = await episodeService.getEpisodesByMovieId(movieId);
      
      // Cache the result for 10 minutes
      cacheManager.setEpisodes(movieId, episodesData, 10 * 60 * 1000);
      
      return episodesData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  /* ----------------- Set active episode and navigation ----------------- */
  useEffect(() => {
    if (!episodes || episodes.length === 0) {
      setActiveEpisode(null);
      setNextEp(null);
      setPrevEp(null);
      return;
    }

    // Determine current episode
    let current = episodes[0];
    if (episodeId) {
      const found = episodes.find((e: EpisodeWithSubtitles) => String(e.id) === episodeId);
      if (found) current = found;
    }
    setActiveEpisode(current);

    // Set navigation episodes
    const idx = episodes.findIndex((e: EpisodeWithSubtitles) => e.id === current.id);
    setPrevEp(idx > 0 ? episodes[idx - 1] : null);
    setNextEp(idx < episodes.length - 1 ? episodes[idx + 1] : null);
  }, [episodes, episodeId]);
  
  // Debounce function to prevent excessive API calls
  const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
    let timer: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timer)
      timer = setTimeout(() => func(...args), delay)
    }
  }
  
  // Debounced update progress function
  const debouncedUpdateProgress = useCallback(
    debounce((time: number, duration: number) => {
      if (!isAuthenticated || !movie) return
      
      // Kiểm tra đầu vào
      try {
        // Chuyển đổi các giá trị thành số
        const movieIdNumber = Number(movie.id)
        
        // Xác định episodeId
        let episodeIdNumber: number
        if (activeEpisode) {
          episodeIdNumber = Number(activeEpisode.id)
        } else {
          // Đối với phim lẻ, sử dụng movieId làm episodeId
          episodeIdNumber = movieIdNumber
        }
        
        // Kiểm tra tính hợp lệ của thời gian xem và thời lượng
        const validTime = isFinite(time) ? Math.floor(time) : 0
        const validDuration = isFinite(duration) ? Math.floor(duration) : 0
        
        // Kiểm tra tính hợp lệ của ID
        if (isNaN(movieIdNumber) || isNaN(episodeIdNumber) || movieIdNumber <= 0 || episodeIdNumber <= 0) {
          console.error('ID không hợp lệ', { movieId: movieIdNumber, episodeId: episodeIdNumber })
          return
        }
        
        // Chỉ gửi yêu cầu nếu thời lượng hợp lệ
        if (validDuration >= 5) {
          updateProgress(movieIdNumber, episodeIdNumber, validTime, validDuration)
        }
      } catch (err) {
        console.error('Lỗi khi xử lý tiến trình xem:', err)
      }
    }, 5000), // Update at most every 5 seconds
    [isAuthenticated, movie, activeEpisode, updateProgress]
  )

  /* ----------------- derived values ----------------- */
  const isLoading = movieLoading || episodesLoading;
  const error = movieError || episodesError;
  const isSeries = Boolean(activeEpisode);
  
  // Get video source URL with proper fallbacks
  const getVideoSrc = () => {
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
  };
  
  const videoSrc = getVideoSrc();
  
  // Get poster URL with proper fallbacks and without hardcoded paths
  const getPosterUrl = () => {
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
  };
  
  const posterSrc = getPosterUrl();
  
  const title = isSeries && activeEpisode
    ? `${movie?.title} - Tập ${activeEpisode.episodeNumber}: ${activeEpisode.title}`
    : movie?.title || '';
  
  // Get subtitles with proper types
  const subtitles = isSeries && activeEpisode
    ? (activeEpisode.subtitles || [])
    : ((movie as MovieWithSubtitles)?.subtitles || []);
  
  // Xác định thời gian bắt đầu video (từ tiến độ lưu trước đó)
  let startTime = 0
  if (savedProgress) {
    try {
      const progress = parseInt(savedProgress, 10)
      // Nếu thời gian hợp lệ và dưới 99% thời lượng của video (tránh bắt đầu gần kết thúc)
      if (!isNaN(progress) && progress > 0) {
        startTime = progress
      }
    } catch (e) {
      console.error('Lỗi khi xử lý tiến độ xem đã lưu:', e)
    }
  }

  /* ----------------- loading / error ----------------- */
  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Skeleton className="w-3/4 h-[80%] max-w-7xl rounded-xl" />
      </div>
    )
  }
  
  if (error || !movie) {
    return <NotFoundMessage message="Không thể tải nội dung" description={error?.message || 'Đã xảy ra lỗi khi tải nội dung'} />
  }

  // Update the episode watch url generation
  const generateEpisodeLink = (movie: Movie, episode: Episode) => {
    return generateWatchUrl(movie.id, movie.title, episode.id, episode.episodeNumber);
  }
  
  /* ----------------- render ----------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
        {/* Back button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white flex items-center gap-2"
            onClick={() => router.push(`/movie/${movie.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại trang chi tiết</span>
          </Button>
        </div>

        {/* ---------- player box ---------- */}
        <div className="relative 
          w-full max-w-3xl mx-auto
          md:max-w-none md:mx-0">
          {/* Sheet mobile */}
          {isSeries && episodes && (
            <MobileEpisodeSheet
              episodes={episodes}
              currentEpisode={activeEpisode!}
              movieId={String(movie.id)}
              movieTitle={movie.title}
              episodeView={viewMode}
              setEpisodeView={(mode) => {
                if (mode !== viewMode) {
                  setViewMode(mode);
                }
              }}
            />
          )}

          {/* player */}
          <VideoPlayer
            key={`${videoSrc}-${startTime}`}
            src={videoSrc}
            poster={posterSrc}
            title={title}
            autoPlay={false}
            useCustomControls={true}
            useTestVideo={!videoSrc}
            subtitles={subtitles}
            initialTime={startTime}
            isHLS={true}
            onTimeUpdate={(time) => {
              try {
                // Lấy duration từ video player
                const videoElement = document.querySelector('video')
                if (!videoElement) return
                
                const duration = videoElement.duration || 0
                
                // Nếu đã xác thực, cập nhật tiến trình xem
                if (isAuthenticated) {
                  debouncedUpdateProgress(time, duration)
                }
              } catch (error) {
                console.error('Lỗi onTimeUpdate:', error)
              }
            }}
            onEnded={() => {
              try {
                // Khi video kết thúc, cũng cập nhật progress để đánh dấu đã xem xong
                if (isAuthenticated && movie) {
                  const videoElement = document.querySelector('video')
                  const duration = videoElement?.duration || 0
                  
                  const movieIdNumber = Number(movie.id)
                  let episodeIdNumber: number
                  
                  if (activeEpisode) {
                    episodeIdNumber = Number(activeEpisode.id)
                  } else {
                    episodeIdNumber = movieIdNumber
                  }
                  
                  // Kiểm tra tính hợp lệ của dữ liệu
                  if (!isNaN(movieIdNumber) && !isNaN(episodeIdNumber) && 
                      movieIdNumber > 0 && episodeIdNumber > 0 && 
                      isFinite(duration) && duration > 0) {
                    updateProgress(movieIdNumber, episodeIdNumber, duration, duration)
                  }
                }
              } catch (error) {
                console.error('Lỗi onEnded:', error)
              }
            }}
          />
        </div>

        {/* ---------- thông tin + bình luận ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ContentInfoCard
              movie={movie}
              currentEpisode={activeEpisode ?? undefined}
              prevEpisode={prevEp ?? undefined}
              nextEpisode={nextEp ?? undefined}
              isMovie={!isSeries}
              episodeListResponse={{ episodes: episodes || [] }}
            />

            <CommentSection movieId={String(movie.id)} />
          </div>

          <div className="space-y-6">
            <RelatedMovies movie={movie} />
          </div>
        </div>
      </div>
    </div>
  )
}
