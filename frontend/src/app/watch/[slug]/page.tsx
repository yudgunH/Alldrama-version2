'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { Movie, Episode } from '@/types'
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
import { apiClient } from '@/lib/api/apiClient'

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
  
  /* ----------------- local state ----------------- */
  const [movie,  setMovie]  = useState<MovieWithSubtitles | null>(null)
  const [eps,    setEps]    = useState<EpisodeWithSubtitles[]>([])
  const [ep,     setEp]     = useState<EpisodeWithSubtitles | null>(null)
  const [nextEp, setNextEp] = useState<EpisodeWithSubtitles | null>(null)
  const [prevEp, setPrevEp] = useState<EpisodeWithSubtitles | null>(null)

  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  
  /* ----------------- UI control ----------------- */
  const [viewMode,  setViewMode]    = useState<'grid' | 'list'>('grid')
  
  /* ----------------- derived ----------------- */
  const isSeries = Boolean(ep)
  
  /* ----------------- Auth & Watch History ----------------- */
  const { isAuthenticated } = useAuth()
  const { updateProgress } = useWatchHistory()
  
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
        if (isSeries && ep) {
          episodeIdNumber = Number(ep.id)
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
    [isAuthenticated, movie, isSeries, ep, updateProgress]
  )

  /* ----------------- fetch data ----------------- */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setErr(null)

        /* id trong slug ở cuối: phim-hay-123  -> 123 */
        const movieId = slug.split('-').pop()
        if (!movieId || isNaN(+movieId)) throw new Error('invalid id')

        /* movie */
        const m = await apiClient.get<Movie>(API_ENDPOINTS.MOVIES.DETAIL(movieId))
        setMovie(m)

        /* lấy danh sách tập (nếu có) */
        if (m.totalEpisodes > 0) {
          const list = await apiClient.get<Episode[]>(API_ENDPOINTS.EPISODES.LIST_BY_MOVIE(movieId))
          setEps(list)

          // xác định tập hiện tại
          let current = list[0]
          if (episodeId) {
            const found = list.find((e: EpisodeWithSubtitles) => String(e.id) === episodeId)
            if (found) current = found
          }
          setEp(current)

          const idx = list.findIndex((e: EpisodeWithSubtitles) => e.id === current.id)
          setPrevEp(idx > 0 ? list[idx - 1] : null)
          setNextEp(idx < list.length - 1 ? list[idx + 1] : null)
        }
      } catch (e) {
        console.error(e)
        setErr('Đã xảy ra lỗi khi tải nội dung')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, episodeId])

  /* ----------------- loading / error ----------------- */
  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Skeleton className="w-3/4 h-[80%] max-w-7xl rounded-xl" />
      </div>
    )
  }
  if (err || !movie) {
    return <NotFoundMessage message="Không thể tải nội dung" description={err || ''} />
  }

  /* ----------------- derived values ----------------- */
  // Get video source URL with proper fallbacks
  const getVideoSrc = () => {
    // For episode, use its playlist if available
    if (isSeries && ep) {
      if (ep.playlistUrl && ep.playlistUrl.startsWith('http')) {
        return ep.playlistUrl;
      }
      // If not, try to construct it intelligently
      if (movie.id && ep.episodeNumber) {
        return `https://media.alldrama.tech/episodes/${movie.id}/${ep.episodeNumber}/hls/master.m3u8`;
      }
    }
    
    // For movie, use its playlist if available
    if (movie.playlistUrl && movie.playlistUrl.startsWith('http')) {
      return movie.playlistUrl;
    }
    
    // Fallback to constructed URL
    return `https://media.alldrama.tech/movies/${movie.id}/hls/master.m3u8`;
  };
  
  const videoSrc = getVideoSrc();
  
  // Get poster URL with proper fallbacks and without hardcoded paths
  const getPosterUrl = () => {
    // For episode, use its thumbnail if available
    if (isSeries && ep) {
      if (ep.thumbnailUrl && ep.thumbnailUrl.startsWith('http')) {
        return ep.thumbnailUrl;
      }
      // If not, try to construct it intelligently
      if (movie.id && ep.episodeNumber) {
        return `https://media.alldrama.tech/episodes/${movie.id}/${ep.episodeNumber}/thumbnail.jpg`;
      }
    }
    
    // For movie, use its poster if available
    if (movie.posterUrl) {
      if (movie.posterUrl.startsWith('http')) {
        return movie.posterUrl;
      }
      return `https://media.alldrama.tech/movies/${movie.id}/poster.png`;
    }
    
    // Fallback to placeholder
    return '/placeholder.svg';
  };
  
  const posterSrc = getPosterUrl();
  
  const title = isSeries
    ? `${movie.title} - Tập ${ep!.episodeNumber}: ${ep!.title}`
    : movie.title
  
  // Get subtitles with proper types
  const subtitles = isSeries 
    ? (ep!.subtitles || [])
    : (movie.subtitles || [])
  
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

  /* ----------------- autoplay handling ----------------- */
  // Removing autoplay - will only play when user clicks
  
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
        <div className="relative">
          {/* Sheet mobile */}
          {isSeries && (
            <MobileEpisodeSheet
              episodes={eps}
              currentEpisode={ep!}
              movieId={String(movie.id)}
              movieTitle={movie.title}
              episodeView={viewMode}
              setEpisodeView={(mode) => {
                // Prevent unnecessary re-renders by checking if value actually changed
                if (mode !== viewMode) {
                  setViewMode(mode);
                }
              }}
            />
          )}

          {/* player */}
          <VideoPlayer
            key={`${videoSrc}-${startTime}`} // Use a stable key to prevent unnecessary re-renders
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
                  
                  if (isSeries && ep) {
                    episodeIdNumber = Number(ep.id)
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
              currentEpisode={ep ?? undefined}
              prevEpisode={prevEp ?? undefined}
              nextEpisode={nextEp ?? undefined}
              isMovie={!isSeries}
              episodeListResponse={{ episodes: eps }}
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
