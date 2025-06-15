"use client";

import Link from "next/link";
import useSWR from "swr";
import { useState, useRef, useEffect } from "react";
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
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!hasBeenVisible) {
            setHasBeenVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px' // Load when element is 100px away from viewport
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasBeenVisible]);

  // Only fetch when component has been visible at least once
  const { data: episodes, error } = useSWR(
    hasBeenVisible ? `movie-episodes-detail-${movieId}` : null, 
    async () => {
      // Check cache first
      const cached = cacheManager.getEpisodes(movieId);
      if (cached && cached.length > 0) {
        // console.log(`Using cached episodes for movie ${movieId}:`, cached.length, 'episodes');
        return cached;
      }
      
      // console.log(`Fetching episodes for movie ${movieId} from API`);
      try {
        const episodesData = await episodeService.getEpisodesByMovieId(movieId);
        // console.log(`Fetched ${episodesData?.length || 0} episodes for movie ${movieId}`);
        
        // Cache the result for 30 minutes
        if (episodesData && episodesData.length > 0) {
          cacheManager.setEpisodes(movieId, episodesData, 30 * 60 * 1000);
        }
        
        return episodesData || [];
      } catch (error) {
        // console.error(`Error fetching episodes for movie ${movieId}:`, error);
        return [];
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30 * 60 * 1000, // Cache for 30 minutes
      revalidateIfStale: false,
      shouldRetryOnError: false
    }
  );

  // Show placeholder if not visible yet or still loading
  if (!hasBeenVisible) {
    return (
      <div ref={elementRef} className="relative">
        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[calc(33.333%-8px)] md:w-full h-[200px] sm:h-[240px] md:h-[280px] bg-gray-800/40 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="mt-2 text-center">
          <p className="text-gray-500 text-xs">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400 text-sm">Không thể tải dữ liệu tập phim</p>
        <p className="text-gray-500 text-xs mt-1">Vui lòng thử lại sau</p>
      </div>
    );
  }

  if (!episodes || episodes.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400 text-sm">Chưa có tập phim nào</p>
        <p className="text-gray-500 text-xs mt-1">Hãy quay lại sau</p>
      </div>
    );
  }


  // Display max 6 episodes per movie
  const displayEpisodes = episodes.slice(0, 6);

  return (
    <div ref={elementRef} className="relative">
      {/* Mobile: Horizontal scroll (3 per view), Desktop: Grid layout */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 md:overflow-visible">
        {displayEpisodes.map((ep) => {
          return (
            <Link
              key={ep.id}
              href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
              className="group flex-shrink-0 w-[calc(33.333%-8px)] md:w-full"
            >
              <div className="relative bg-gray-800/40 hover:bg-gray-700/40 transition-all overflow-hidden h-[200px] sm:h-[240px] md:h-[280px] rounded-lg">
                <img
                  src={posterUrl || getSafePosterUrl(null, movieId)}
                  alt={`Tập ${ep.episodeNumber}`}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
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
      <div className="flex justify-center mt-2 md:hidden">
        <div className="flex space-x-1">
          {Array.from({ length: Math.ceil(displayEpisodes.length / 3) }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-600 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Episode count info */}
      <div className="mt-2 text-center">
        <p className="text-gray-500 text-xs">
          Hiển thị {displayEpisodes.length} {episodes.length > 6 ? `/ ${episodes.length}` : ''} tập
          {episodes.length > 6 && (
            <span className="block mt-1 text-gray-600 text-xs">
              (Xem tất cả tập để xem thêm)
            </span>
          )}
        </p>
      </div>
    </div>
  );
} 