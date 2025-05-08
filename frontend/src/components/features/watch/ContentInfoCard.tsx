import React from 'react';
import { Star, Share2, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import IconButton from './IconButton';
import { generateWatchUrl } from '@/utils/url';
import { useMobile } from "@/hooks/use-mobile";

interface ContentInfoCardProps {
  movie: any;
  currentEpisode?: any;
  prevEpisode?: any;
  nextEpisode?: any;
  isMovie: boolean;
  episodeListResponse: { episodes: any[] };
  setShowEpisodeList: (show: boolean) => void;
}

export default function ContentInfoCard({
  movie,
  currentEpisode,
  prevEpisode,
  nextEpisode,
  isMovie,
  episodeListResponse,
  setShowEpisodeList
}: ContentInfoCardProps) {
  const isMobile = useMobile(768);
  // Define the common glass background style
  const GLASS_BG = "bg-gradient-to-br from-gray-800/70 to-gray-900/80 border-gray-700/60 backdrop-blur-sm shadow-lg";
  
  return (
    <Card className={`${GLASS_BG} overflow-hidden`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row p-4 gap-4">
          {/* Movie Poster - Hidden on mobile */}
          {!isMobile && (
            <div className="flex-shrink-0 w-full sm:w-[150px]">
              <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-900">
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}
          
          {/* Movie Details */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl md:text-2xl text-white font-bold leading-tight">
                  {movie.title}
                </h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  {movie.releaseYear && (
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      {movie.releaseYear}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    {isMovie ? movie.duration : currentEpisode?.duration} phút
                  </Badge>
                  <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Star className="mr-1 h-3 w-3" /> {movie.rating || "8.5"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <IconButton icon={<Share2 size={18} />} tooltip="Chia sẻ" />
                <IconButton icon={<Bookmark size={18} />} tooltip="Lưu vào danh sách" />
              </div>
            </div>
            
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-200 mb-1">Tóm tắt</h2>
              <p className="text-gray-300 text-sm">{movie.summary || currentEpisode?.description}</p>
            </div>
            
            {/* Episode Navigation (only for TV shows) */}
            {!isMovie && currentEpisode && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-200 mb-1">
                  Tập {currentEpisode.episodeNumber}: {currentEpisode.title}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  {prevEpisode && (
                    <Button 
                      variant="outline" size="sm"
                      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                      asChild
                    >
                      <a href={generateWatchUrl(movie.id, movie.title, prevEpisode.id, prevEpisode.episodeNumber)}>
                        <ChevronLeft size={16} className="mr-1" />
                        Tập trước
                      </a>
                    </Button>
                  )}
                  
                  {nextEpisode && (
                    <Button 
                      variant="outline" size="sm"
                      className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                      asChild
                    >
                      <a href={generateWatchUrl(movie.id, movie.title, nextEpisode.id, nextEpisode.episodeNumber)}>
                        Tập sau
                        <ChevronRight size={16} className="ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div> 
        </div>
        
        {/* Episode Quick Select (only for TV shows) */}
        {!isMovie && episodeListResponse.episodes.length > 0 && (
          <div className="px-4 pb-4">
            <Separator className="my-4 bg-gray-700/50" />
            <h3 className="text-sm font-medium text-gray-200 mb-3">Chọn tập phim</h3>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-full">
              {episodeListResponse.episodes.slice(0, 12).map(ep => (
                <a 
                  key={ep.id}
                  href={generateWatchUrl(movie.id, movie.title, ep.id, ep.episodeNumber)} 
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    ep.id === currentEpisode?.id 
                      ? 'bg-amber-500 text-gray-900' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {ep.episodeNumber}
                </a>
              ))}
              
              {episodeListResponse.episodes.length > 12 && (
                <Button 
                  variant="ghost" size="sm"
                  className="text-white hover:bg-gray-700 px-2"
                  onClick={() => setShowEpisodeList(true)}
                >
                  ...
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
