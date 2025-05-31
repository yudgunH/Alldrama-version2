import React, { MouseEvent } from 'react';
import { Menu, ChevronDown, Search, Grid2X2, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { generateWatchUrl } from '@/utils/url';
import { useRouter } from 'next/navigation';
import { getImageInfo } from '@/utils/image';
import { Skeleton } from '@/components/ui/skeleton';

interface EpisodeSheetProps {
  episodes: any[];
  currentEpisode: any;
  movieId: string;
  movieTitle: string;
  episodeView: 'grid' | 'list';
  setEpisodeView: (view: 'grid' | 'list') => void;
}

export default function MobileEpisodeSheet({ 
  episodes, currentEpisode, movieId, movieTitle, episodeView, setEpisodeView 
}: EpisodeSheetProps) {
  const router = useRouter();
  
  // Navigate to episode using router instead of direct href
  const navigateToEpisode = (e: MouseEvent, episodeId: string, episodeNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    const url = generateWatchUrl(movieId, movieTitle, episodeId, episodeNumber);
    router.push(url);
  };
  
  return (
    <div className="sm:hidden absolute top-4 right-4 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            className="bg-black/60 border-white/20 text-white hover:bg-black/80"
          >
            <Menu size={18} />
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-gray-900/95 backdrop-blur-md border-gray-800 text-white p-0 w-[85vw] sm:max-w-md">
          <SheetHeader className="p-4 border-b border-gray-800">
            <SheetTitle className="text-white flex items-center justify-between">
              <span>Danh sách tập</span>
            </SheetTitle>
          </SheetHeader>
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input 
                placeholder="Tìm tập phim..." 
                className="pl-9 bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {episodes.length} tập phim
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" size="sm"
                className={`px-2 py-1 h-8 ${episodeView === 'grid' ? 'bg-white/20 text-white' : 'text-gray-400'}`}
                onClick={() => setEpisodeView('grid')}
              >
                <Grid2X2 size={16} />
              </Button>
              <Button 
                variant="ghost" size="sm"
                className={`px-2 py-1 h-8 ${episodeView === 'list' ? 'bg-white/20 text-white' : 'text-gray-400'}`}
                onClick={() => setEpisodeView('list')}
              >
                <List size={16} />
              </Button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            {episodeView === 'grid' ? (
              <div className="grid grid-cols-2 gap-2 p-3">
                {episodes.map(ep => {
                  const imageInfo = getImageInfo(ep.thumbnailUrl, movieId, 'thumbnail')
                  
                  return (
                    <a 
                      key={ep.id}
                      href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
                      onClick={(e) => navigateToEpisode(e, ep.id, ep.episodeNumber)}
                      className={`block rounded overflow-hidden ${
                        ep.id === currentEpisode?.id 
                          ? 'ring-2 ring-amber-500' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="aspect-video bg-gray-800 relative">
                        {imageInfo.shouldShowSkeleton ? (
                          <Skeleton className="w-full h-full" />
                        ) : (
                          <img 
                            src={imageInfo.url} 
                            alt={`Tập ${ep.episodeNumber}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('MobileEpisodeSheet - Episode thumbnail load error for URL:', imageInfo.url);
                            }}
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 py-1.5">
                          <span className="text-white text-xs">Tập {ep.episodeNumber}</span>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-200 truncate">
                          {ep.title || `Tập ${ep.episodeNumber}`}
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {episodes.map(ep => (
                  <a 
                    key={ep.id}
                    href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
                    onClick={(e) => navigateToEpisode(e, ep.id, ep.episodeNumber)}
                    className={`flex items-center p-3 ${
                      ep.id === currentEpisode?.id 
                        ? 'bg-white/10 text-amber-400' 
                        : 'hover:bg-white/5 text-white'
                    }`}
                  >
                    <Badge className="mr-3 bg-gray-700">
                      {ep.episodeNumber}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{ep.title || `Tập ${ep.episodeNumber}`}</p>
                      <p className="text-xs text-gray-400">{ep.duration} phút</p>
                    </div>
                    {ep.id === currentEpisode?.id && (
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
