'use client'

import Link from 'next/link';
import Image from 'next/image';
import { Play, Clock } from 'lucide-react';
import { Episode } from '@/types/episode';
import { generateWatchUrl } from '@/utils/url';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisodeId: string;
  movieId: string;
  movieTitle: string;
}

export default function EpisodeList({ episodes, currentEpisodeId, movieId, movieTitle }: EpisodeListProps) {
  // Chuyển đổi thời gian từ phút sang định dạng giờ:phút
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/40 backdrop-blur-sm shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-3 px-2 flex items-center">
        <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-transparent bg-clip-text">Danh sách tập</span>
        <Badge className="ml-2 bg-gray-700 text-gray-300">{episodes.length} tập</Badge>
      </h3>
      
      <ScrollArea className="h-[calc(100vh-250px)] pr-2">
        <div className="space-y-2">
          {episodes.map((episode) => {
            const isCurrentEpisode = String(episode.id) === currentEpisodeId;
            
            return (
              <Link 
                key={episode.id} 
                href={generateWatchUrl(movieId, movieTitle, episode.id, episode.episodeNumber)}
                className={`flex items-center p-2.5 rounded-lg transition-all duration-200 ${
                  isCurrentEpisode 
                    ? 'bg-gradient-to-r from-amber-500/90 to-amber-600/90 shadow-md shadow-amber-500/20' 
                    : 'hover:bg-gray-700/80 hover:shadow-md hover:shadow-gray-900/10'
                }`}
              >
                <div className={`w-14 h-14 relative flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0 ${
                  isCurrentEpisode ? 'bg-amber-700' : 'bg-gray-700'
                }`}>
                  {episode.thumbnailUrl ? (
                    <Image 
                      src={episode.thumbnailUrl} 
                      alt={`Tập ${episode.episodeNumber}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {episode.episodeNumber}
                    </span>
                  )}
                  
                  {isCurrentEpisode && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="h-6 w-6 text-white" fill="white" />
                    </div>
                  )}
                </div>
                
                <div className="ml-3 flex-grow">
                  <div className={`font-medium text-base ${isCurrentEpisode ? 'text-white' : 'text-gray-300'}`}>
                    Tập {episode.episodeNumber}: {episode.title}
                  </div>
                  <div className={`text-sm flex items-center mt-1 ${isCurrentEpisode ? 'text-amber-100' : 'text-gray-400'}`}>
                    <Clock className="h-3.5 w-3.5 mr-1 inline-block" />
                    {formatDuration(episode.duration || 0)}
                    
                    {isCurrentEpisode && (
                      <Badge variant="outline" className="ml-2 py-0 h-5 bg-amber-700/40 text-amber-100 border-amber-600/30">
                        Đang xem
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
} 