import React, { useState } from 'react'
import VideoPlayer from '@/components/features/movie/VideoPlayer'
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

  const { videoSrc, posterSrc, title, subtitles, isHLS, sourceType, processingStatus } = useVideoSources({
    movie,
    activeEpisode,
    isSeries
  });

  const { handleTimeUpdate, handleVideoEnd } = useVideoTracking({
    movie,
    activeEpisode
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

  // Handle quality change with callbacks for VideoPlayer
  const handleQualityLevelsUpdate = (levels: any[]) => {
    // Quality levels are already handled by useVideoQuality hook
  }

  const handleQualityChange = (level: number) => {
    // Quality change is already handled by useVideoQuality hook
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto md:max-w-none md:mx-0">
      {/* Hiển thị thông tin nguồn video để debug */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 p-2 bg-gray-800 text-white text-xs rounded">
          Nguồn: {sourceType} | HLS: {isHLS ? 'Có' : 'Không'} | Status: {processingStatus} | URL: {videoSrc}
        </div>
      )}

      <VideoPlayer
        key={`${movie.id}-${activeEpisode?.id || 'movie'}-${sourceType}`}
        src={videoSrc}
        poster={posterSrc}
        title={title}
        autoPlay={false}
        useCustomControls={true} // Always use custom controls
        useTestVideo={!videoSrc || sourceType === 'none'}
        subtitles={subtitles}
        initialTime={startTime}
        isHLS={isHLS}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        onHLSReady={handleHLSReady}
        onQualityLevelsUpdate={handleQualityLevelsUpdate}
        onQualityChange={handleQualityChange}
      />

      {/* Video status message */}
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