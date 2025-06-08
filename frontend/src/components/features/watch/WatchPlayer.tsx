import React, { useState } from 'react'
import VideoPlayer from '@/components/features/movie/VideoPlayer'
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

  const { videoSrc, posterSrc, title, subtitles } = useVideoSources({
    movie,
    activeEpisode,
    isSeries
  });

  const { handleTimeUpdate, handleVideoEnd } = useVideoTracking({
    movie,
    activeEpisode
  });

  // Initialize video quality hook - quality management is handled by VideoPlayer's built-in controls
  useVideoQuality({
    videoElement,
    hlsInstance,
    isHLS: true
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
      <VideoPlayer
        key={`${movie.id}-${activeEpisode?.id || 'movie'}`}
        src={videoSrc}
        poster={posterSrc}
        title={title}
        autoPlay={false}
        useCustomControls={true} // Always use custom controls
        useTestVideo={!videoSrc}
        subtitles={subtitles}
        initialTime={startTime}
        isHLS={true}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        onHLSReady={handleHLSReady}
        onQualityLevelsUpdate={handleQualityLevelsUpdate}
        onQualityChange={handleQualityChange}
      />
    </div>
  );
} 