'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Subtitles, SkipBack, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useMobile } from '@/hooks/use-mobile'

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  autoPlay?: boolean
  controls?: boolean
  className?: string
  onTimeUpdate?: (time: number) => void
  initialTime?: number
  episodeInfo?: {
    id: string
    title: string
    number: number
    prevEpisode: any | null
    nextEpisode: any | null
    movieId: string
    movieTitle: string
  }
}

const VideoPlayer = ({
  src,
  poster,
  title,
  autoPlay = false,
  controls = true,
  className = '',
  onTimeUpdate,
  initialTime = 0,
  episodeInfo
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const hideControlsTimer = useRef<NodeJS.Timeout>(null)
  const isMobile = useMobile()

  // Initialize video player
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current
    video.currentTime = initialTime

    const handleDurationChange = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onTimeUpdate?.(video.currentTime)
    }

    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleWaiting = () => setIsBuffering(true)
    const handlePlaying = () => setIsBuffering(false)

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const progress = (bufferedEnd / video.duration) * 100
        setLoadProgress(progress)
      }
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("volumechange", handleVolumeChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("progress", handleProgress)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("volumechange", handleVolumeChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("progress", handleProgress)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [initialTime, onTimeUpdate])

  // Hide controls after a period of time
  useEffect(() => {
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current)
    }

    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    } else {
      setShowControls(true)
    }

    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current)
      }
    }
  }, [isPlaying])

  // Handle play/pause
  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }

  // Skip backward 10 seconds
  const skipBackward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
  }
  
  // Skip forward 10 seconds
  const skipForward = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
  }

  // Handle mute/unmute
  const toggleMute = () => {
    if (!videoRef.current) return

    videoRef.current.muted = !videoRef.current.muted
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!playerRef.current) return

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error(err))
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error(err))
    }
  }

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return

    const time = Number.parseFloat(e.target.value)
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return

    const vol = Number.parseFloat(e.target.value)
    videoRef.current.volume = vol
    videoRef.current.muted = vol === 0
  }

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${secs < 10 ? "0" : ""}${secs}`
    }

    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div
      ref={playerRef}
      className={cn("relative w-full aspect-video bg-black overflow-hidden", className)}
      onMouseMove={() => {
        setShowControls(true)

        if (hideControlsTimer.current) {
          clearTimeout(hideControlsTimer.current)
        }

        if (isPlaying) {
          hideControlsTimer.current = setTimeout(() => {
            setShowControls(false)
          }, 3000)
        }
      }}
    >
      {/* Title bar */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-medium text-sm md:text-base truncate">{title}</h2>
        </div>
      </div>
      )}

      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        poster={poster}
        onClick={togglePlay}
        playsInline
      />

      {/* Subtitles */}
      {showSubtitles && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/70 text-white px-4 py-1 rounded text-center max-w-lg">
            Và nước đầu tiên <br />
            kiểm soát được sức mạnh của nó
          </div>
        </div>
      )}

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Center play/pause button overlay */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black/50 rounded-full flex items-center justify-center"
          aria-label="Play"
        >
          <Play className="w-10 h-10 text-white fill-current" />
        </button>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar container */}
          <div className="mb-2 relative">
            {/* Buffer progress */}
            <div className="absolute h-1.5 bg-white/20 rounded-full" style={{ width: `${loadProgress}%` }}></div>

            {/* Seek bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="video-player-progress"
              style={{
                backgroundImage: `linear-gradient(to right, #f59e0b ${(currentTime / (duration || 1)) * 100}%, transparent ${(currentTime / (duration || 1)) * 100}%)`,
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                      className="text-white hover:text-amber-500 transition-colors"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isPlaying ? "Tạm dừng" : "Phát"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Skip backward 10s */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipBackward}
                      className="text-white hover:text-amber-500 transition-colors"
                      aria-label="Lùi 10 giây"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lùi 10 giây</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Skip forward 10s */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipForward}
                      className="text-white hover:text-amber-500 transition-colors"
                      aria-label="Tiến 10 giây"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tiến 10 giây</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Volume control + Time */}
              <div className="flex items-center space-x-1 group relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="text-white hover:text-amber-500 transition-colors z-20"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isMuted ? "Bật âm thanh" : "Tắt âm thanh"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className={`absolute left-8 top-1/2 -translate-y-1/2 w-0 scale-x-0 opacity-0 group-hover:w-24 group-hover:scale-x-100 group-hover:opacity-100 transition-all duration-300 ease-in-out origin-left bg-amber-500 rounded-full appearance-none cursor-pointer h-1 ${isMobile ? 'hidden' : 'block'} z-10`}
                  style={{
                    backgroundImage: `linear-gradient(to right, #f59e0b ${(isMuted ? 0 : volume) * 100}%, #4b5563 ${(isMuted ? 0 : volume) * 100}%)`,
                  }}
                />
                <div className={`text-white text-sm transition-all duration-300 ease-in-out ${isMobile ? 'hidden' : 'flex'} group-hover:translate-x-28 min-w-[5rem]`}>
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatTime(duration || 0)}</span>
                </div>
              </div>

              {/* Time */}
            </div>

            <div className="flex items-center gap-2">
              {/* Subtitles button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSubtitles(!showSubtitles)}
                      className={cn(
                        "text-white hover:text-amber-500 transition-colors",
                        showSubtitles && "text-amber-500"
                      )}
                      aria-label={showSubtitles ? "Tắt phụ đề" : "Bật phụ đề"}
                    >
                      <Subtitles className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showSubtitles ? "Tắt phụ đề" : "Bật phụ đề"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Settings button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSettings(!showSettings)}
                      className={cn(
                        "text-white hover:text-amber-500 transition-colors",
                        showSettings && "text-amber-500"
                      )}
                      aria-label="Cài đặt"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cài đặt</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Fullscreen button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-white hover:text-amber-500 transition-colors"
                      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && showControls && (
        <div className="absolute right-4 bottom-16 bg-black/90 rounded-md p-3 w-48">
          <h4 className="text-white text-sm font-medium mb-2">Cài đặt</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white text-xs">Chất lượng</span>
              <select className="bg-gray-800 text-white text-xs rounded px-2 py-1 border-none">
                <option>1080p</option>
                <option>720p</option>
                <option>480p</option>
                <option>360p</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white text-xs">Tốc độ</span>
              <select className="bg-gray-800 text-white text-xs rounded px-2 py-1 border-none">
                <option>0.5x</option>
                <option selected>1x</option>
                <option>1.5x</option>
                <option>2x</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoPlayer