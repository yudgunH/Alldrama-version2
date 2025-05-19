"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { generateWatchUrl, generateMovieUrl } from "@/utils/url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  Filter,
  TrendingUp,
  ListFilter,
  Search,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Episode } from "@/types";
import { movieService, episodeService } from "@/lib/api";
import { Movie } from "@/types";
import { statsService, TopEpisode } from "@/lib/api/services/statsService";

// Enhanced episode type with additional movie information
type EnhancedEpisode = Episode & {
  movieTitle: string;
  moviePoster: string;
  thumbnailUrl?: string;
};

type EnhancedTopEpisode = {
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

export default function EpisodeListPage() {
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch movies with episodes
  const { data: movies, error: moviesError } = useSWR("movies-with-episodes", async () => {
    const response = await movieService.getMovies({ limit: 20 });
    return response.movies;
  });

  // Fetch top/trending episodes
  const { data: topEpisodes, error: topEpisodesError } = useSWR("top-episodes", async () => {
    const episodes = await statsService.getTopEpisodes(12);
    // Enhance top episodes with movie information
    const enhancedTopEpisodes: EnhancedTopEpisode[] = await Promise.all(
      episodes.map(async (ep) => {
        try {
          const movie = await movieService.getMovieById(ep.movieId);
          return {
            id: ep.id,
            movieId: ep.movieId,
            episodeNumber: ep.episodeNumber,
            views: ep.views,
            movieTitle: movie.title,
            moviePoster: movie.posterUrl || "/placeholder-poster.jpg",
            thumbnailUrl: movie.posterUrl || "/placeholder-poster.jpg"
          };
        } catch (err) {
          console.error(`Error fetching movie info for episode ${ep.id}:`, err);
          return {
            id: ep.id,
            movieId: ep.movieId,
            episodeNumber: ep.episodeNumber,
            views: ep.views,
            movieTitle: ep.movie.title,
            moviePoster: ep.movie.posterUrl || "/placeholder-poster.jpg",
            thumbnailUrl: ep.movie.posterUrl || "/placeholder-poster.jpg"
          };
        }
      })
    );
    return enhancedTopEpisodes;
  });

  // Fetch latest episodes – combine across movies
  const { data: enhancedEpisodes, error: episodesError } = useSWR(
    movies ? "all-episodes" : null,
    async () => {
      const all: EnhancedEpisode[] = [];
      await Promise.all(
        movies!.map(async (movie) => {
          try {
            const episodes = await episodeService.getEpisodesByMovieId(movie.id);
            episodes.forEach((ep) =>
              all.push({
                ...ep,
                movieTitle: movie.title,
                moviePoster: movie.posterUrl || "/placeholder-poster.jpg",
                thumbnailUrl: ep.thumbnailUrl || movie.posterUrl || "/placeholder-poster.jpg"
              })
            );
          } catch (err) {
            console.error(`Error fetching episodes for movie ${movie.id}`, err);
          }
        })
      );
      return all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const filteredEpisodes = enhancedEpisodes?.filter(
    (ep) =>
      ep.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const latestEpisodes = (filteredEpisodes ?? []).slice(0, 16);
  const isPageLoading = !enhancedEpisodes && !episodesError;

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
            isLoading={isPageLoading}
            error={episodesError}
          >
            <EpisodeGrid episodes={latestEpisodes} />
          </Section>
        )}

        {/* Trending */}
        {activeTab === "trending" && (
          <Section
            titleIcon={TrendingUp}
            title="Tập phim thịnh hành"
            isLoading={!topEpisodes && !topEpisodesError}
            error={topEpisodesError}
          >
            <EpisodeGrid episodes={topEpisodes ?? []} showRank />
          </Section>
        )}

        {/* Series */}
        {activeTab === "series" && (
          <SeriesSection movies={movies} moviesError={moviesError} />
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
        <SkeletonGrid />
      ) : error ? (
        <p className="text-center py-10 text-red-400">Đã xảy ra lỗi, vui lòng thử lại.</p>
      ) : (
        children
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card
          key={i}
          className="bg-gray-800/40 border-gray-700 h-[280px] animate-pulse"
        />
      ))}
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
  if (!episodes.length) return <p className="text-gray-400">Không có dữ liệu.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {episodes.map((ep, idx) => (
        <Link
          key={`${ep.movieId}-${ep.id}`}
          href={generateWatchUrl(
            ep.movieId,
            ep.movieTitle,
            ep.id,
            ep.episodeNumber
          )}
        >
          <Card className="relative bg-gray-800/40 border-gray-700 hover:border-gray-500 transition-all overflow-hidden h-[280px] group">
            {/* Poster */}
            <img
              src={ep.thumbnailUrl || ep.moviePoster || "/placeholder-poster.jpg"}
              alt={`Episode ${ep.episodeNumber}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

            {/* Content overlay */}
            <div className="relative z-10 h-full flex flex-col justify-end p-3">
              {showRank && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  #{idx + 1}
                </div>
              )}
              <Badge className="absolute top-2 right-2 bg-gray-600 text-white text-xs">
                Tập {ep.episodeNumber}
              </Badge>
              <h3 className="font-bold text-white text-sm mb-1 line-clamp-1">
                {`Tập ${ep.episodeNumber}`}
              </h3>
              <p className="text-xs text-gray-300 mb-1 line-clamp-1">
                {ep.movieTitle}
              </p>
              {/* Meta */}
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                {isEnhancedTopEpisode(ep) ? (
                  <span className="flex items-center">
                    <TrendingUp size={10} className="mr-1" /> {ep.views.toLocaleString()} lượt xem
                  </span>
                ) : isEnhancedEpisode(ep) ? (
                  <span>{new Date((ep as EnhancedEpisode).createdAt).toLocaleDateString("vi-VN")}</span>
                ) : null}
                {isEnhancedEpisode(ep) && ep.duration ? (
                  <Badge variant="outline" className="bg-gray-700/50 border-gray-600 text-gray-300 text-[10px]">
                    {Math.floor(ep.duration / 60)}:{String(ep.duration % 60).padStart(2, "0")}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-10 w-10 rounded-full">
                <Play size={20} fill="white" />
              </Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function SeriesSection({
  movies,
  moviesError,
}: {
  movies?: Movie[];
  moviesError: unknown;
}) {
  if (!movies && !moviesError) return <SkeletonSeries />;
  if (moviesError)
    return (
      <p className="text-center py-10 text-red-400">Không thể tải dữ liệu phim.</p>
    );

  return (
    <div className="space-y-10">
      {movies!.slice(0, 5).map((movie) => (
        <div key={movie.id} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href={generateMovieUrl(movie.id, movie.title)}>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                {movie.title}
              </h3>
            </Link>
            <Link href={generateMovieUrl(movie.id, movie.title)}>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
              >
                Xem tất cả tập
              </Button>
            </Link>
          </div>
          <ScrollArea className="pb-4">
            <MovieEpisodes
              movieId={movie.id}
              movieTitle={movie.title}
              posterUrl={movie.posterUrl}
            />
          </ScrollArea>
          <Separator className="bg-gray-800 my-8" />
        </div>
      ))}
    </div>
  );
}

function SkeletonSeries() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="mb-8">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4 animate-pulse" />
          <div className="flex gap-4 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[200px] h-[280px] bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
          <Separator className="bg-gray-800 my-8" />
        </div>
      ))}
    </div>
  );
}

function MovieEpisodes({
  movieId,
  movieTitle,
  posterUrl,
}: {
  movieId: number;
  movieTitle: string;
  posterUrl?: string;
}) {
  const { data: episodes, error } = useSWR(`movie-episodes-${movieId}`, () =>
    episodeService.getEpisodesByMovieId(movieId)
  );

  if (error) return <p className="text-red-400">Không thể tải dữ liệu.</p>;
  if (!episodes)
    return (
      <div className="flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[200px] h-[280px] bg-gray-800 rounded animate-pulse"
          />
        ))}
      </div>
    );

  return (
    <div className="flex gap-4">
      {episodes.slice(0, 5).map((ep) => (
        <Link
          key={ep.id}
          href={generateWatchUrl(movieId, movieTitle, ep.id, ep.episodeNumber)}
          className="flex-shrink-0 w-[200px]"
        >
          <Card className="relative bg-gray-800/40 border-gray-700 hover:border-gray-500 transition-all overflow-hidden h-[280px] group">
            <img
              src={ep.thumbnailUrl || posterUrl || "/placeholder-poster.jpg"}
              alt={ep.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-end p-3">
              <Badge className="absolute top-2 right-2 bg-gray-600 text-white text-xs">
                Tập {ep.episodeNumber}
              </Badge>
              <h4 className="font-medium text-white text-sm line-clamp-1">
                {ep.title}
              </h4>
              <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                <span>
                  {Math.floor(ep.duration / 60)}:{String(ep.duration % 60).padStart(2, "0")}
                </span>
                <span>{new Date(ep.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-10 w-10 rounded-full">
                <Play size={20} fill="white" />
              </Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
