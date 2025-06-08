import { useState, useCallback, useEffect, useRef } from 'react'
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

  // Use refs to avoid recreating callbacks when data changes
  const movieRef = useRef(movie)
  const activeEpisodeRef = useRef(activeEpisode)
  const hasTrackedViewRef = useRef(hasTrackedView)

  // Update refs when data changes
  useEffect(() => {
    movieRef.current = movie
  }, [movie])

  useEffect(() => {
    activeEpisodeRef.current = activeEpisode
  }, [activeEpisode])

  useEffect(() => {
    hasTrackedViewRef.current = hasTrackedView
  }, [hasTrackedView])

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
      if (!isAuthenticated || !movieRef.current) return
      
      try {
        const movieIdNumber = Number(movieRef.current.id)
        let episodeIdNumber: number
        
        if (activeEpisodeRef.current) {
          episodeIdNumber = Number(activeEpisodeRef.current.id)
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
    [isAuthenticated, updateProgress]
  )

  // Function to track view count
  const trackViewCount = useCallback(async (time: number, duration: number) => {
    if (hasTrackedViewRef.current || !movieRef.current) return
    
    const shouldTrackView = time > 45 || (duration > 0 && time / duration > 0.15)
    if (!shouldTrackView) return
    
    try {
      const movieIdNumber = Number(movieRef.current.id)
      
      if (activeEpisodeRef.current) {
        const episodeIdNumber = Number(activeEpisodeRef.current.id)
        await incrementEpisodeView(episodeIdNumber, movieIdNumber, Math.floor(time), Math.floor(duration))
      } else {
        await incrementMovieView(movieIdNumber, Math.floor(time), Math.floor(duration))
      }
      
      setHasTrackedView(true)
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }, [incrementMovieView, incrementEpisodeView]) // Minimal dependencies

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
      if (movieRef.current) {
        const videoElement = document.querySelector('video')
        const duration = videoElement?.duration || 0
        
        const movieIdNumber = Number(movieRef.current.id)
        let episodeIdNumber: number
        
        if (activeEpisodeRef.current) {
          episodeIdNumber = Number(activeEpisodeRef.current.id)
        } else {
          episodeIdNumber = movieIdNumber
        }
        
        if (!isNaN(movieIdNumber) && !isNaN(episodeIdNumber) && 
            movieIdNumber > 0 && episodeIdNumber > 0 && 
            isFinite(duration) && duration > 0) {
          
          if (!hasTrackedViewRef.current) {
            trackViewCount(duration, duration)
          }
          
          if (isAuthenticated) {
            updateProgress(movieIdNumber, episodeIdNumber, duration, duration)
          }
        }
      }
    } catch (error) {
      console.error('Error handling video end:', error)
    }
  }, [trackViewCount, isAuthenticated, updateProgress]) // Minimal dependencies

  return {
    handleTimeUpdate,
    handleVideoEnd
  }
} 