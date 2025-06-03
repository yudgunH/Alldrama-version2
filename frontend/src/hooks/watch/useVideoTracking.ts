import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/api/useAuth'
import { useWatchHistory } from '@/hooks/api/useWatchHistory'
import { useViews } from '@/hooks/api/useViews'
import { MovieWithSubtitles, EpisodeWithSubtitles } from './useWatchData'

interface UseVideoTrackingProps {
  movie: MovieWithSubtitles | null;
  activeEpisode: EpisodeWithSubtitles | null;
}

export function useVideoTracking({ movie, activeEpisode }: UseVideoTrackingProps) {
  const [hasTrackedView, setHasTrackedView] = useState(false)
  
  const { isAuthenticated } = useAuth()
  const { updateProgress } = useWatchHistory()
  const { useMovieViewIncrement, useEpisodeViewIncrement } = useViews()
  const { incrementView: incrementMovieView } = useMovieViewIncrement()
  const { incrementView: incrementEpisodeView } = useEpisodeViewIncrement()

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
      
      try {
        const movieIdNumber = Number(movie.id)
        let episodeIdNumber: number
        
        if (activeEpisode) {
          episodeIdNumber = Number(activeEpisode.id)
        } else {
          episodeIdNumber = movieIdNumber
        }
        
        const validTime = isFinite(time) ? Math.floor(time) : 0
        const validDuration = isFinite(duration) ? Math.floor(duration) : 0
        
        if (isNaN(movieIdNumber) || isNaN(episodeIdNumber) || movieIdNumber <= 0 || episodeIdNumber <= 0) {
          return
        }
        
        if (validDuration >= 5) {
          updateProgress(movieIdNumber, episodeIdNumber, validTime, validDuration)
        }
      } catch (err) {
        // Silent error handling
      }
    }, 5000),
    [isAuthenticated, movie, activeEpisode, updateProgress]
  )

  // Function to track view count
  const trackViewCount = useCallback(async (time: number, duration: number) => {
    if (hasTrackedView || !movie) return
    
    const shouldTrackView = time > 45 || (duration > 0 && time / duration > 0.15)
    if (!shouldTrackView) return
    
    try {
      const movieIdNumber = Number(movie.id)
      
      if (activeEpisode) {
        const episodeIdNumber = Number(activeEpisode.id)
        await incrementEpisodeView(episodeIdNumber, movieIdNumber, Math.floor(time), Math.floor(duration))
      } else {
        await incrementMovieView(movieIdNumber, Math.floor(time), Math.floor(duration))
      }
      
      setHasTrackedView(true)
    } catch (error) {
      // Silent error handling
    }
  }, [hasTrackedView, movie, activeEpisode, incrementMovieView, incrementEpisodeView])

  // Reset view tracking when episode changes
  useEffect(() => {
    setHasTrackedView(false)
  }, [activeEpisode?.id, movie?.id])

  // Handle time update
  const handleTimeUpdate = useCallback((time: number) => {
    try {
      const videoElement = document.querySelector('video')
      if (!videoElement) return
      
      const duration = videoElement.duration || 0
      trackViewCount(time, duration)
      
      if (isAuthenticated) {
        debouncedUpdateProgress(time, duration)
      }
    } catch (error) {
      // Silent error handling
    }
  }, [trackViewCount, debouncedUpdateProgress, isAuthenticated])

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    try {
      if (movie) {
        const videoElement = document.querySelector('video')
        const duration = videoElement?.duration || 0
        
        const movieIdNumber = Number(movie.id)
        let episodeIdNumber: number
        
        if (activeEpisode) {
          episodeIdNumber = Number(activeEpisode.id)
        } else {
          episodeIdNumber = movieIdNumber
        }
        
        if (!isNaN(movieIdNumber) && !isNaN(episodeIdNumber) && 
            movieIdNumber > 0 && episodeIdNumber > 0 && 
            isFinite(duration) && duration > 0) {
          
          if (!hasTrackedView) {
            trackViewCount(duration, duration)
          }
          
          if (isAuthenticated) {
            updateProgress(movieIdNumber, episodeIdNumber, duration, duration)
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  }, [movie, activeEpisode, hasTrackedView, trackViewCount, isAuthenticated, updateProgress])

  return {
    handleTimeUpdate,
    handleVideoEnd
  }
} 