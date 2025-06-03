import React from 'react'
import VideoPlayer from '@/components/features/movie/VideoPlayer'
import { useVideoSources } from '../../../hooks/watch/useVideoSources'
import { useVideoTracking } from '../../../hooks/watch/useVideoTracking'
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
  const { videoSrc, posterSrc, title, subtitles } = useVideoSources({
    movie,
    activeEpisode,
    isSeries
  });

  const { handleTimeUpdate, handleVideoEnd } = useVideoTracking({
    movie,
    activeEpisode
  });

  return (
    <div className="relative w-full max-w-3xl mx-auto md:max-w-none md:mx-0">
      <VideoPlayer
        key={`${videoSrc}-${startTime}`}
        src={videoSrc}
        poster={posterSrc}
        title={title}
        autoPlay={false}
        useCustomControls={true}
        useTestVideo={!videoSrc}
        subtitles={subtitles}
        initialTime={startTime}
        isHLS={true}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
      />
    </div>
  );
} 