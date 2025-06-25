'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useVideoProgress from '@/hooks/watch/useVideoProgress'

// Extend HTMLVideoElement for webkit fullscreen support
declare global {
  interface HTMLVideoElement {
    webkitEnterFullscreen?: () => void;
    webkitExitFullscreen?: () => void;
  }
  
  interface Document {
    webkitFullscreenElement?: Element;
    webkitExitFullscreen?: () => void;
  }
}

interface MP4PlayerProps {
  src: string;
  title?: string;
  poster?: string;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
  subtitles?: {
    src: string;
    label: string;
    lang: string;
    default?: boolean;
  }[];
  onVideoElementReady?: (video: HTMLVideoElement) => void;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default function MP4Player({
  src,
  title = 'Video MP4',
  poster,
  initialTime = 0,
  onTimeUpdate,
  autoPlay = false,
  onEnded,
  className,
  subtitles = [],
  onVideoElementReady
}: MP4PlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ⭐ USE EXISTING useVideoProgress HOOK - This solves the seeking issue!
  const {
    currentTime,
    duration,
    isPlaying,
    isBuffering,
    loadedPercentage,
    seek,
    togglePlay: videoTogglePlay,
  } = useVideoProgress({
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    onProgress: ({ playedSeconds }) => {
      // Only call external onTimeUpdate if provided
      onTimeUpdate?.(playedSeconds)
    },
    progressInterval: 500 // 500ms throttle for smooth external tracking
  })

  // Additional state not covered by useVideoProgress
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hasSetInitialTime, setHasSetInitialTime] = useState(false)

  // Controls state
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)

  // Control visibility timer
  const hideControlsTimer = useRef<NodeJS.Timeout>(null)

  // Device detection
  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), [])
  const isMobile = useMemo(() => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent), [])

  // ⭐ CLEAN INITIAL TIME SETUP
  useEffect(() => {
    const video = videoRef.current
    if (!video || hasSetInitialTime || initialTime <= 0) return

    const handleLoadedMetadata = () => {
      if (initialTime > 0 && !hasSetInitialTime) {
        console.log('🚀 Setting initial time:', initialTime)
        seek(initialTime)
        setHasSetInitialTime(true)
      }
    }

    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
      console.error('MP4 Player Error:', video.error)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setHasError(false)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
    }

    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    const handleEnded = () => {
      onEnded?.()
    }

    // Add minimal event listeners (useVideoProgress handles the rest)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('ended', handleEnded)
    }
  }, [initialTime, hasSetInitialTime, seek, onEnded])

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement))
    }

    const handleWebkitFullscreenChange = () => {
      setIsFullscreen(!!document.webkitFullscreenElement)
    }

    // Standard fullscreen events
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    // Webkit fullscreen events (for iOS Safari)
    document.addEventListener('webkitfullscreenchange', handleWebkitFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleWebkitFullscreenChange)
    }
  }, [])

  // Mouse movement for controls visibility
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = () => {
      setShowControls(true)
      
      // Clear existing timer
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current)
      }

      // Set new timer to hide controls
      hideControlsTimer.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
    }

    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false)
      }
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current)
      }
    }
  }, [isPlaying])

  // Keyboard shortcuts - removed seeking controls for optimization
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when no input is focused
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.contentEditable === 'true'
      )) {
        return
      }

      const video = videoRef.current
      if (!video) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          videoTogglePlay()
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolumeLevel(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolumeLevel(Math.max(0, volume - 0.1))
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [volume, videoTogglePlay])

  // Removed seekRelative function for optimization

  const setVolumeLevel = useCallback((level: number) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = Math.min(Math.max(0, level), 1)
    video.volume = newVolume
    video.muted = newVolume === 0
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return
    
    if (isIOS) {
      // On iOS, use video element's native fullscreen
      if (video.webkitEnterFullscreen) {
        if (document.webkitFullscreenElement) {
          document.webkitExitFullscreen?.()
        } else {
          try {
            video.webkitEnterFullscreen()
          } catch (error) {
            console.warn('webkitEnterFullscreen failed:', error)
            // Fallback to standard fullscreen
            if (video.requestFullscreen) {
              video.requestFullscreen().catch(console.error)
            }
          }
        }
      } else if (video.requestFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error)
        } else {
          video.requestFullscreen().catch(console.error)
        }
      }
    } else {
      // On other devices, use container fullscreen
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(console.error)
      } else {
        document.exitFullscreen().catch(console.error)
      }
    }
  }, [isIOS])

  // ⭐ PROGRESS CLICK - Only enabled on mobile for optimization
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMobile) return // Disabled on desktop
    
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    seek(newTime)
  }, [duration, seek, isMobile])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolumeLevel(newVolume)
  }, [setVolumeLevel])

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // Calculate buffered percentage - use loadedPercentage from useVideoProgress
  const bufferedPercent = loadedPercentage

  useEffect(() => {
    if (videoRef.current) {
      onVideoElementReady?.(videoRef.current)
    }
  }, [onVideoElementReady])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-black overflow-hidden rounded-lg group",
        "aspect-[9/16] sm:aspect-video max-h-[calc(100vh-2rem)]",
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        videoTogglePlay()
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        src={src}
        poster={poster}
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
        title={title}
        controls={false}
        webkit-playsinline="true"
        x-webkit-airplay="allow"
      >
        {subtitles.map((subtitle, index) => (
          <track
            key={index}
            src={subtitle.src}
            label={subtitle.label}
            kind="subtitles"
            srcLang={subtitle.lang}
            default={subtitle.default}
          />
        ))}
      </video>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-red-400">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Không thể phát video</div>
            <div className="text-sm opacity-75">Vui lòng thử lại sau</div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || isBuffering) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-16 w-16 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !isBuffering && !hasError && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            videoTogglePlay()
          }}
          className="absolute inset-0 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <Play className="h-20 w-20 drop-shadow-xl" />
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 px-4 py-3",
          "bg-gradient-to-t from-black/90 via-black/60 to-transparent",
          "transition-all duration-300 backdrop-blur-sm border-t border-white/10",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar - Click disabled on desktop for optimization */}
        <div
          className="relative mb-3 h-4 flex items-center group/progress sm:cursor-default cursor-pointer"
          onClick={isMobile ? handleProgressClick : undefined}
        >
          {/* Progress Background */}
          <div className="absolute w-full h-2 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
            {/* Buffer Progress */}
            <div
              className="absolute h-full bg-white/20 rounded-full transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Progress */}
            <div
              className="absolute h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-lg transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Progress Handle */}
          <div
            className="absolute h-4 w-4 -translate-y-1/2 top-1/2 transition-all duration-150 group-hover/progress:scale-125"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          >
            <div className="relative h-full w-full">
              <div className="absolute inset-0 bg-blue-400/60 rounded-full blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-lg border-2 border-white/30" />
              <div className="absolute inset-1 bg-gradient-to-tr from-white/40 to-transparent rounded-full" />
            </div>
          </div>

          {/* Time Tooltip */}
          <div
            className="absolute -top-10 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
            style={{ left: `calc(${progressPercent}% - 20px)` }}
          >
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-white hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200 hover:scale-110"
              onClick={videoTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            {/* Skip buttons removed for optimization */}

            {/* Volume Controls */}
            <div className="flex items-center gap-2 group/volume">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200 hover:scale-110"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <div className="relative w-24 h-6 group-hover/volume:flex items-center hidden">
                <div className="absolute w-full h-2 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full shadow-lg transition-all duration-150"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                </div>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute w-full h-6 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="text-sm tabular-nums ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value)
                setPlaybackRate(rate)
                if (videoRef.current) {
                  videoRef.current.playbackRate = rate
                }
              }}
              className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1 hover:border-white/40 transition-colors"
            >
              <option value={0.5} className="bg-black">0.5x</option>
              <option value={0.75} className="bg-black">0.75x</option>
              <option value={1} className="bg-black">1x</option>
              <option value={1.25} className="bg-black">1.25x</option>
              <option value={1.5} className="bg-black">1.5x</option>
              <option value={2} className="bg-black">2x</option>
            </select>

            {/* Fullscreen */}
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-10 w-10 text-white hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 hover:scale-110",
                isIOS && "ring-2 ring-green-400/50" // Make more visible on iOS
              )}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              title={isIOS ? 'Tap for fullscreen video' : (isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen')}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 