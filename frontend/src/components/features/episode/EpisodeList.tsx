"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { generateWatchUrl, generateMovieUrl } from "@/utils/url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  TrendingUp,
  ListFilter,
  Play,
} from "lucide-react";
import { Episode, Movie } from "@/types";
import { getSafePosterUrl } from '@/utils/image';
import MovieEpisodes from './MovieEpisodes';

// Enhanced episode type with additional movie information
export type EnhancedEpisode = Episode & {
  movieTitle: string;
  moviePoster: string;
  thumbnailUrl?: string;
};

export type EnhancedTopEpisode = {
  id: number;
  movieId: number;
  episodeNumber: number;
  views: number;
  movieTitle: string;
  moviePoster: string;
  thumbnailUrl?: string;
};

// Type guards
function isEnhancedEpisode(ep: EnhancedEpisode | EnhancedTopEpisode): ep is EnhancedEpisode {
  return 'title' in ep && 'description' in ep && 'playlistUrl' in ep && 'createdAt' in ep;
}

function isEnhancedTopEpisode(ep: EnhancedEpisode | EnhancedTopEpisode): ep is EnhancedTopEpisode {
  return 'views' in ep && !('title' in ep);
}

interface EpisodeListProps {
  latestEpisodes: EnhancedEpisode[];
  topEpisodes: EnhancedTopEpisode[];
  movies: Movie[];
  isLoading: boolean;
  error: any;
}

export default function EpisodeList({
  latestEpisodes,
  topEpisodes,
  movies,
  isLoading,
  error
}: EpisodeListProps) {
  const [activeTab, setActiveTab] = useState("latest");
  const [displayedMoviesCount, setDisplayedMoviesCount] = useState(2); // Start with only 2 movies

  const handleLoadMoreMovies = () => {
    setDisplayedMoviesCount(prev => Math.min(prev + 2, movies.length)); // Load 2 more at a time
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero */}
      <div className="w-full bg-gray-900 relative pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Tập Mới Cập Nhật
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Khám phá các tập phim mới nhất từ những bộ phim bạn yêu thích. Cập nhật liên tục, không bỏ lỡ nội dung nào.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gray-900 rounded-t-[50%]" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4 relative z-20">
        {/* Filter Bar */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "latest", label: "Mới nhất", icon: Clock },
              { key: "trending", label: "Thịnh hành", icon: TrendingUp },
              { key: "series", label: "Theo bộ phim", icon: ListFilter },
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={activeTab === key ? "default" : "outline"}
                size="sm"
                className={
                  activeTab === key
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-transparent border-gray-600"
                }
                onClick={() => setActiveTab(key)}
              >
                <Icon size={16} className="mr-2" /> {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Latest Episodes */}
        {activeTab === "latest" && (
          <Section
            titleIcon={Clock}
            title="Tập mới cập nhật"
            isLoading={isLoading}
            error={error}
          >
            {latestEpisodes.length > 0 ? (
              <EpisodeGrid episodes={latestEpisodes} />
            ) : !isLoading && !error ? (
              <EmptyState 
                icon={Clock}
                title="Chưa có tập phim mới nào"
                description="Hãy quay lại sau để xem các tập phim mới nhất"
              />
            ) : null}
          </Section>
        )}

        {/* Trending */}
        {activeTab === "trending" && (
          <Section
            titleIcon={TrendingUp}
            title="Tập phim thịnh hành"
            isLoading={isLoading}
            error={error}
          >
            {topEpisodes.length > 0 ? (
              <EpisodeGrid episodes={topEpisodes} showRank />
            ) : !error ? (
              <EmptyState 
                icon={TrendingUp}
                title="Chưa có dữ liệu thịnh hành"
                description="Dữ liệu thống kê đang được cập nhật"
              />
            ) : null}
          </Section>
        )}

        {/* Series */}
        {activeTab === "series" && (
          <SeriesSection 
            movies={movies} 
            isLoading={isLoading} 
            error={error}
            displayedCount={displayedMoviesCount}
            onLoadMore={handleLoadMoreMovies}
            hasMore={displayedMoviesCount < movies.length}
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Helper Components ---------------------------- */

function Section({
  title,
  titleIcon: Icon,
  isLoading,
  error,
  children,
}: {
  title: string;
  titleIcon: React.ElementType;
  isLoading: boolean;
  error: unknown;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <Icon size={20} className="mr-2 text-gray-400" />
        <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>

      {isLoading ? (
        <div>
          <p className="text-gray-400 mb-4">Đang tải {title.toLowerCase()}...</p>
          <SkeletonGrid />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 mb-2">Đã xảy ra lỗi khi tải {title.toLowerCase()}</p>
          <p className="text-red-300 text-sm">{error?.toString()}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
      {Array.from({ length: 20 }).map((_, i) => (
        <Card
          key={i}
          className="bg-gray-800/40 border-gray-700 h-[200px] sm:h-[240px] md:h-[280px] animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
      <p className="text-gray-400 text-lg mb-2">{title}</p>
      <p className="text-gray-500 text-sm">{description}</p>
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        Làm mới trang
      </Button>
    </div>
  );
}

function EpisodeGrid({
  episodes,
  showRank = false,
}: {
  episodes: (EnhancedEpisode | EnhancedTopEpisode)[];
  showRank?: boolean;
}) {
  if (!episodes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">Không có tập phim nào</p>
        <p className="text-gray-500 text-sm mt-2">Thử làm mới trang hoặc kiểm tra lại sau</p>
      </div>
    );
  }

  // Limit trending episodes to 18 (3 rows of 6)
  const displayEpisodes = showRank ? episodes.slice(0, 18) : episodes;

  return (
    <div>
      {/* Mobile: Horizontal scroll (3 per view), Desktop: Grid */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 md:overflow-visible">
        {displayEpisodes.map((ep, idx) => (
          <Link
            key={`${ep.movieId}-${ep.id}`}
            href={generateWatchUrl(
              ep.movieId,
              ep.movieTitle,
              ep.id,
              ep.episodeNumber
            )}
            className="flex-shrink-0 w-[calc(33.333%-8px)] md:w-full"
          >
            <Card className="relative bg-gray-800/40 border-gray-700 hover:border-gray-500 transition-all overflow-hidden h-[200px] sm:h-[240px] md:h-[280px] group">
              {/* Poster */}
              <img
                src={ep.moviePoster || getSafePosterUrl(null, ep.movieId)}
                alt={`Episode ${ep.episodeNumber}`}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

              {/* Content overlay */}
              <div className="relative z-10 h-full flex flex-col justify-end p-2 sm:p-3">
                {showRank && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </div>
                )}
                <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-gray-600 text-white text-[10px] sm:text-xs">
                  Tập {ep.episodeNumber}
                </Badge>
                <h3 className="font-bold text-white text-xs sm:text-sm mb-1 line-clamp-1">
                  {isEnhancedEpisode(ep) ? ep.title : `Tập ${ep.episodeNumber}`}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-300 mb-1 line-clamp-1">
                  {ep.movieTitle}
                </p>
                {/* Meta */}
                <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-gray-400">
                  {isEnhancedTopEpisode(ep) ? (
                    <span className="flex items-center">
                      <TrendingUp size={8} className="mr-1 sm:mr-1" /> 
                      <span className="hidden sm:inline">{ep.views.toLocaleString()}</span>
                      <span className="sm:hidden">{ep.views > 1000 ? `${Math.floor(ep.views/1000)}k` : ep.views}</span>
                    </span>
                  ) : isEnhancedEpisode(ep) ? (
                    <span className="hidden sm:inline">{new Date((ep as EnhancedEpisode).createdAt).toLocaleDateString("vi-VN")}</span>
                  ) : null}
                  {isEnhancedEpisode(ep) && ep.duration ? (
                    <Badge variant="outline" className="bg-gray-700/50 border-gray-600 text-gray-300 text-[8px] sm:text-[10px] px-1 py-0">
                      {Math.floor(ep.duration / 60)}:{String(ep.duration % 60).padStart(2, "0")}
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                  <Play size={16} className="sm:w-5 sm:h-5" fill="white" />
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Scroll indicators for mobile */}
      <div className="flex justify-center mt-2 md:hidden">
        <div className="flex space-x-1">
          {Array.from({ length: Math.ceil(displayEpisodes.length / 3) }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-gray-600 rounded-full"></div>
          ))}
        </div>
      </div>

      {/* Show count info */}
      {displayEpisodes.length > 0 && (
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            {showRank && episodes.length > 18 && (
              <span className="block mt-1 text-gray-600 text-xs">
                (Hiển thị top 18 tập thịnh hành nhất)
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function SeriesSection({
  movies,
  isLoading,
  error,
  displayedCount,
  onLoadMore,
  hasMore
}: {
  movies: Movie[];
  isLoading: boolean;
  error: any;
  displayedCount: number;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for auto-loading when user scrolls near bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px' // Trigger when 200px away from viewport
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (isLoading) return <SkeletonSeries />;
  if (error)
    return (
      <p className="text-center py-10 text-red-400">Không thể tải dữ liệu phim.</p>
    );

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
          <ListFilter size={18} className="mr-2 text-gray-400 sm:w-5 sm:h-5" />
          <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
            Theo bộ phim
          </span>
        </h2>
      </div>

      {movies.slice(0, displayedCount).map((movie) => (
        <div key={movie.id} className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Link href={generateMovieUrl(movie.id, movie.title)}>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent line-clamp-1">
                {movie.title}
              </h3>
            </Link>
            <Link href={generateMovieUrl(movie.id, movie.title)}>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Xem tất cả tập</span>
                <span className="sm:hidden">Xem tất cả</span>
              </Button>
            </Link>
          </div>
          
          {/* MovieEpisodes with lazy loading */}
          <MovieEpisodes
            movieId={movie.id}
            movieTitle={movie.title}
            posterUrl={movie.posterUrl}
          />
          
          <Separator className="bg-gray-800 my-6 sm:my-8" />
        </div>
      ))}

      {/* Auto-load trigger (invisible) */}
      {hasMore && (
        <div ref={loadMoreRef} className="w-full h-4" />
      )}

      {/* Manual Load More Button */}
      {hasMore && (
        <div className="text-center py-6 sm:py-8">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="lg"
            className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white px-6 sm:px-8 text-sm sm:text-base"
          >
            <ListFilter size={14} className="mr-2 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Tải thêm 2 bộ phim ({movies.length - displayedCount} còn lại)</span>
            <span className="sm:hidden">Tải thêm 2 phim ({movies.length - displayedCount})</span>
          </Button>
        </div>
      )}

      {/* All loaded message */}
      {!hasMore && movies.length > 2 && (
        <div className="text-center py-6 sm:py-8">
          <p className="text-gray-500 text-xs sm:text-sm">
            Đã hiển thị tất cả {movies.length} bộ phim
          </p>
        </div>
      )}
    </div>
  );
}

function SkeletonSeries() {
  return (
    <div className="space-y-8 sm:space-y-10">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="mb-6 sm:mb-8">
          <div className="h-5 sm:h-6 bg-gray-700 rounded w-1/3 sm:w-1/4 mb-3 sm:mb-4 animate-pulse" />
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[200px] h-[200px] sm:h-[240px] md:h-[280px] bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
          <Separator className="bg-gray-800 my-6 sm:my-8" />
        </div>
      ))}
    </div>
  );
} 