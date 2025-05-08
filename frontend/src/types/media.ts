export interface MediaUploadResponse {
  url: string;
} 

export interface VideoPlayerProps {
  videoUrl?: string;
  src: string;
  title: string;
  poster: string;
  onTimeUpdate: (time: number) => void;
  initialTime: number;
  isHLS: boolean; // Luôn mặc định là HLS từ backend
  useTestVideo?: boolean;
  useCustomControls: boolean; // Cho phép chọn giữa điều khiển tùy chỉnh và điều khiển mặc định
  autoPlay: boolean;
  onEnded?: () => void;
  thumbnailUrl?: string; // URL cho thumbnail preview trên thanh tiến trình
  subtitles?: Array<{
    src: string;
    label: string;
    lang: string;
    default?: boolean;
  }>;
}