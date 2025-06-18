'use client'

import {useState,useRef,useEffect,useCallback,useMemo} from 'react'
import Hls, {Level, ErrorData} from 'hls.js'
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Maximize, Minimize,
  Settings, Loader2, PictureInPicture
} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {Tooltip, TooltipProvider, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils'
import type {VideoPlayerProps} from '@/types/media'

/* ------------------------------------------------------------------
 * constants + helpers
 * ----------------------------------------------------------------*/
const TEST_HLS    = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
const TEST_MP4    = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const TEST_POSTER = 'https://peach.blender.org/wp-content/uploads/bbb-splash.png'

const isiOS = () =>
  typeof navigator !== 'undefined' && /iP(hone|od|ad)/.test(navigator.userAgent)

const throttle = <T extends (...args:any)=>void>(fn:T, ms=500) => {
  let timer = false
  return (...a:Parameters<T>)=>{
    if(timer) return
    timer = true
    fn(...a)
    setTimeout(()=>{timer=false}, ms)
  }
}

// Helper function để extract quality từ URL m3u8
const extractQualityFromUrl = (url: string): string => {
  if (!url) return 'Unknown'
  
  // Tìm pattern như 1080m3u8, 720m3u8, etc.
  const qualityMatch = url.match(/(\d+)(?:p?m3u8|p\.m3u8|p)/i)
  if (qualityMatch) {
    return `${qualityMatch[1]}p`
  }
  
  // Tìm pattern khác như HD, FHD, 4K
  const namedQualityMatch = url.match(/(4K|FHD|HD|SD)/i)
  if (namedQualityMatch) {
    const quality = namedQualityMatch[1].toUpperCase()
    switch (quality) {
      case '4K': return '2160p'
      case 'FHD': return '1080p'
      case 'HD': return '720p'
      case 'SD': return '480p'
      default: return quality
    }
  }
  
  return 'Auto'
}

// Helper function để format quality label
const formatQualityLabel = (level: Level, index: number, url?: string): string => {
  // Nếu có height từ HLS manifest, ưu tiên sử dụng
  if (level.height && level.height > 0) {
    return `${level.height}p`
  }
  
  // Nếu không có height, thử extract từ URL
  if (level.url) {
    const levelUrl = Array.isArray(level.url) ? level.url[0] : level.url
    const qualityFromUrl = extractQualityFromUrl(levelUrl)
    if (qualityFromUrl !== 'Auto') {
      return qualityFromUrl
    }
  }
  
  // Thử extract từ video source URL nếu có
  if (url) {
    const qualityFromMainUrl = extractQualityFromUrl(url)
    if (qualityFromMainUrl !== 'Auto') {
      return qualityFromMainUrl
    }
  }
  
  // Fallback dựa trên bitrate
  if (level.bitrate) {
    const bitrate = level.bitrate
    if (bitrate >= 5000000) return '1080p+'
    if (bitrate >= 3000000) return '1080p'
    if (bitrate >= 1500000) return '720p'
    if (bitrate >= 800000) return '480p'
    if (bitrate >= 400000) return '360p'
    return '240p'
  }
  
  // Fallback cuối cùng
  return `Quality ${index + 1}`
}

/* ------------------------------------------------------------------
 * Video Player component
 * ----------------------------------------------------------------*/
export default function VideoPlayer({
  src,
  videoUrl,
  title,
  poster,
  initialTime = 0,
  onTimeUpdate,
  autoPlay = false,
  onEnded,
  isHLS = true,             // true nếu chuỗi .m3u8
  useCustomControls = true,  // always respects this setting for all devices
  useTestVideo = false,
  subtitles = [],             // [{src,label,lang,default?}]
  onHLSReady,
  onQualityLevelsUpdate,
  onQualityChange
}: VideoPlayerProps & {
  subtitles?: {src:string;label:string;lang:string;default?:boolean}[]
  onHLSReady?: (hls: any, video: HTMLVideoElement) => void
  onQualityLevelsUpdate?: (levels: any[]) => void
  onQualityChange?: (level: number) => void
}) {
  /* ----------------------------------------------------------------
   * decide source & flags
   * --------------------------------------------------------------*/
  const videoSrc = useMemo(() => {
    if (useTestVideo) return TEST_HLS
    return src || videoUrl || ''
  }, [useTestVideo, src, videoUrl])

  const testMode = useMemo(() => useTestVideo || !videoSrc, [useTestVideo, videoSrc])
  const displayTitle = useMemo(() => (
    testMode ? 'Video Test: Big Buck Bunny' : (title || 'Đang phát')
  ), [testMode, title])

  const hlsStream = useMemo(() => videoSrc.endsWith('.m3u8'), [videoSrc])
  const custom = useCustomControls   // Always respect the useCustomControls prop

  /* ----------------------------------------------------------------
   * refs & basic state
   * --------------------------------------------------------------*/
  const vRef = useRef<HTMLVideoElement>(null)
  const cRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls|null>(null)

  const [playing, setPlaying]   = useState(false)
  const [dur,     setDur]       = useState(0)
  const [time,    setTime]      = useState(initialTime)
  const [wait,    setWait]      = useState(false)
  const [vol,     setVol]       = useState(1)
  const [muted,   setMuted]     = useState(false)
  const [levels,  setLevels]    = useState<Level[]>([])
  const [level,   setLevel]     = useState(-1)            // -1 = auto
  const [currentQuality, setCurrentQuality] = useState<string>('Auto')
  const [availableQualities, setAvailableQualities] = useState<{label: string, value: number | string}[]>([])
  const [full,    setFull]      = useState(false)
  const [fatalErr,setFatalErr]  = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isPiP, setIsPiP] = useState(false)
  const [isSpeedDropdownOpen, setIsSpeedDropdownOpen] = useState(false)
  const [isQualityDropdownOpen, setIsQualityDropdownOpen] = useState(false)
  
  // Combined state for any dropdown being open
  const isDropdownOpen = isSpeedDropdownOpen || isQualityDropdownOpen
  const [forceHLSJS, setForceHLSJS] = useState(true) // Default to forcing HLS.js on iOS
  const [showControlsOnMobile, setShowControlsOnMobile] = useState(true)

  /* ----------------------------------------------------------------
   * progress callback (throttled)
   * --------------------------------------------------------------*/
  const emitProgress = useCallback(throttle((t:number)=>onTimeUpdate?.(t),500),[onTimeUpdate])

  /* ----------------------------------------------------------------
   * baseline listeners
   * --------------------------------------------------------------*/
  useEffect(()=>{
    const v = vRef.current
    if(!v) return
    v.currentTime = initialTime

    const onDur    = () => setDur(v.duration || 0)
    const onTime   = () => { setTime(v.currentTime); emitProgress(v.currentTime) }
    const onPlay   = () => setPlaying(true)
    const onPause  = () => setPlaying(false)
    const onWait   = () => setWait(true)
    const onPlayng = () => setWait(false)
    const onVol    = () => { setVol(v.volume); setMuted(v.muted) }
    const onEnd    = () => onEnded?.()

    v.addEventListener('durationchange',onDur)
    v.addEventListener('timeupdate',onTime)
    v.addEventListener('play',onPlay)
    v.addEventListener('pause',onPause)
    v.addEventListener('waiting',onWait)
    v.addEventListener('playing',onPlayng)
    v.addEventListener('volumechange',onVol)
    v.addEventListener('ended',onEnd)
    return ()=>{
      v.removeEventListener('durationchange',onDur)
      v.removeEventListener('timeupdate',onTime)
      v.removeEventListener('play',onPlay)
      v.removeEventListener('pause',onPause)
      v.removeEventListener('waiting',onWait)
      v.removeEventListener('playing',onPlayng)
      v.removeEventListener('volumechange',onVol)
      v.removeEventListener('ended',onEnd)
    }
  },[initialTime, emitProgress, onEnded])

  /* ----------------------------------------------------------------
   * Mobile controls logic - stable for iOS
   * --------------------------------------------------------------*/
  useEffect(() => {
    if (window.innerWidth < 640) { // sm breakpoint
      // Always show controls on mobile/iOS for better UX
      setShowControlsOnMobile(true)
    }
  }, [])

  /* ----------------------------------------------------------------
   * init / destroy HLS.js
   * --------------------------------------------------------------*/
  useEffect(()=>{
    const v = vRef.current
    if(!v || !videoSrc) return
    
    if(v.src === videoSrc && hlsRef.current) return
    
    if(hlsRef.current){ hlsRef.current.destroy(); hlsRef.current=null }

    // FORCE HLS.js on iOS for quality control - this is the key change!
    const shouldForceHLS = isiOS() && Hls.isSupported() && forceHLSJS
    const useNativeHLS = !hlsStream || (v.canPlayType('application/vnd.apple.mpegurl') && !shouldForceHLS)
    
    if(useNativeHLS || !hlsStream) {
      // Sử dụng phát native cho MP4 hoặc HLS native
      v.src = videoSrc

      
      // Chỉ xử lý tracks cho HLS trên iOS
      if(hlsStream && isiOS()) {
        const handleLoadedMetadata = () => {
          setTimeout(() => {
            const videoElement = v as any // Cast for iOS videoTracks access
            if(videoElement.videoTracks && videoElement.videoTracks.length > 0) {
              // Create fake levels array from videoTracks for UI consistency
              const fakeLevels = Array.from(videoElement.videoTracks).map((track: any, index: number) => {
                const height = parseInt(track.label?.match(/(\d+)p/)?.[1]) || (720 - index * 240)
                return {
                  height,
                  width: Math.round(height * 16/9),
                  bitrate: 0,
                  url: '',
                  attrs: { RESOLUTION: track.label || `${height}p` }
                } as unknown as Level
              })
              setLevels(fakeLevels)
              onQualityLevelsUpdate?.(fakeLevels)
            } else {
              // If no tracks detected, set fallback levels for UI
              const fallbackLevels = [
                { height: 1080, width: 1920, bitrate: 0, url: '', attrs: { RESOLUTION: '1080p' } },
                { height: 720, width: 1280, bitrate: 0, url: '', attrs: { RESOLUTION: '720p' } },
                { height: 480, width: 854, bitrate: 0, url: '', attrs: { RESOLUTION: '480p' } }
              ] as unknown as Level[]
              setLevels(fallbackLevels)
              onQualityLevelsUpdate?.(fallbackLevels)
            }
          }, 1000) // Wait for tracks to be populated
        }
        
        v.addEventListener('loadedmetadata', handleLoadedMetadata)
        
        // Cleanup listener
        return () => {
          v.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
      }
      
      return
    }

    // Use HLS.js (either forced on iOS or normal on other platforms)
    if(shouldForceHLS) {
      // Try to prevent iOS from intercepting the video
      if(v.src !== '') {
        v.removeAttribute('src')
        v.load()
      }
    }

    if(Hls.isSupported()){
      // iOS-specific configuration to force HLS.js
      const hlsConfig = {
        startLevel: -1, 
        enableWorker: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        lowLatencyMode: false,
        backBufferLength: 90,
        // iOS-specific optimizations
        ...(isiOS() && {
          // Force HLS.js instead of native on iOS
          forceKeyFrameOnDiscontinuity: true,
          abrEwmaDefaultEstimate: 500000, // Conservative estimate for mobile
          abrBandWidthFactor: 0.95, // Be more conservative on mobile
          abrBandWidthUpFactor: 0.7,
          maxLoadingDelay: 4,
          maxBufferLength: 20, // Shorter buffer on mobile
          maxMaxBufferLength: 300,
          // Try to prevent iOS from taking over
          debug: false
        })
      }
      
      const h = new Hls(hlsConfig)
      h.attachMedia(v)
      h.loadSource(videoSrc)
      
      // Xử lý sự kiện MANIFEST_PARSED để lấy thông tin độ phân giải
      h.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels)
        onQualityLevelsUpdate?.(data.levels)
        // console.log('Available quality levels:', data.levels)
      })

      h.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setLevel(data.level)
        onQualityChange?.(data.level)
        // console.log('Switched to quality level:', data.level)
      })

      h.on(Hls.Events.ERROR, (_e, data: ErrorData) => {
        if(!data.fatal) return
        if(data.type === Hls.ErrorTypes.MEDIA_ERROR){ 
          h.recoverMediaError()
          return 
        }
        console.error('HLS Fatal Error:', data)
        setFatalErr(true)
        h.destroy()
      })
      hlsRef.current = h
      
      // Notify parent component that HLS is ready
      onHLSReady?.(h, v)
    }
    return ()=>{ hlsRef.current?.destroy(); hlsRef.current=null }
  },[videoSrc, hlsStream, forceHLSJS]) // Add forceHLSJS to deps to reload when toggled

  /* ----------------------------------------------------------------
   * helpers UI
   * --------------------------------------------------------------*/
  const jump = (s:number)=>{ const v=vRef.current; if(!v) return; v.currentTime=Math.min(Math.max(0,v.currentTime+s), dur) }
  const fmt  = (s:number)=>{ const m=Math.floor(s/60), ss=Math.floor(s%60); return `${m}:${ss.toString().padStart(2,'0')}` }

  const togglePlay = ()=>{ const v=vRef.current; if(!v) return; v.paused? v.play(): v.pause() }
  const toggleMute = ()=>{ const v=vRef.current; if(!v) return; v.muted = !v.muted }
  
  // Hàm tính toán độ rộng của buffer đã tải
  const getBuferredWidth = (): number => {
    const v = vRef.current
    if (!v || !dur || dur <= 0) return 0
    
    try {
      if (v.buffered && v.buffered.length > 0) {
        return (v.buffered.end(v.buffered.length - 1) / dur) * 100
      }
    } catch (e) {
      console.error('Lỗi khi tính toán buffer:', e)
    }
    
    return 0
  }

  const setLvl = (idx:number)=>{
    const v = vRef.current as any
    
    // For HLS.js (non-iOS)
    if(hlsRef.current) {
      if(idx===-1){ hlsRef.current.currentLevel = -1; setLevel(-1); return }
      hlsRef.current.currentLevel = idx
      return
    }
    
    // For iOS native HLS - try multiple approaches
    if(isiOS() && v) {
      // Method 1: Try video tracks (rarely works)
      if(v.videoTracks && v.videoTracks.length > 0) {
        const tracks = v.videoTracks
        
        // Disable all tracks first
        for(let i = 0; i < tracks.length; i++) {
          tracks[i].selected = false
        }
        
        if(idx === -1) {
          // Enable all tracks for auto
          for(let i = 0; i < tracks.length; i++) {
            tracks[i].selected = true
          }
        } else if(idx >= 0 && idx < tracks.length) {
          tracks[idx].selected = true
        }
        
        setLevel(idx)
        return
      }
      
      // Method 2: Try reloading video with quality-specific URL
      const currentSrc = v.src
      if(currentSrc && currentSrc.includes('.m3u8')) {
        
        // Store current time to resume
        const currentTime = v.currentTime
        const wasPlaying = !v.paused
        
        // Generate quality-specific URLs (this would need actual implementation based on your video URLs)
        const qualityUrls = {
          '-1': currentSrc, // Auto quality (original)
          '0': currentSrc.replace('.m3u8', '_1080p.m3u8'),
          '1': currentSrc.replace('.m3u8', '_720p.m3u8'), 
          '2': currentSrc.replace('.m3u8', '_480p.m3u8')
        }
        
        const targetUrl = qualityUrls[idx.toString() as keyof typeof qualityUrls] || currentSrc
        
        if(targetUrl !== currentSrc) {
          v.src = targetUrl
          v.load()
          
          // Resume playback at same time
          const handleLoadedMetadata = () => {
            v.currentTime = currentTime
            if(wasPlaying) {
              v.play().catch(console.error)
            }
            v.removeEventListener('loadedmetadata', handleLoadedMetadata)
          }
          
          v.addEventListener('loadedmetadata', handleLoadedMetadata)
        }
        
        setLevel(idx)
        return
      }
      
      // Method 3: Force reload with different approach
      setLevel(idx)
      
      // Trigger a refresh of the video element
      const currentTime = v.currentTime
      const wasPlaying = !v.paused
      
      setTimeout(() => {
        v.load()
        setTimeout(() => {
          v.currentTime = currentTime
          if(wasPlaying) {
            v.play().catch(console.error)
          }
        }, 100)
      }, 100)
      
      return
    }
    
    // Fallback: just update UI state for display purposes
    setLevel(idx)
  }

  const setSpeed = (rate: number) => {
    const v = vRef.current
    if (!v) return
    v.playbackRate = rate
    setPlaybackRate(rate)
  }

  const fullScreen = ()=>{
    const el = cRef.current
    const video = vRef.current as any // Cast to any for iOS webkit methods
    if(!el || !video) return
    
    // For iOS, use video element's webkitEnterFullscreen
    if (isiOS() && video.webkitEnterFullscreen) {
      if (!full) {
        video.webkitEnterFullscreen()
        setFull(true)
      } else {
        video.webkitExitFullscreen && video.webkitExitFullscreen()
        setFull(false)
      }
      return
    }
    
    // For other browsers, use standard fullscreen API
    if(!document.fullscreenElement){ 
      el.requestFullscreen().then(() => setFull(true)).catch(() => {
        // Fallback for iOS Safari
        if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen()
          setFull(true)
        }
      })
    }
    else { 
      document.exitFullscreen().then(() => setFull(false))
    }
  }

  const togglePiP = async () => {
    const v = vRef.current as any
    if (!v) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        // Try standard PiP first
        if (v.requestPictureInPicture) {
          await v.requestPictureInPicture()
          setIsPiP(true)
        } 
        // Fallback for iOS Safari
        else if (v.webkitSetPresentationMode) {
          v.webkitSetPresentationMode('picture-in-picture')
          setIsPiP(true)
        }
      }
    } catch (error) {
      console.error('Error toggling PiP:', error)
      // Try iOS fallback if standard PiP fails
      if (isiOS() && v.webkitSetPresentationMode) {
        try {
          v.webkitSetPresentationMode('picture-in-picture')
          setIsPiP(true)
        } catch (iosError) {
          console.error('iOS PiP also failed:', iosError)
        }
      }
    }
  }

  // Add PiP and Fullscreen event listeners
  useEffect(() => {
    const v = vRef.current as any
    if (!v) return

    const handlePiPChange = () => {
      setIsPiP(document.pictureInPictureElement === v)
    }

    const handleFullscreenChange = () => {
      setFull(!!document.fullscreenElement)
    }

    const handleIOSFullscreenChange = () => {
      if (v.webkitDisplayingFullscreen !== undefined) {
        setFull(v.webkitDisplayingFullscreen)
      }
    }

    // Standard events
    v.addEventListener('enterpictureinpicture', handlePiPChange)
    v.addEventListener('leavepictureinpicture', handlePiPChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // iOS events
    if (v.webkitDisplayingFullscreen !== undefined) {
      v.addEventListener('webkitbeginfullscreen', handleIOSFullscreenChange)
      v.addEventListener('webkitendfullscreen', handleIOSFullscreenChange)
    }

    return () => {
      v.removeEventListener('enterpictureinpicture', handlePiPChange)
      v.removeEventListener('leavepictureinpicture', handlePiPChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      
      if (v.webkitDisplayingFullscreen !== undefined) {
        v.removeEventListener('webkitbeginfullscreen', handleIOSFullscreenChange)
        v.removeEventListener('webkitendfullscreen', handleIOSFullscreenChange)
      }
    }
  }, [])

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when video player is focused or no input is focused
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.contentEditable === 'true'
      )) {
        return
      }

      switch (e.code) {
        case 'Space':
          if (e.cancelable) e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          if (e.cancelable) e.preventDefault()
          jump(-10)
          break
        case 'ArrowRight':
          if (e.cancelable) e.preventDefault()
          jump(10)
          break
        case 'ArrowUp':
          if (e.cancelable) e.preventDefault()
          const v = vRef.current
          if (v) {
            const newVolume = Math.min(1, v.volume + 0.1)
            v.volume = newVolume
          }
          break
        case 'ArrowDown':
          if (e.cancelable) e.preventDefault()
          const video = vRef.current
          if (video) {
            const newVolume = Math.max(0, video.volume - 0.1)
            video.volume = newVolume
          }
          break
        case 'KeyM':
          if (e.cancelable) e.preventDefault()
          toggleMute()
          break
        case 'KeyF':
          if (e.cancelable) e.preventDefault()
          fullScreen()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [togglePlay, jump, toggleMute, fullScreen])

  /* ----------------------------------------------------------------
   * JSX
   * --------------------------------------------------------------*/
  return (
    <div ref={cRef} className="relative w-full bg-black overflow-hidden rounded-lg group
      md:aspect-video 
      aspect-[9/16] sm:aspect-[9/16] 
      max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]"
         onClick={(e) => {
           e.stopPropagation();
         }}
    >
      {/* ----------------- video tag ----------------- */}
      <video
        ref={vRef}
        className="absolute inset-0 w-full h-full object-contain bg-black
          md:object-contain
          object-cover sm:object-cover"
        poster={poster || ''}
        controls={!custom}
        playsInline
        autoPlay={autoPlay}
        preload="auto"
        title={displayTitle}
        onClick={(e) => {
          e.stopPropagation();
          if (custom) {
            togglePlay(); // Simple play/pause for all devices
          }
        }}
      >
        {subtitles.map((t,i)=>(
          <track key={i} src={t.src} label={t.label} kind="subtitles" srcLang={t.lang} default={t.default} />
        ))}
      </video>

      {/* badge & error */}
      {testMode && <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-semibold px-2 py-0.5 rounded">Test</span>}
      {fatalErr && <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-red-400">Không phát được video</div>}

      {/* ----------------- Custom controls ----------------- */}
      {custom && (
        <>
          {/*   CENTER overlay play / pause   */}
          {!playing && !wait && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }} 
              className="absolute inset-0 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <Play className="h-20 w-20 drop-shadow-xl" />
            </button>
          )}

          {/* BUFFER */}
          {wait && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-16 w-16 text-amber-400 animate-spin" />
            </div>
          )}

          {/* bottom bar */}
          <div className={cn(
            "absolute bottom-0 left-0 right-0 px-2 sm:px-4 py-2 sm:py-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 backdrop-blur-sm border-t border-white/10",
            // Mobile: show/hide based on state, Desktop: hover behavior  
            showControlsOnMobile ? "opacity-100" : "opacity-0",
            "sm:opacity-0 sm:group-hover:opacity-100",
            // Force show when dropdown is open
            isDropdownOpen && "!opacity-100"
          )}>
            {/* progress bar container */}
            <div 
              className="relative mb-2 sm:mb-1 h-6 sm:h-4 flex items-center group/progress cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                const newTime = percent * (dur || 0)
                const v = vRef.current
                if (v) v.currentTime = newTime
              }}
            >
              {/* Progress background */}
              <div className="absolute w-full h-3 sm:h-2 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Buffer progress */}
                <div 
                  className="absolute h-full bg-white/20 rounded-full transition-all duration-300" 
                  style={{width: `${getBuferredWidth()}%`}}
                />
                {/* Played progress */}
                <div 
                  className="absolute h-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-full shadow-lg transition-all duration-150" 
                  style={{width: `${(time/(dur||1))*100}%`}}
                />
              </div>
              
              {/* Progress handle (logo con chạy theo) */}
              <div 
                className="absolute h-5 w-5 sm:h-4 sm:w-4 -translate-y-1/2 top-1/2 transition-all duration-150 group-hover/progress:scale-125"
                style={{left: `calc(${(time/(dur||1))*100}% - 10px)`}}
              >
                <div className="relative h-full w-full">
                  {/* Outer glow */}
                  <div className="absolute inset-0 bg-amber-400/60 rounded-full blur-sm animate-pulse" />
                  {/* Main handle */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg border-2 border-white/30" />
                  {/* Inner shine */}
                  <div className="absolute inset-1 bg-gradient-to-tr from-white/40 to-transparent rounded-full" />
                </div>
              </div>
              
              {/* Hover tooltip */}
              <div 
                className="absolute -top-12 sm:-top-10 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none opacity-0 group-hover/progress:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                style={{left: `calc(${(time/(dur||1))*100}% - 20px)`}}
              >
                {fmt(time)}
              </div>
              
              {/* Interactive area - invisible but covers the progress bar */}
              <div className="absolute inset-0 cursor-pointer" />
            </div>

            {/* control row */}
            <div className="flex justify-between items-center mt-1 text-white select-none">
              {/* left cluster */}
              <div className="flex items-center gap-1 sm:gap-3">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200 hover:scale-110" 
                  aria-label="play" 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                >
                  {playing? <Pause className="h-4 w-4 sm:h-6 sm:w-6"/> : <Play className="h-4 w-4 sm:h-6 sm:w-6"/>}
                </Button>
                {/* Skip buttons - hidden on iOS to save space */}
                {!isiOS() && (
                  <>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200 hover:scale-110" 
                      onClick={(e) => {
                        e.stopPropagation();
                        jump(-10);
                      }} 
                      aria-label="-10s"
                    >
                      <SkipBack className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-200 hover:scale-110" 
                      onClick={(e) => {
                        e.stopPropagation();
                        jump(10);
                      }} 
                      aria-label="+10s"
                    >
                      <SkipForward className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </Button>
                  </>
                )}
                
                {/* Volume section - simplified on mobile, full on desktop */}
                <div 
                  className="flex items-center gap-2 group/volume"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:text-blue-400 hover:bg-blue-400/10 transition-all duration-200 hover:scale-110" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                  >
                    {muted||vol===0? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                  </Button>
                  
                  <div className="relative w-24 h-6 hidden sm:group-hover/volume:flex items-center">
                    {/* Volume background */}
                    <div className="absolute w-full h-2 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm">
                      {/* Volume level */}
                      <div 
                        className="absolute h-full bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-500 rounded-full shadow-lg transition-all duration-150" 
                        style={{width: `${(muted ? 0 : vol) * 100}%`}}
                      />
                    </div>
                    
                    {/* Volume handle (logo con chạy theo) */}
                    <div 
                      className="absolute h-3 w-3 -translate-y-1/2 top-1/2 transition-all duration-150 hover:scale-125"
                      style={{left: `calc(${(muted ? 0 : vol) * 100}% - 6px)`}}
                    >
                      <div className="relative h-full w-full">
                        {/* Outer glow */}
                        <div className="absolute inset-0 bg-blue-400/60 rounded-full blur-sm" />
                        {/* Main handle */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full shadow-lg border border-white/30" />
                        {/* Inner shine */}
                        <div className="absolute inset-0.5 bg-gradient-to-tr from-white/40 to-transparent rounded-full" />
                      </div>
                    </div>
                    
                    {/* Volume slider */}
                    <input
                      type="range" min={0} max={1} step={0.01}
                      value={muted?0:vol}
                      onChange={e=>{ 
                        e.stopPropagation();
                        const v=vRef.current; 
                        if(!v) return; 
                        v.volume=parseFloat(e.target.value); 
                        v.muted=Number(e.target.value)===0 
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute w-full h-6 opacity-0 cursor-pointer"
                    />
                    
                    {/* Volume tooltip */}
                    <div 
                      className="absolute -top-8 px-2 py-1 bg-black/80 text-white text-xs rounded pointer-events-none opacity-0 group-hover/volume:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                      style={{left: `calc(${(muted ? 0 : vol) * 100}% - 15px)`}}
                    >
                      {Math.round((muted ? 0 : vol) * 100)}%
                    </div>
                  </div>
                </div>
                
                {/* Time display - smaller on mobile */}
                <span className="text-xs sm:text-sm tabular-nums ml-1 sm:ml-2 hidden sm:inline">{fmt(time)} / {fmt(dur)}</span>
              </div>

              {/* right cluster */}
              <div className="flex items-center gap-1 sm:gap-3">
                {/* Time display for mobile */}
                <span className="text-xs tabular-nums sm:hidden">{fmt(time)}</span>

                {/* Playback Speed - hidden on iOS to save space */}
                {!isiOS() && (
                <DropdownMenu onOpenChange={setIsSpeedDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs flex items-center gap-1 hover:text-amber-400 h-8 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {playbackRate}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="bg-gray-800 border-gray-700 text-white text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <DropdownMenuItem 
                        key={rate} 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSpeed(rate)
                        }} 
                        className={cn('cursor-pointer', playbackRate === rate && 'bg-amber-500/20 text-amber-400')}
                      >
                        {rate}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                )}

                {/* quality - always show on iOS, conditional on others */}
                {(isiOS() || levels.length > 0) && (
                  <DropdownMenu onOpenChange={(open) => setIsQualityDropdownOpen(open)}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs flex items-center gap-1 hover:text-amber-400 h-8 px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs">{level === -1 ? 'Auto' : (levels[level] ? formatQualityLabel(levels[level], level, videoSrc) : 'Auto')}</span>
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="bg-gray-800 border-gray-700 text-white text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          setLvl(-1)
                        }} 
                        className={cn('cursor-pointer', level === -1 && 'bg-amber-500/20 text-amber-400')}
                      >
                        Auto
                      </DropdownMenuItem>
                      {levels.length > 0 ? levels.map((l, i) => (
                        <DropdownMenuItem 
                          key={i} 
                          onClick={(e) => {
                            e.stopPropagation()
                            setLvl(i)
                          }} 
                          className={cn('cursor-pointer', level === i && 'bg-amber-500/20 text-amber-400')}
                        >
                          {formatQualityLabel(l, i, videoSrc)}
                        </DropdownMenuItem>
                      )) : (
                        // Fallback options for iOS when HLS levels not loaded yet
                        <>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              setLvl(0)
                            }}
                            className={cn('cursor-pointer', level === 0 && 'bg-amber-500/20 text-amber-400')}
                          >
                            1080p
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              setLvl(1)
                            }}
                            className={cn('cursor-pointer', level === 1 && 'bg-amber-500/20 text-amber-400')}
                          >
                            720p
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              setLvl(2)
                            }}
                            className={cn('cursor-pointer', level === 2 && 'bg-amber-500/20 text-amber-400')}
                          >
                            480p
                          </DropdownMenuItem>
                          {isiOS() && (
                            <>
                              <div className="px-2 py-1 text-xs text-gray-400 border-t border-gray-600 mt-1">
                                ⚠️ iOS may not support quality switching
                              </div>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setForceHLSJS(!forceHLSJS)
                                  // Reload video to apply change
                                  setTimeout(() => {
                                    const v = vRef.current
                                    if(v) v.load()
                                  }, 100)
                                }}
                                className="cursor-pointer text-xs border-t border-gray-600"
                              >
                                🔧 {forceHLSJS ? 'Use Native Player' : 'Force HLS.js'} (iOS)
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* PiP Button - available on mobile too */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="flex h-8 w-8 sm:h-10 sm:w-10 text-white hover:text-purple-400 hover:bg-purple-400/10 transition-all duration-200 hover:scale-110" 
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePiP()
                  }}
                  disabled={!document.pictureInPictureEnabled && !isiOS()}
                >
                  <PictureInPicture className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                {/* fullscreen */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:text-green-400 hover:bg-green-400/10 transition-all duration-200 hover:scale-110" 
                  onClick={(e) => {
                    e.stopPropagation()
                    fullScreen()
                  }}
                >
                  {full? <Minimize className="h-4 w-4 sm:h-5 sm:w-5"/> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5"/>}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
