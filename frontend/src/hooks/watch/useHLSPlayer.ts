'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import type { Level, ErrorData } from 'hls.js';

// Nguồn video mẫu để test
const TEST_HLS_STREAM = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
const TEST_MP4_VIDEO = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

/**
 * Props cho hook useHLSPlayer
 * 
 * @param videoRef Tham chiếu đến phần tử video HTML
 * @param src Nguồn video chính
 * @param videoUrl URL thay thế cho video
 * @param playlistUrl URL playlist của HLS (m3u8)
 * @param poster Ảnh thumbnail khi chưa phát video
 * @param isHLS Xác định xem nguồn có phải dạng HLS không (mặc định: true)
 * @param useTestVideo Sử dụng video test nếu không có nguồn nào được cung cấp
 * @param autoPlay Tự động phát khi khởi tạo
 * @param initialTime Thời điểm bắt đầu (giây)
 * @param onTimeUpdate Callback khi thời gian phát thay đổi
 * @param onError Callback khi có lỗi xảy ra
 */
interface UseHLSPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  src?: string;
  videoUrl?: string;
  playlistUrl?: string;
  poster?: string;
  isHLS?: boolean;
  useTestVideo?: boolean;
  autoPlay?: boolean;
  initialTime?: number;
  onTimeUpdate?: (time: number) => void;
  onError?: (error: ErrorData) => void;
}

/**
 * Kết quả trả về từ hook useHLSPlayer
 * Bao gồm các state và các hàm điều khiển video
 */
interface UseHLSPlayerReturn {
  isPlaying: boolean;              // Trạng thái đang phát hay tạm dừng
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  currentTime: number;             // Thời gian hiện tại (giây)
  duration: number;                // Tổng thời lượng video (giây)
  isBuffering: boolean;            // Đang tải buffer
  isVisibleBuffering: boolean;     // Hiển thị icon buffer
  isTestVideo: boolean;            // Đang sử dụng video test
  isError: boolean;                // Có lỗi xảy ra
  availableQualities: Level[];     // Danh sách chất lượng video có sẵn
  currentQuality: number;          // Chất lượng hiện tại (-1: tự động)
  volume: number;                  // Âm lượng (0-1)
  isMuted: boolean;                // Trạng thái tắt tiếng
  togglePlay: () => void;          // Chuyển đổi trạng thái phát/tạm dừng
  handleTimeUpdate: (time: number) => void; // Xử lý cập nhật thời gian
  handleSeek: (time: number) => void;      // Di chuyển đến vị trí thời gian cụ thể
  skipBackward: () => void;        // Lùi lại 10 giây
  skipForward: () => void;         // Tiến tới 10 giây
  toggleMute: () => void;          // Bật/tắt âm thanh
  handleVolumeChange: (volume: number) => void; // Thay đổi âm lượng
  changeQuality: (level: number) => void;      // Thay đổi chất lượng video
}

/**
 * Hook quản lý trình phát video HLS
 * 
 * Xử lý việc khởi tạo HLS.js, quản lý trạng thái phát, buffer,
 * và cung cấp các hàm điều khiển cơ bản cho video.
 */
function useHLSPlayer({
  videoRef,
  src,
  videoUrl,
  playlistUrl,
  isHLS = true,
  useTestVideo = false,
  autoPlay = false,
  initialTime = 0,
  onTimeUpdate,
  onError
}: UseHLSPlayerProps): UseHLSPlayerReturn {
  // Các biến state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isVisibleBuffering, setIsVisibleBuffering] = useState(false);
  const [isTestVideo, setIsTestVideo] = useState(false);
  const [isError, setIsError] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<Level[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Tham chiếu
  const hlsRef = useRef<Hls | null>(null);
  const bufferingTimerRef = useRef<number | null>(null);
  const BUFFERING_DISPLAY_DELAY = 700; // Đợi 700ms trước khi hiển thị biểu tượng loading

  /**
   * Hàm throttle để giới hạn tần suất gọi callback
   * Đảm bảo một hàm chỉ được gọi tối đa 1 lần trong khoảng thời gian định trước
   */
  function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return function(this: any, ...args: Parameters<T>): void {
      if (!inThrottle) {
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
        func.apply(this, args);
      }
    };
  }

  // Giới hạn tần suất gọi callback onTimeUpdate để tránh quá tải
  const throttledTimeUpdate = useCallback(
    throttle((time: number) => {
      onTimeUpdate?.(time);
    }, 500),
    [onTimeUpdate]
  );

  /**
   * Xử lý hiển thị trạng thái buffering với debounce
   * Chỉ hiển thị biểu tượng loading sau khoảng thời gian delay
   * để tránh nhấp nháy khi buffer ngắn
   */
  const handleBufferingChange = useCallback((isBufferingNow: boolean) => {
    setIsBuffering(isBufferingNow);
    
    // Xóa timer hiện tại nếu có
    if (bufferingTimerRef.current !== null) {
      window.clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = null;
    }
    
    if (isBufferingNow) {
      // Nếu bắt đầu buffering, đợi một lúc trước khi hiển thị
      bufferingTimerRef.current = window.setTimeout(() => {
        setIsVisibleBuffering(true);
        bufferingTimerRef.current = null;
      }, BUFFERING_DISPLAY_DELAY);
    } else {
      // Nếu kết thúc buffering, ẩn ngay lập tức
      setIsVisibleBuffering(false);
    }
  }, []);

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (bufferingTimerRef.current !== null) {
        window.clearTimeout(bufferingTimerRef.current);
      }
    };
  }, []);

  // Khởi tạo các event listener cho video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = initialTime;
    
    // Lắng nghe sự kiện thay đổi thời lượng
    const handleDurationChange = () => {
      setDuration(video.duration);
    };
    
    // Lắng nghe sự kiện cập nhật thời gian
    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      throttledTimeUpdate(time);
    };
    
    // Các sự kiện điều khiển và trạng thái
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => handleBufferingChange(true);
    const handlePlaying = () => handleBufferingChange(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    
    // Đăng ký các sự kiện
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);
    
    // Hủy đăng ký các sự kiện khi unmount
    return () => {
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [initialTime, throttledTimeUpdate, handleBufferingChange]);

  // Thiết lập HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Dọn dẹp instance HLS cũ nếu có
    if (hlsRef.current) {
      console.log("HLS: Đang hủy instance cũ");
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Xác định nguồn video theo thứ tự ưu tiên
    const shouldUseTestVideo = useTestVideo || (!src && !videoUrl && !playlistUrl);
    const videoSrc = shouldUseTestVideo ? 
      TEST_HLS_STREAM : 
      (src || videoUrl || playlistUrl || '');
    
    if (!videoSrc) {
      console.warn("HLS: Không có nguồn video");
      return;
    }
    
    // Cập nhật trạng thái video test
    setIsTestVideo(shouldUseTestVideo);
    
    // Xử lý video không phải HLS
    if (!isHLS && !videoSrc.includes('.m3u8')) {
      console.log("Phát hiện nguồn video không phải HLS, sử dụng phát native");
      video.src = shouldUseTestVideo ? TEST_MP4_VIDEO : videoSrc;
      return;
    }
    
    let hls: Hls | null = null;
    
    // Kiểm tra nếu trình duyệt hỗ trợ HLS mặc định (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log("Trình duyệt hỗ trợ HLS native (Safari), sử dụng phát native");
      video.src = videoSrc;
    } else if (Hls.isSupported()) {
      // Dùng hls.js cho các trình duyệt không hỗ trợ HLS mặc định
      console.log("Sử dụng hls.js để phát HLS");
      hls = new Hls({
        // Cấu hình buffer tối ưu để giảm lag
        maxBufferSize: 0,
        maxBufferLength: 120,
        maxMaxBufferLength: 600,
        
        // Tăng buffer mục tiêu để phát mượt
        highBufferWatchdogPeriod: 3,
        nudgeOffset: 0.3,
        nudgeMaxRetry: 5,
        maxFragLookUpTolerance: 0.25,
        liveSyncDurationCount: 4,
        
        // Tối ưu preload để tránh hiện tượng giật
        initialLiveManifestSize: 4,
        
        // Cấu hình timeout và retry
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        
        // Giảm tần suất tải lại manifest
        manifestLoadingMaxRetryTimeout: 64000,
        levelLoadingMaxRetryTimeout: 64000,
        fragLoadingMaxRetryTimeout: 64000,
        
        // Tối ưu cho live stream
        liveMaxLatencyDurationCount: 10,
        
        // Tối ưu hiệu suất
        backBufferLength: 90,
        enableWorker: true,
        
        // Cải thiện chống khựng video
        maxStarvationDelay: 4,
        
        // Cấu hình ABR (Adaptive Bitrate)
        startLevel: -1, // Auto quality mặc định
        abrEwmaDefaultEstimate: 1000000,
        abrEwmaFastLive: 3.0,
        abrEwmaSlowLive: 9.0,
        abrBandWidthFactor: 0.9,
        abrBandWidthUpFactor: 0.7,
        abrMaxWithRealBitrate: true,
        
        // Tải fragment tiếp theo trước khi cần
        startFragPrefetch: true,
        
        // Tắt chế độ độ trễ thấp
        lowLatencyMode: false,
        
        // Cấu hình nâng cao
        appendErrorMaxRetry: 5,
        testBandwidth: true,
        
        // Cấu hình segmentation
        stretchShortVideoTrack: true,
        maxAudioFramesDrift: 1,
        
        // Cấu hình policy tải manifest
        manifestLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000,
            maxLoadTimeMs: 20000,
            timeoutRetry: {
              maxNumRetry: 2,
              retryDelayMs: 1000,
              maxRetryDelayMs: 8000,
            },
            errorRetry: {
              maxNumRetry: 2,
              retryDelayMs: 1000,
              maxRetryDelayMs: 8000,
            },
          }
        },
        
        // Cấu hình policy tải fragment
        fragLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000, 
            maxLoadTimeMs: 120000,
            timeoutRetry: {
              maxNumRetry: 4,
              retryDelayMs: 1000,
              maxRetryDelayMs: 8000,
            },
            errorRetry: {
              maxNumRetry: 4,
              retryDelayMs: 1000,
              maxRetryDelayMs: 8000,
            },
          }
        },
        
        debug: false
      });
      
      // Gắn media với instance HLS
      hls.attachMedia(video);
      
      // Xử lý khi manifest được phân tích
      let manifestLoaded = false;
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (manifestLoaded) {
          console.log("HLS: Bỏ qua sự kiện manifest parsed trùng lặp");
          return;
        }
        
        manifestLoaded = true;
        console.log("HLS: Đã phân tích manifest, số lượng chất lượng:", data.levels.length);
        
        // Lưu danh sách chất lượng
        setAvailableQualities(data.levels);
        
        // Tự động phát nếu được yêu cầu
        if (autoPlay) {
          video.play().catch(e => console.warn('Auto-play bị giới hạn:', e));
        }
      });
      
      // Tải nguồn video
      hls.loadSource(videoSrc);

      // Theo dõi thay đổi chất lượng
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        console.log(`HLS: Đã chuyển sang chất lượng ${data.level}`);
        setCurrentQuality(data.level);
      });
      
      // Theo dõi fragment được tải
      hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
        if (data.frag.duration > 5) {
          console.log(`HLS: Đã tải fragment lớn (${data.frag.duration.toFixed(2)}s)`);
        }
      });
      
      // Giám sát tình trạng buffer
      hls.on(Hls.Events.FRAG_BUFFERED, (_event, data) => {
        if (!hls) return;
        
        const bufferInfo = hls.mainForwardBufferInfo;
        if (bufferInfo && bufferInfo.len < 10) {
          console.warn(`HLS: Buffer thấp (${bufferInfo.len.toFixed(2)}s), có thể bị giật`);
        }
      });
      
      // Xử lý trạng thái buffer
      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        if (!video || !video.paused || video.ended) return;
        if (!isBuffering && video.readyState < 3 && video.playbackRate > 0) {
          handleBufferingChange(true);
        }
      });
      
      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        if (!video) return;
        if (isBuffering && video.readyState >= 3) {
          handleBufferingChange(false);
        }
      });
      
      // Xử lý lỗi
      hls.on(Hls.Events.ERROR, (_event, data: ErrorData) => {
        console.warn("HLS error:", data.type, data.details, data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Lỗi mạng, đang thử kết nối lại...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Lỗi media, đang thử phục hồi...');
              hls?.recoverMediaError();
              break;
            default:
              console.error('Lỗi nghiêm trọng không thể phục hồi:', data);
              const unrecoverableErrorTypes = [
                Hls.ErrorTypes.KEY_SYSTEM_ERROR,
                Hls.ErrorTypes.MUX_ERROR,
                Hls.ErrorTypes.OTHER_ERROR
              ];
              if (unrecoverableErrorTypes.includes(data.type)) {
                setIsError(true);
                onError?.(data);
              }
              hls?.destroy();
              break;
          }
        }
      });
      
      // Lưu instance HLS vào ref
      hlsRef.current = hls;
    } else {
      console.warn("Trình duyệt không hỗ trợ HLS và không có giải pháp thay thế");
    }
    
    // Dọn dẹp khi unmount hoặc source thay đổi
    return () => {
      if (hlsRef.current) {
        console.log("HLS: Đang dọn dẹp instance HLS");
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, videoUrl, playlistUrl, isHLS, useTestVideo, autoPlay, handleBufferingChange, onError]);

  // Hàm điều khiển video
  
  /**
   * Chuyển đổi trạng thái phát/tạm dừng
   */
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(e => console.warn('Lỗi phát:', e));
    } else {
      video.pause();
    }
  }, [videoRef]);

  /**
   * Cập nhật thời gian phát
   */
  const handleTimeUpdate = useCallback((time: number) => {
    throttledTimeUpdate(time);
  }, [throttledTimeUpdate]);

  /**
   * Di chuyển đến vị trí thời gian cụ thể
   */
  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = time;
  }, [videoRef]);

  /**
   * Lùi lại 10 giây
   */
  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, video.currentTime - 10);
  }, [videoRef]);

  /**
   * Tiến tới 10 giây
   */
  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
  }, [videoRef]);

  /**
   * Bật/tắt âm thanh
   */
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
  }, [videoRef]);

  /**
   * Thay đổi âm lượng
   */
  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = newVolume;
    
    if (newVolume === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
  }, [videoRef]);

  /**
   * Thay đổi chất lượng video
   * @param level Mức chất lượng (-1: tự động)
   */
  const changeQuality = useCallback((level: number) => {
    if (!hlsRef.current) return;
    
    hlsRef.current.currentLevel = level;
    setCurrentQuality(level);
  }, []);

  // Trả về các state và hàm điều khiển
  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    isBuffering,
    isVisibleBuffering,
    isTestVideo,
    isError,
    availableQualities,
    currentQuality,
    volume,
    isMuted,
    togglePlay,
    handleTimeUpdate,
    handleSeek,
    skipBackward,
    skipForward,
    toggleMute,
    handleVolumeChange,
    changeQuality
  };
}

export default useHLSPlayer; 