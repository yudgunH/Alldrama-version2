import React, { MouseEvent } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateWatchUrl } from '@/utils/url';
import { useRouter } from 'next/navigation';

interface DesktopEpisodePanelProps {
  episodes: any[];
  currentEpisode: any;
  movieId: string;
  movieTitle: string;
  showEpisodeList: boolean;
  setShowEpisodeList: (show: boolean) => void;
}

export default function DesktopEpisodePanel({ 
  episodes, currentEpisode, movieId, movieTitle, 
  showEpisodeList, setShowEpisodeList
}: DesktopEpisodePanelProps) {
  const router = useRouter();

  if (!showEpisodeList) return null;
  
  // Prevent event propagation to the video player
  const handlePanelClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  // Navigate to episode using router instead of direct href
  const navigateToEpisode = (e: MouseEvent, episodeId: string, episodeNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    const url = generateWatchUrl(movieId, movieTitle, episodeId, episodeNumber);
    router.push(url);
  };
  
  // Helper function to get episode thumbnail
  const getEpisodeThumbnail = (episode: any) => {
    if (episode.thumbnailUrl && episode.thumbnailUrl.startsWith('http')) {
      return episode.thumbnailUrl;
    }
    
    if (episode.episodeNumber) {
      return `https://media.alldrama.tech/episodes/${movieId}/${episode.episodeNumber}/thumbnail.jpg`;
    }
    
    // Fallback to random image as last resort
    return `https://picsum.photos/seed/${episode.id}/300/200`;
  };
  
  return (
    <div 
      className="absolute right-0 top-0 h-full bg-gray-900/95 backdrop-blur-md border-l border-gray-800 w-[300px] z-40 hidden sm:block"
      onClick={handlePanelClick}
    >
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Danh sách tập</h2>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => setShowEpisodeList(false)}
          >
            <X size={20} />
          </Button>
        </div>
        

        
        <div className="p-3 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Tìm tập phim..." 
              className="pl-9 bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
        
        <Tabs defaultValue="grid" className="flex-1 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {episodes.length} tập phim
            </div>
            <TabsList className="bg-gray-800/50 p-0.5">
              <TabsTrigger value="grid" className="px-2 py-1 data-[state=active]:bg-white/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="10" height="10" x="3" y="3" rx="1" />
                  <rect width="10" height="10" x="14" y="3" rx="1" />
                  <rect width="10" height="10" x="14" y="14" rx="1" />
                  <rect width="10" height="10" x="3" y="14" rx="1" />
                </svg>
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2 py-1 data-[state=active]:bg-white/20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="grid" className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-2">
              {episodes.map(ep => (
                <Card 
                  key={ep.id}
                  className={`overflow-hidden border-0 bg-transparent hover:bg-white/5 transition-colors ${
                    ep.id === currentEpisode.id
                      ? 'ring-1 ring-amber-500'
                      : ''
                  }`}
                >
                  <a 
                    href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
                    onClick={(e) => navigateToEpisode(e, ep.id, ep.episodeNumber)}
                  >
                    <div className="aspect-video bg-gray-800 relative overflow-hidden rounded-t-md">
                      <img 
                        src={getEpisodeThumbnail(ep)}
                        alt={`Tập ${ep.episodeNumber}`}
                        className="w-full h-full object-cover"
                      />
                      {ep.id === currentEpisode.id && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <Badge variant="outline" className="bg-amber-500 text-white border-amber-500">
                            Đang xem
                          </Badge>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 py-1.5">
                        <span className="text-white text-xs font-semibold">Tập {ep.episodeNumber}</span>
                      </div>
                      
                      <div className="absolute top-1 right-1 bg-black/70 rounded text-xs text-white px-1">
                        {ep.duration} phút
                      </div>
                    </div>
                    
                    <div className="p-1.5">
                      <div className="line-clamp-1 text-xs">
                        <span className={ep.id === currentEpisode.id ? "text-amber-400 font-medium" : "text-gray-300"}>
                          {ep.title || `Tập ${ep.episodeNumber}`}
                        </span>
                      </div>
                    </div>
                  </a>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="list" className="mt-0">
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-700/30">
                {episodes.map(ep => (
                  <a 
                    key={ep.id}
                    href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
                    onClick={(e) => navigateToEpisode(e, ep.id, ep.episodeNumber)}
                    className={`flex items-center p-3 ${
                      ep.id === currentEpisode.id
                        ? 'bg-white/10 text-amber-400'
                        : 'hover:bg-white/5 text-white'
                    }`}
                  >
                    <div className="w-[80px] flex-shrink-0 mr-3 relative">
                      <div className="aspect-video rounded overflow-hidden">
                        <img 
                          src={getEpisodeThumbnail(ep)}
                          alt={`Tập ${ep.episodeNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Badge 
                        variant="default"
                        className="absolute -top-2 -right-2 bg-gray-800 text-white h-5 min-w-5 flex items-center justify-center p-0"
                      >
                        {ep.episodeNumber}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ep.title || `Tập ${ep.episodeNumber}`}</p>
                      <p className="text-xs text-gray-400">{ep.duration} phút</p>
                    </div>
                    {ep.id === currentEpisode.id && (
                      <div className="ml-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
