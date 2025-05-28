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
  useCustomControls = true,  // sẽ tắt trên iOS bên dưới
  useTestVideo = false,
  subtitles = []             // [{src,label,lang,default?}]
}: VideoPlayerProps & {subtitles?: {src:string;label:string;lang:string;default?:boolean}[]}) {
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
  const custom = useCustomControls && !isiOS()   // iOS = native control

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
  const [full,    setFull]      = useState(false)
  const [fatalErr,setFatalErr]  = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isPiP, setIsPiP] = useState(false)

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
   * init / destroy HLS.js
   * --------------------------------------------------------------*/
  useEffect(()=>{
    const v = vRef.current
    if(!v || !videoSrc) return
    
    if(v.src === videoSrc && hlsRef.current) return
    
    if(hlsRef.current){ hlsRef.current.destroy(); hlsRef.current=null }

    if(!hlsStream || v.canPlayType('application/vnd.apple.mpegurl')){
      v.src = videoSrc
      return
    }

    if(Hls.isSupported()){
      const h = new Hls({ 
        startLevel:-1, 
        enableWorker:true,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        lowLatencyMode: false,
        backBufferLength: 90
      })
      h.attachMedia(v)
      h.loadSource(videoSrc)
      
      // Xử lý sự kiện MANIFEST_PARSED để lấy thông tin độ phân giải
      h.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels)
        console.log('Available quality levels:', data.levels)
      })

      h.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setLevel(data.level)
        console.log('Switched to quality level:', data.level)
      })

      h.on(Hls.Events.ERROR, (_e, data: ErrorData) => {
        if(!data.fatal) return
        if(data.type === Hls.ErrorTypes.MEDIA_ERROR){ 
          h.recoverMediaError()
          return 
        }
        setFatalErr(true)
        h.destroy()
      })
      hlsRef.current = h
    }
    return ()=>{ hlsRef.current?.destroy(); hlsRef.current=null }
  },[videoSrc, hlsStream])

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
    if(!hlsRef.current) return
    if(idx===-1){ hlsRef.current.currentLevel = -1; setLevel(-1); return }
    hlsRef.current.currentLevel = idx
  }

  const setSpeed = (rate: number) => {
    const v = vRef.current
    if (!v) return
    v.playbackRate = rate
    setPlaybackRate(rate)
  }

  const fullScreen = ()=>{
    const el = cRef.current
    if(!el) return
    if(!document.fullscreenElement){ el.requestFullscreen(); setFull(true) }
    else { document.exitFullscreen(); setFull(false) }
  }

  const togglePiP = async () => {
    const v = vRef.current
    if (!v) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        await v.requestPictureInPicture()
        setIsPiP(true)
      }
    } catch (error) {
      console.error('Error toggling PiP:', error)
    }
  }

  // Add PiP event listeners
  useEffect(() => {
    const v = vRef.current
    if (!v) return

    const handlePiPChange = () => {
      setIsPiP(document.pictureInPictureElement === v)
    }

    v.addEventListener('enterpictureinpicture', handlePiPChange)
    v.addEventListener('leavepictureinpicture', handlePiPChange)

    return () => {
      v.removeEventListener('enterpictureinpicture', handlePiPChange)
      v.removeEventListener('leavepictureinpicture', handlePiPChange)
    }
  }, [])

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
          if (custom) togglePlay();
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
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/85 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* progress bar container */}
            <div 
              className="relative mb-1 h-4 flex items-center group/progress"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress background */}
              <div className="absolute w-full h-1.5 bg-gray-700/70 rounded-full overflow-hidden">
                {/* Buffer progress */}
                <div className="absolute h-full bg-gray-400/30 rounded-full" 
                     style={{width: `${getBuferredWidth()}%`}}>
                </div>
                {/* Played progress */}
                <div className="absolute h-full bg-amber-500 rounded-full" 
                     style={{width: `${(time/(dur||1))*100}%`}}></div>
              </div>
              
              {/* Interactive slider - invisible but covers the progress bar */}
              <input
                type="range"
                className="w-full h-4 absolute opacity-0 cursor-pointer z-10"
                min={0} max={dur||0} step={0.1}
                value={time}
                onClick={(e) => e.stopPropagation()}
                onChange={e=>{
                  e.stopPropagation();
                  const v=vRef.current; 
                  if(v) v.currentTime=parseFloat(e.target.value) 
                }}
              />
              
              {/* Tooltip showing the current time position on hover */}
              <div className="absolute h-3 w-3 rounded-full bg-amber-500 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                   style={{left: `${(time/(dur||1))*100}%`}}>
              </div>
            </div>

            {/* control row */}
            <div className="flex justify-between items-center mt-1 text-white select-none">
              {/* left cluster */}
              <div className="flex items-center gap-3">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:text-amber-400" 
                  aria-label="play" 
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                >
                  {playing? <Pause className="h-6 w-6"/> : <Play className="h-6 w-6"/>}
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:text-amber-400" 
                  onClick={(e) => {
                    e.stopPropagation();
                    jump(-10);
                  }} 
                  aria-label="-10s"
                >
                  <SkipBack className="h-5 w-5"/>
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:text-amber-400" 
                  onClick={(e) => {
                    e.stopPropagation();
                    jump(10);
                  }} 
                  aria-label="+10s"
                >
                  <SkipForward className="h-5 w-5"/>
                </Button>
                {/* volume */}
                <div 
                  className="flex items-center gap-2 group/volume"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:text-amber-400" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                  >
                    {muted||vol===0? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                  </Button>
                  
                  <div className="relative w-20 h-1.5 hidden group-hover/volume:block">
                    {/* Volume background */}
                    <div className="absolute w-full h-full bg-gray-700/70 rounded-full"></div>
                    {/* Volume level */}
                    <div className="absolute h-full bg-amber-500 rounded-full" 
                         style={{width: `${(muted ? 0 : vol) * 100}%`}}></div>
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
                      className="absolute w-full h-5 top-1/2 -translate-y-1/2 opacity-0 cursor-pointer"
                    />
                    {/* Volume handle */}
                    <div className="absolute h-3 w-3 top-1/2 transform -translate-y-1/2 rounded-full bg-amber-500"
                         style={{left: `${(muted ? 0 : vol) * 100}%`}}></div>
                  </div>
                  
                  <span className="text-xs tabular-nums ml-2">{fmt(time)} / {fmt(dur)}</span>
                </div>
              </div>

              {/* right cluster */}
              <div className="flex items-center gap-3">
                {/* Playback Speed */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs flex items-center gap-1 hover:text-amber-400"
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

                {/* quality */}
                {levels.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs flex items-center gap-1 hover:text-amber-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {level === -1 ? 'Auto' : `${levels[level]?.height}p`} <Settings className="h-4 w-4"/>
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
                      {levels.map((l, i) => (
                        <DropdownMenuItem 
                          key={i} 
                          onClick={(e) => {
                            e.stopPropagation()
                            setLvl(i)
                          }} 
                          className={cn('cursor-pointer', level === i && 'bg-amber-500/20 text-amber-400')}
                        >
                          {l.height}p ({Math.round(l.bitrate / 1000)}kbps)
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* PiP Button */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:text-amber-400" 
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePiP()
                  }}
                  disabled={!document.pictureInPictureEnabled}
                >
                  <PictureInPicture className="h-5 w-5" />
                </Button>

                {/* fullscreen */}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:text-amber-400" 
                  onClick={(e) => {
                    e.stopPropagation()
                    fullScreen()
                  }}
                >
                  {full? <Minimize className="h-5 w-5"/> : <Maximize className="h-5 w-5"/>}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
