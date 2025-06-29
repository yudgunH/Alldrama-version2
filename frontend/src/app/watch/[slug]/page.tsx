'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import NotFoundMessage from '@/components/features/watch/NotFoundMessage'
import ContentInfoCard from '@/components/features/watch/ContentInfoCard'
import CommentSection from '@/components/features/movie/CommentSection'
import RelatedMovies from '@/components/features/watch/RelatedMovies'
import WatchPlayer from '@/components/features/watch/WatchPlayer'
import { useWatchData } from '@/hooks/watch/useWatchData'
import { generateWatchUrl } from '@/utils/url'
import { Movie, Episode } from '@/types'
import NativeBanner from '@/components/ui/NativeBanner'

export default function WatchPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const slug = params?.slug || ''
  const episodeId = searchParams?.get('episode')
  const savedProgress = searchParams?.get('progress')

  // Use custom hook for data fetching
  const {
    movie,
    episodes,
    activeEpisode,
    nextEp,
    prevEp,
    movieId,
    isLoading,
    error,
    isSeries
  } = useWatchData({ slug, episodeId })

  // Calculate start time from saved progress
  const startTime = useMemo(() => {
    if (!savedProgress) return 0
    try {
      const progress = parseInt(savedProgress, 10)
      return (!isNaN(progress) && progress > 0) ? progress : 0
    } catch (e) {
      return 0
    }
  }, [savedProgress])

  // Loading state
  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Skeleton className="w-3/4 h-[80%] max-w-7xl rounded-xl" />
      </div>
    )
  }

  // Error state
  if (error || !movie) {
    return (
      <NotFoundMessage 
        message="Không thể tải nội dung" 
        description={error?.message || 'Đã xảy ra lỗi khi tải nội dung'} 
      />
    )
  }

  // Generate episode watch URL helper
  const generateEpisodeLink = (movie: Movie, episode: Episode) => {
    return generateWatchUrl(movie.id, movie.title, episode.id, episode.episodeNumber)
  }

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

        {/* Video Player */}
        <WatchPlayer
          movie={movie}
          activeEpisode={activeEpisode}
          isSeries={isSeries}
          startTime={startTime}
        />

        {/* Native Banner sau video player */}
        <div className="py-4">
          <NativeBanner style="full" />
        </div>

        {/* Content and Comments */}
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
            
            {/* Native Banner trong sidebar */}
            <div className="py-2">
              <NativeBanner style="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
