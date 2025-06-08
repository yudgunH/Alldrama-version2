import React, { useState, useEffect } from 'react'
import VideoPlayer from '@/components/features/movie/VideoPlayer'
import { useVideoSources } from '../../../hooks/watch/useVideoSources'
import { useVideoTracking } from '../../../hooks/watch/useVideoTracking'
import { useVideoQuality, QualityLevel } from '../../../hooks/watch/useVideoQuality'
import { MovieWithSubtitles, EpisodeWithSubtitles } from '../../../hooks/watch/useWatchData'
import { Button } from '@/components/ui/button'
import { Settings, ChevronUp, ChevronDown, Smartphone, Monitor, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WatchPlayerProps {
  movie: MovieWithSubtitles;
  activeEpisode: EpisodeWithSubtitles | null;
  isSeries: boolean;
  startTime: number;
}

// Helper function để detect iOS và mobile
const isiOS = () => typeof navigator !== 'undefined' && /iP(hone|od|ad)/.test(navigator.userAgent)
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768



interface QualitySelectorProps {
  isVisible: boolean
  currentQuality: string
  availableQualities: QualityLevel[]
  onQualityChange: (quality: string) => void
  onClose: () => void
  isLoading?: boolean
}

function QualitySelector({ 
  isVisible, 
  currentQuality, 
  availableQualities, 
  onQualityChange, 
  onClose,
  isLoading = false
}: QualitySelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  useEffect(() => {
    const currentIndex = availableQualities.findIndex(q => q.label === currentQuality)
    setSelectedIndex(currentIndex >= 0 ? currentIndex : 0)
  }, [currentQuality, availableQualities])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(availableQualities.length - 1, prev + 1))
          break
                 case 'Enter':
           e.preventDefault()
           onQualityChange(availableQualities[selectedIndex].value.toString())
           onClose()
           break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, availableQualities, onQualityChange, onClose])

  if (!isVisible || availableQualities.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl max-w-xs w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-400" />
            <span className="text-white font-medium">Chất lượng video</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/70 hover:text-white h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>

        {/* Quality options */}
        <div className="py-2">
          {availableQualities.map((quality, index) => (
                         <button
               key={quality.value}
               onClick={() => {
                 onQualityChange(quality.value.toString())
                 onClose()
               }}
                             className={cn(
                 "w-full px-4 py-3 text-left flex items-center justify-between transition-all duration-200",
                 "hover:bg-white/10 active:bg-white/20",
                 selectedIndex === index && "bg-amber-500/20 border-l-4 border-amber-400",
                 currentQuality === quality.label && "text-amber-400",
                 isLoading && "opacity-50 cursor-not-allowed"
               )}
               disabled={isLoading}
            >
              <div className="flex items-center gap-3">
                {quality.value === 'auto' ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                <span className="font-medium">{quality.label}</span>
              </div>
                             {currentQuality === quality.label && !isLoading && (
                 <div className="w-2 h-2 bg-amber-400 rounded-full" />
               )}
               {isLoading && currentQuality === quality.label && (
                 <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
               )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/10 text-xs text-white/50 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <ChevronUp className="h-3 w-3" />
              <ChevronDown className="h-3 w-3" />
              Di chuyển
            </span>
            <span>Enter: Chọn</span>
            <span>Esc: Đóng</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WatchPlayer({ 
  movie, 
  activeEpisode, 
  isSeries, 
  startTime 
}: WatchPlayerProps) {
  const [showQualitySelector, setShowQualitySelector] = useState(false)
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null)
  const [hlsInstance, setHlsInstance] = useState<any>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  const { videoSrc, posterSrc, title, subtitles } = useVideoSources({
    movie,
    activeEpisode,
    isSeries
  });

  const { handleTimeUpdate, handleVideoEnd } = useVideoTracking({
    movie,
    activeEpisode
  });

  // Use the video quality hook with real HLS instance
  const { 
    availableQualities, 
    currentQuality, 
    isLoading: qualityLoading,
    changeQuality 
  } = useVideoQuality({
    videoElement,
    hlsInstance,
    isHLS: true
  });

  // Show quality selector only on iOS or mobile
  const shouldShowQualityButton = isiOS() || isMobile()

  // Load user preference on mount - temporarily disabled to prevent infinite loop
  // useEffect(() => {
  //   const savedQuality = localStorage.getItem('preferredVideoQuality')
  //   if (savedQuality && hlsInstance && availableQualities.length > 0 && currentQuality === 'Auto') {
  //     // Only apply saved quality if current quality is still Auto (not yet set)
  //     changeQuality(savedQuality).catch(console.error)
  //   }
  // }, [availableQualities, hlsInstance, currentQuality])

  // Keyboard shortcut to open quality selector
  useEffect(() => {
    if (!shouldShowQualityButton) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault()
        setShowQualitySelector(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shouldShowQualityButton])

  // Handle quality change
  const handleQualityChange = async (quality: string) => {
    try {
      // Use the real HLS quality change function
      await changeQuality(quality)
      
      // Store user preference in localStorage
      localStorage.setItem('preferredVideoQuality', quality)
      
      // Add haptic feedback on iOS
      if (isiOS() && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.error('Failed to change quality:', error)
    }
  }

  // Handle HLS ready callback
  const handleHLSReady = (hls: any, video: HTMLVideoElement) => {
    setHlsInstance(hls)
    setVideoElement(video)
  }

  // Auto-hide quality button after 10 seconds
  useEffect(() => {
    if (showQualitySelector) {
      const timer = setTimeout(() => {
        setShowQualitySelector(false)
      }, 10000)
      
      setAutoHideTimer(timer)
      
      return () => {
        clearTimeout(timer)
        if (autoHideTimer) clearTimeout(autoHideTimer)
      }
    }
  }, [showQualitySelector])

  // Handle touch events for better mobile UX
  const handleQualityButtonTouch = () => {
    setShowQualitySelector(true)
    
    // Add haptic feedback
    if (isiOS() && 'vibrate' in navigator) {
      navigator.vibrate(30)
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto md:max-w-none md:mx-0">
      <VideoPlayer
        key={`${movie.id}-${activeEpisode?.id || 'movie'}`}
        src={videoSrc}
        poster={posterSrc}
        title={title}
        autoPlay={false}
        useCustomControls={!isiOS()} // Disable custom controls on iOS
        useTestVideo={!videoSrc}
        subtitles={subtitles}
        initialTime={startTime}
        isHLS={true}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        onHLSReady={handleHLSReady}
      />

             {/* Floating Quality Button for iOS and Mobile */}
       {shouldShowQualityButton && (
         <div className="fixed bottom-20 right-4 z-40 md:hidden">
           <Button
             onClick={handleQualityButtonTouch}
             className={cn(
               "h-12 w-12 rounded-full",
               "bg-black/80 backdrop-blur-md border border-white/20",
               "text-white hover:text-amber-400 hover:bg-black/90",
               "shadow-2xl transition-all duration-300",
               "hover:scale-110 active:scale-95",
               "flex items-center justify-center group"
             )}
             size="icon"
             variant="ghost"
             title="Chất lượng video (Q)"
           >
             <Settings className="h-5 w-5" />
           </Button>
           
           {/* Tooltip */}
           <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
             Chất lượng (Q)
           </div>
         </div>
       )}

      {/* Quality Selector Modal */}
             <QualitySelector
         isVisible={showQualitySelector}
         currentQuality={currentQuality}
         availableQualities={availableQualities}
         onQualityChange={handleQualityChange}
         onClose={() => setShowQualitySelector(false)}
         isLoading={qualityLoading}
       />

             {/* Quality indicator badge */}
       {shouldShowQualityButton && currentQuality && currentQuality !== 'Auto' && (
         <div className="fixed top-4 right-4 z-30 px-2 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 text-white text-xs font-medium flex items-center gap-1">
           {qualityLoading && <Loader2 className="h-3 w-3 animate-spin" />}
           {currentQuality}
         </div>
       )}
    </div>
  );
} 