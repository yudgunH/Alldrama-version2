"use client";

import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { generateWatchUrl } from "@/utils/url";
import { episodeService } from "@/lib/api";
import { cacheManager } from "@/lib/cache/cacheManager";
import { getSafePosterUrl } from '@/utils/image';

interface MovieEpisodesProps {
  movieId: number;
  movieTitle: string;
  posterUrl?: string;
}

export default function MovieEpisodes({
  movieId,
  movieTitle,
  posterUrl,
}: MovieEpisodesProps) {
  // Use a more specific cache key to avoid conflicts
  const { data: episodes, error } = useSWR(
    `movie-episodes-detail-${movieId}`, 
    async () => {
      // Check cache first
      const cached = cacheManager.getEpisodes(movieId);
      if (cached) {
        console.log(`Using cached episodes for movie ${movieId}:`, cached);
        return cached;
      }
      
      console.log(`Fetching episodes for movie ${movieId} from API`);
      const episodesData = await episodeService.getEpisodesByMovieId(movieId);
      console.log(`Fetched episodes data:`, episodesData);
      
      // Cache the result
      cacheManager.setEpisodes(movieId, episodesData, 10 * 60 * 1000);
      
      return episodesData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
      revalidateIfStale: false
    }
  );

  if (error) return <p className="text-red-400 text-sm">Không thể tải dữ liệu.</p>;
  if (!episodes)
    return (
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[200px] h-[200px] sm:h-[240px] md:h-[280px] bg-gray-800 rounded animate-pulse"
          />
        ))}
      </div>
    );

  console.log('Rendering episodes for movie:', movieId, episodes);

  return (
    <div className="relative">
      {/* Horizontal scrollable container */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {episodes.slice(0, 10).map((ep) => {
          console.log('Rendering episode:', ep);
          return (
            <Link
              key={ep.id}
              href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
              className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[200px] group"
            >
              <div className="relative bg-gray-800/40 hover:bg-gray-700/40 transition-all overflow-hidden h-[200px] sm:h-[240px] md:h-[280px] rounded-lg">
                <img
                  src={ep.thumbnailUrl || posterUrl || getSafePosterUrl(null, movieId)}
                  alt={`Tập ${ep.episodeNumber}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent rounded-lg" />
                <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                  <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-gray-600/80 text-white text-[10px] sm:text-xs backdrop-blur-sm">
                    Tập {ep.episodeNumber}
                  </Badge>
                  {/* Episode title - Always show */}
                  <h4 className="font-medium text-white text-xs sm:text-sm line-clamp-2 mb-1">
                    {ep.title || `Tập ${ep.episodeNumber}`}
                  </h4>
                  {/* Episode metadata */}
                  <div className="flex items-center justify-between mt-1 text-[8px] sm:text-[10px] text-gray-400">
                    <span>
                      {Math.floor(ep.duration / 60)}:{String(ep.duration % 60).padStart(2, "0")}
                    </span>
                    <span className="hidden sm:inline">{new Date(ep.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                  <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                    <Play size={16} className="sm:w-5 sm:h-5" fill="white" />
                  </Button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Scroll indicators for mobile */}
      <div className="flex justify-center mt-2 sm:hidden">
        <div className="flex space-x-1">
          {Array.from({ length: Math.min(episodes.length, 10) }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-600 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Episode count info */}
      {episodes.length > 10 && (
        <div className="mt-2 text-center">
          <p className="text-gray-500 text-xs">
            Hiển thị 10 / {episodes.length} tập
          </p>
        </div>
      )}
    </div>
  );
} 