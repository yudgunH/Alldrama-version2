import React, { useState } from 'react'
import VideoPlayer from '@/components/features/movie/VideoPlayer'
import MP4Player from '@/components/features/movie/MP4Player'
import { VideoStatusMessage } from './VideoStatusMessage'
import { useVideoSources } from '../../../hooks/watch/useVideoSources'
import { useVideoTracking } from '../../../hooks/watch/useVideoTracking'
import { useVideoQuality } from '../../../hooks/watch/useVideoQuality'
import { MovieWithSubtitles, EpisodeWithSubtitles } from '../../../hooks/watch/useWatchData'

interface WatchPlayerProps {
  movie: MovieWithSubtitles;
  activeEpisode: EpisodeWithSubtitles | null;
  isSeries: boolean;
  startTime: number;
}

export default function WatchPlayer({ 
  movie, 
  activeEpisode, 
  isSeries, 
  startTime 
}: WatchPlayerProps) {
  const [hlsInstance, setHlsInstance] = useState<any>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)

  // Get video sources - sử dụng thumbnail thay vì poster cho video player
  const { videoSrc, thumbnailSrc, title, subtitles, isHLS, sourceType, processingStatus } = useVideoSources({
    movie,
    activeEpisode,
    isSeries
  });

  const { handleTimeUpdate, handleVideoEnd } = useVideoTracking({
    movie,
    activeEpisode,
    videoElement
  });

  // Initialize video quality hook - chỉ khi có HLS
  useVideoQuality({
    videoElement,
    hlsInstance,
    isHLS: isHLS && sourceType === 'hls'
  });

  // Handle HLS ready callback
  const handleHLSReady = (hls: any, video: HTMLVideoElement) => {
    setHlsInstance(hls)
    setVideoElement(video)
  }

  // Handle MP4 video element ready
  const handleMP4VideoReady = (video: HTMLVideoElement) => {
    setVideoElement(video)
  }

  // Handle quality change with callbacks for VideoPlayer
  const handleQualityLevelsUpdate = (levels: any[]) => {
    // Quality levels are already handled by useVideoQuality hook
  }

  const handleQualityChange = (level: number) => {
    // Quality change is already handled by useVideoQuality hook
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto md:max-w-none md:mx-0">
      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-gray-800 text-white text-xs rounded">
          <div>
            <span className="font-bold">Nguồn:</span> {sourceType} | 
            <span className="font-bold"> Status:</span> {processingStatus} | 
            <span className="font-bold"> URL:</span> {videoSrc ? 'Có' : 'Không'}
          </div>
          {processingStatus === 'processing' && sourceType === 'mp4' && (
            <div className="mt-1 text-yellow-300">⚡ Fallback: Sử dụng MP4 vì HLS đang processing</div>
          )}
        </div>
      )}

      {/* Conditional rendering based on source type */}
      {sourceType === 'mp4' ? (
        <MP4Player
          key={`mp4-player-${movie.id}`}
          src={videoSrc}
          poster={thumbnailSrc}
          title={title}
          autoPlay={false}
          subtitles={subtitles}
          initialTime={startTime}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          onVideoElementReady={handleMP4VideoReady}
        />
      ) : (
        <VideoPlayer
          key={`video-player-${movie.id}`}
          src={videoSrc}
          poster={thumbnailSrc} // Sử dụng thumbnail (episode thumbnail hoặc movie poster)
          title={title}
          autoPlay={false}
          useCustomControls={true} // Always use custom controls
          subtitles={subtitles}
          initialTime={startTime}
          isHLS={isHLS}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnd}
          onHLSReady={handleHLSReady}
          onQualityLevelsUpdate={handleQualityLevelsUpdate}
          onQualityChange={handleQualityChange}
        />
      )}

      {/* Video status message - chỉ hiển thị khi cần thiết */}
      {process.env.NODE_ENV === 'development' && (
      <VideoStatusMessage 
        sourceType={sourceType}
        processingStatus={processingStatus}
        isLoading={!videoSrc && sourceType !== 'none'}
      />
      )}
    </div>
  );
} 