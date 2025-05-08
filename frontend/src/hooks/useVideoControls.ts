'use client'

import { useCallback, useEffect, useState } from 'react';

/**
 * Props cho hook useVideoControls
 * 
 * @param videoRef Tham chiếu đến phần tử video HTML
 * @param containerRef Tham chiếu đến container chứa video
 * @param duration Tổng thời lượng video (giây)
 */
interface UseVideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  duration: number;
}

/**
 * Hook quản lý các chức năng điều khiển video mở rộng
 * 
 * Cung cấp chức năng cho phím tắt, chế độ toàn màn hình, và định dạng thời gian
 */
export function useVideoControls({
  videoRef,
  containerRef,
  duration
}: UseVideoControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  /**
   * Định dạng thời gian từ giây sang dạng mm:ss hoặc hh:mm:ss
   * @param seconds Số giây cần định dạng
   * @returns Chuỗi thời gian được định dạng
   */
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  /**
   * Chuyển đổi chế độ toàn màn hình
   */
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Không thể vào chế độ toàn màn hình: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, [containerRef]);
  
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
    
    video.currentTime = Math.min(duration || 0, video.currentTime + 10);
  }, [videoRef, duration]);
  
  /**
   * Theo dõi thay đổi trạng thái toàn màn hình
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  /**
   * Xử lý phím tắt cho video player
   * 
   * Các phím tắt được hỗ trợ:
   * - Space/K: Phát/tạm dừng
   * - J/Mũi tên trái: Lùi 10 giây
   * - L/Mũi tên phải: Tiến 10 giây 
   * - F: Toàn màn hình
   * - M: Tắt/bật âm thanh
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Không xử lý phím tắt khi focus vào các phần tử nhập liệu
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play().catch(e => console.warn('Lỗi phát:', e));
            } else {
              videoRef.current.pause();
            }
          }
          break;
        case 'j':
        case 'arrowleft':
          e.preventDefault();
          skipBackward();
          break;
        case 'l':
        case 'arrowright':
          e.preventDefault();
          skipForward();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
          }
          break;
        default:
          break;
      }
    };

    // Thêm sự kiện phím cho container khi được focus
    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.addEventListener('keydown', handleKeyDown);
      
      // Đảm bảo container có thể nhận focus
      if (!containerElement.hasAttribute('tabindex')) {
        containerElement.setAttribute('tabindex', '0');
      }
    }

    // Thêm sự kiện phím ở cấp document khi ở chế độ toàn màn hình
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Dọn dẹp khi unmount
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('keydown', handleKeyDown);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, skipBackward, skipForward, toggleFullscreen, videoRef, containerRef]);
  
  // Trả về các trạng thái và hàm điều khiển
  return {
    isFullscreen,
    formatTime,
    toggleFullscreen,
    skipBackward,
    skipForward
  };
}

export default useVideoControls; 