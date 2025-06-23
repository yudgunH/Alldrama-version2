import React from 'react';
import { Loader2, AlertCircle, PlayCircle } from 'lucide-react';

interface VideoStatusMessageProps {
  sourceType: 'hls' | 'mp4' | 'test' | 'none';
  processingStatus?: 'processing' | 'completed' | 'failed' | 'pending' | 'unknown';
  isLoading?: boolean;
  error?: string;
}

export const VideoStatusMessage: React.FC<VideoStatusMessageProps> = ({
  sourceType,
  processingStatus,
  isLoading = false,
  error
}) => {
  // Chỉ hiển thị processing message khi thực sự không có source nào hoặc có lỗi
  if (sourceType === 'none' || error || (sourceType === 'test' && (processingStatus === 'processing' || processingStatus === 'pending'))) {
    return (
      <div className="absolute inset-0 bg-black/90 flex items-center justify-center text-white">
        <div className="text-center p-6 max-w-md">
          {processingStatus === 'processing' || processingStatus === 'pending' ? (
            <>
              <Loader2 className="h-16 w-16 text-amber-400 animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Video đang được xử lý</h3>
              <p className="text-sm opacity-80 mb-4">
                Video đang được chuyển đổi sang định dạng phù hợp. Vui lòng đợi trong giây lát.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span>Trạng thái: {processingStatus === 'processing' ? 'Đang xử lý' : 'Chờ xử lý'}</span>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                {error ? 'Lỗi phát video' : 'Video chưa sẵn sàng'}
              </h3>
              <p className="text-sm opacity-80 mb-4">
                {error 
                  ? `Không thể phát video: ${error}`
                  : 'Video chưa được upload hoặc đang được xử lý.'
                }
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span>Không có nguồn video khả dụng</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-sm opacity-80">Đang kiểm tra nguồn video...</p>
        </div>
      </div>
    );
  }

  // Success state với indicator nhỏ
  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 text-white text-xs">
        <div className={`h-2 w-2 rounded-full ${
          sourceType === 'hls' ? 'bg-green-500' : 'bg-blue-500'
        }`}></div>
        <span className="capitalize">
          {sourceType === 'hls' ? 'HLS Stream' : 'MP4 Video'}
        </span>
        {processingStatus === 'processing' && sourceType === 'mp4' && (
          <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
            Fallback
          </span>
        )}
      </div>
    </div>
  );
}; 