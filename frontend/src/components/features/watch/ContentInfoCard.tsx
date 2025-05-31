import React, { useState, useEffect, MouseEvent } from 'react';
import { Star, Share2, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { generateWatchUrl } from '@/utils/url';
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from '@/hooks/api/useAuth';
import { useFavorites } from '@/hooks/api/useFavorites';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// IconButton component merged into this file
interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
}

function IconButton({ icon, tooltip, onClick }: IconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white"
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ContentInfoCardProps {
  movie: any;
  currentEpisode?: any;
  prevEpisode?: any;
  nextEpisode?: any;
  isMovie: boolean;
  episodeListResponse: { episodes: any[] };
}

export default function ContentInfoCard({
  movie,
  currentEpisode,
  prevEpisode,
  nextEpisode,
  isMovie,
  episodeListResponse
}: ContentInfoCardProps) {
  const isMobile = useMobile(768);
  const { isAuthenticated } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [favoriteChecked, setFavoriteChecked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const router = useRouter();

  // Only check favorite status when user interacts with the bookmark button
  const handleBookmarkClick = async () => {
    if (!isAuthenticated || !movie) return;
    
    if (!favoriteChecked) {
      // Use store-based check first
      const status = isFavorite(movie.id);
      setIsFavorited(status);
        setFavoriteChecked(true);
    } else {
      try {
        const newStatus = await toggleFavorite(movie.id);
        setIsFavorited(newStatus === true);
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    }
  };
  
  // Navigate to episode using router instead of direct href
  const navigateToEpisode = (e: MouseEvent, episodeId: string, episodeNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    const url = generateWatchUrl(movie.id, movie.title, episodeId, episodeNumber);
    router.push(url);
  };
  
  // Define the common glass background style
  const GLASS_BG = "bg-gradient-to-br from-gray-800/70 to-gray-900/80 border-gray-700/60 backdrop-blur-sm shadow-lg";
  
  // Helper function to get proper image URL
  const getImageUrl = (url?: string, movieId?: number | string) => {
    if (!url) return '/placeholder.svg';
    
    // If it's already a complete URL, use it directly
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's a relative path or just a filename, construct the full URL
    if (url.startsWith('/')) {
      return `https://media.alldrama.tech${url}`;
    }
    
    // If we have a movie ID and it seems like just a filename
    if (movieId) {
      return `https://media.alldrama.tech/movies/${movieId}/poster.png`;
    }
    
    // Fallback to original URL
    return url;
  };
  
  return (
    <Card className={`${GLASS_BG} overflow-hidden`}>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row p-4 gap-4">
          {/* Movie Poster - Hidden on mobile */}
          {!isMobile && (
            <div className="flex-shrink-0 w-full sm:w-[150px]">
              <div className="aspect-[2/3] rounded-md overflow-hidden bg-gray-900 relative">
                <Image 
                  src={getImageUrl(movie.posterUrl, movie.id)} 
                  alt={movie.title} 
                  fill
                  sizes="(max-width: 768px) 100vw, 150px"
                  className="object-cover"
                  priority={true}
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
                {isAuthenticated ? (
                  <IconButton 
                    icon={favoriteChecked && isFavorited ? <BookmarkCheck size={18} /> : <Bookmark size={18} />} 
                    tooltip={favoriteChecked && isFavorited ? "Đã lưu" : "Lưu vào danh sách"}
                    onClick={handleBookmarkClick}
                  />
                ) : (
                  <IconButton icon={<Bookmark size={18} />} tooltip="Lưu vào danh sách" />
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-200 mb-1">Tóm tắt</h2>
              <p className="text-gray-300 text-sm">{movie.summary || currentEpisode?.description}</p>
            </div>
            
            {/* Episode Navigation (only for TV shows) */}
            {!isMovie && currentEpisode && (
              <div className="mt-4">
                <div className="flex flex-row items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-200 flex-shrink-0">
                    Tập {currentEpisode.episodeNumber}:
                  </h3>
                  <p className="text-sm text-gray-300 flex-1 truncate">
                    {currentEpisode.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {prevEpisode && (
                      <Button 
                        variant="outline" size="sm"
                        className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                        onClick={(e) => navigateToEpisode(e, prevEpisode.id, prevEpisode.episodeNumber)}
                      >
                        <ChevronLeft size={16} className="mr-1" />
                        Tập trước
                      </Button>
                    )}
                    
                    {nextEpisode && (
                      <Button 
                        variant="outline" size="sm"
                        className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                        onClick={(e) => navigateToEpisode(e, nextEpisode.id, nextEpisode.episodeNumber)}
                      >
                        Tập sau
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    )}
                  </div>
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
              {episodeListResponse.episodes.map(ep => (
                <a 
                  key={ep.id}
                  href={generateWatchUrl(movie.id, movie.title, ep.id, ep.episodeNumber)} 
                  onClick={(e) => navigateToEpisode(e, ep.id, ep.episodeNumber)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    ep.id === currentEpisode?.id 
                      ? 'bg-amber-500 text-gray-900' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {ep.episodeNumber}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
