'use client'

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Props cho hook useVideoProgress
 * 
 * @param videoRef Tham chiếu đến phần tử video HTML
 * @param onProgress Callback được gọi khi có cập nhật tiến trình phát
 * @param progressInterval Khoảng thời gian giữa các lần gọi callback (ms)
 */
interface UseVideoProgressProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  progressInterval?: number;
}

/**
 * Hook quản lý tiến trình phát video
 * 
 * Theo dõi và quản lý trạng thái phát, thời gian, buffer và
 * cung cấp các hàm điều khiển cơ bản cho video player.
 */
const useVideoProgress = ({
  videoRef,
  onProgress,
  progressInterval = 1000,
}: UseVideoProgressProps) => {
  // Các biến state
  const [currentTime, setCurrentTime] = useState(0);      // Thời gian hiện tại (giây)
  const [duration, setDuration] = useState(0);            // Tổng thời lượng video (giây)
  const [isPlaying, setIsPlaying] = useState(false);      // Trạng thái đang phát
  const [isBuffering, setIsBuffering] = useState(false);  // Trạng thái đang buffer
  const [loadedPercentage, setLoadedPercentage] = useState(0); // Phần trăm đã tải
  
  // Lưu thời điểm cập nhật tiến trình cuối cùng
  const lastProgressUpdateTime = useRef(0);
  
  /**
   * Hàm throttle để giới hạn tần suất cập nhật tiến trình
   * Đảm bảo callback chỉ được gọi tối đa 1 lần trong khoảng thời gian định trước
   */
  const throttledProgressUpdate = useCallback((currentTime: number) => {
    const now = Date.now();
    if (now - lastProgressUpdateTime.current >= progressInterval) {
      lastProgressUpdateTime.current = now;
      if (onProgress && duration > 0) {
        onProgress({
          played: currentTime / duration,
          playedSeconds: currentTime,
        });
      }
    }
  }, [onProgress, duration, progressInterval]);

  /**
   * Thiết lập các event listener cho video element
   * Theo dõi các sự kiện như timeupdate, play, pause, buffering
   */
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Xử lý sự kiện cập nhật thời lượng video
    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };

    // Xử lý sự kiện cập nhật thời gian phát
    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      throttledProgressUpdate(videoElement.currentTime);
    };

    // Xử lý sự kiện cập nhật buffer
    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const loaded = (bufferedEnd / videoElement.duration) * 100;
        setLoadedPercentage(loaded);
      }
    };

    // Xử lý trạng thái phát/dừng
    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    // Xử lý trạng thái loading
    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    // Đăng ký các sự kiện
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('progress', handleProgress);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);

    // Dọn dẹp khi unmount
    return () => {
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('progress', handleProgress);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
    };
  }, [videoRef, throttledProgressUpdate]);

  /**
   * Di chuyển đến vị trí thời gian cụ thể
   * @param time Thời gian cần di chuyển đến (giây)
   */
  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [videoRef]);

  /**
   * Chuyển đổi trạng thái phát/tạm dừng
   */
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [videoRef, isPlaying]);

  // Trả về các trạng thái và hàm điều khiển
  return {
    currentTime,       // Thời gian hiện tại (giây)
    duration,          // Tổng thời lượng (giây)
    isPlaying,         // Trạng thái đang phát
    isBuffering,       // Trạng thái đang buffer
    loadedPercentage,  // Phần trăm video đã được tải
    seek,              // Hàm di chuyển đến thời điểm cụ thể
    togglePlay,        // Hàm chuyển đổi trạng thái phát/dừng
  };
};

export default useVideoProgress; 