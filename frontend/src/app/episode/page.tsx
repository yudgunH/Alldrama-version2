"use client";

import { useState, useMemo, useEffect } from "react";
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
import { cacheManager } from "@/lib/cache/cacheManager";
import { useAuth } from "@/hooks/api/useAuth";
import { useFavorites } from "@/hooks/api/useFavorites";

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

// Simple Debug Component
function APIDebugPanel() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPIs = async () => {
    setLoading(true);
    const results: any = {
      movies: null,
      episodes: null,
      topEpisodes: null,
      errors: [],
      cacheStats: null
    };

    try {
      console.log('Testing movie API...');
      const movieResponse = await movieService.getMovies({ limit: 2 });
      results.movies = {
        count: movieResponse.movies.length,
        sample: movieResponse.movies[0] ? {
          id: movieResponse.movies[0].id,
          title: movieResponse.movies[0].title,
          totalEpisodes: movieResponse.movies[0].totalEpisodes
        } : null
      };
      console.log('Movie API success:', results.movies);
    } catch (error) {
      console.error('Movie API error:', error);
      results.errors.push({ api: 'movies', error: error?.toString() });
    }

    try {
      console.log('Testing episode API...');
      // Get first movie to test episodes
      const movieResponse = await movieService.getMovies({ limit: 1 });
      if (movieResponse.movies.length > 0) {
        const movie = movieResponse.movies[0];
        console.log(`Testing episodes for movie: ${movie.id} (${movie.title})`);
        const episodes = await episodeService.getEpisodesByMovieId(movie.id);
        results.episodes = {
          movieId: movie.id,
          movieTitle: movie.title,
          count: episodes.length,
          sample: episodes[0] ? {
            id: episodes[0].id,
            title: episodes[0].title,
            episodeNumber: episodes[0].episodeNumber
          } : null
        };
        console.log('Episode API success:', results.episodes);
      }
    } catch (error) {
      console.error('Episode API error:', error);
      results.errors.push({ api: 'episodes', error: error?.toString() });
    }

    try {
      console.log('Testing top episodes API...');
      const topEpisodes = await statsService.getTopEpisodes(3);
      results.topEpisodes = {
        count: topEpisodes.length,
        sample: topEpisodes[0] ? {
          id: topEpisodes[0].id,
          movieId: topEpisodes[0].movieId,
          episodeNumber: topEpisodes[0].episodeNumber,
          views: topEpisodes[0].views
        } : null
      };
      console.log('Top episodes API success:', results.topEpisodes);
    } catch (error) {
      console.error('Top episodes API error:', error);
      results.errors.push({ api: 'topEpisodes', error: error?.toString() });
    }

    // Get cache stats
    results.cacheStats = cacheManager.getCacheStats();

    setTestResults(results);
    setLoading(false);
  };

  const clearCache = () => {
    cacheManager.clearAllCache();
    setTestResults(null);
    console.log('All cache cleared');
  };

  const clearEpisodeCache = () => {
    cacheManager.clearEpisodeCache();
    // Also clear enhanced episodes cache
    cacheManager.setStats('all-enhanced-episodes', null, 0);
    setTestResults(null);
    console.log('Episode cache cleared');
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-white text-lg mb-2">API Debug Panel</h3>
      <div className="flex gap-2 mb-2">
        <Button onClick={testAPIs} disabled={loading} size="sm">
          {loading ? 'Testing...' : 'Test APIs'}
        </Button>
        <Button onClick={clearCache} variant="outline" size="sm">
          Clear All Cache
        </Button>
        <Button onClick={clearEpisodeCache} variant="outline" size="sm">
          Clear Episode Cache
        </Button>
      </div>
      {testResults && (
        <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function EpisodeListPage() {
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auth and favorites
  const { isAuthenticated } = useAuth();
  const { refreshFavorites } = useFavorites();

  // Auto-refresh favorites when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const lastRefresh = cacheManager.getStats('favorites-last-refresh');
      const now = Date.now();
      
      if (!lastRefresh || now - lastRefresh > 60000) { // Refresh max once per minute
        refreshFavorites();
        cacheManager.setStats('favorites-last-refresh', now, 60000);
      }
    }
  }, [isAuthenticated, refreshFavorites]);

  // Debug logging
  console.log('EpisodePage - Debug Info:', {
    activeTab,
    searchQuery,
    isLoading
  });

  // Fetch movies with episodes - optimized with smaller limit and caching
  const { data: movies, error: moviesError } = useSWR(
    "movies-with-episodes", 
    async () => {
      // Check cache first
      const cached = cacheManager.getMovies('movies-with-episodes');
      if (cached) {
        console.log('EpisodePage - Using cached movies data for episodes page');
        return cached;
      }

      console.log('EpisodePage - Fetching movies data from API for episodes page');
      const response = await movieService.getMovies({ limit: 10 }); // Reduced from 20 to 10
      const movies = response.movies;
      
      console.log('EpisodePage - Movies fetched:', movies?.length || 0);
      
      // Cache the result
      cacheManager.setMovies('movies-with-episodes', movies, 15 * 60 * 1000); // Cache for 15 minutes
      
      return movies;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Debug movies state
  console.log('EpisodePage - Movies state:', {
    movies: movies?.length || 0,
    moviesError,
    hasMovies: !!movies
  });

  // Fetch top/trending episodes - optimized to use existing movie data
  const { data: topEpisodes, error: topEpisodesError } = useSWR(
    movies ? "top-episodes" : null, // Only fetch when movies are loaded
    async () => {
      // Check cache first
      const cached = cacheManager.getStats('top-episodes');
      if (cached) {
        console.log('Using cached top episodes data');
        return cached;
      }

      console.log('Fetching top episodes data from API');
    const episodes = await statsService.getTopEpisodes(12);
      
      // Create a map of movies for faster lookup
      const movieMap = new Map(movies!.map(movie => [movie.id, movie]));
      
      // Enhance top episodes with movie information using cached data
      const enhancedTopEpisodes: EnhancedTopEpisode[] = episodes.map((ep) => {
        const movie = movieMap.get(ep.movieId) || ep.movie;
          return {
            id: ep.id,
            movieId: ep.movieId,
            episodeNumber: ep.episodeNumber,
            views: ep.views,
          movieTitle: movie?.title || 'Unknown Movie',
          moviePoster: movie?.posterUrl || "/placeholder-poster.jpg",
          thumbnailUrl: movie?.posterUrl || "/placeholder-poster.jpg"
          };
      });
      
      // Cache the result
      cacheManager.setStats('top-episodes', enhancedTopEpisodes, 5 * 60 * 1000); // Cache for 5 minutes
      
      return enhancedTopEpisodes;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Fetch latest episodes – optimized to reduce API calls with caching
  const { data: enhancedEpisodes, error: episodesError } = useSWR(
    movies ? "all-episodes" : null,
    async () => {
      console.log('EpisodePage - Starting to fetch episodes for', movies?.length || 0, 'movies');
      
      // Check cache first - use proper cache method instead of stats
      const cacheKey = 'all-enhanced-episodes';
      const cached = cacheManager.getStats(cacheKey);
      if (cached) {
        console.log('EpisodePage - Using cached enhanced episodes data');
        return cached;
      }

      console.log('EpisodePage - Fetching all episodes data from API');
      const all: EnhancedEpisode[] = [];
      
      // Process movies in smaller batches to avoid overwhelming the API
      const batchSize = 2; // Reduced from 3 to 2 for better reliability
      for (let i = 0; i < movies!.length; i += batchSize) {
        const batch = movies!.slice(i, i + batchSize);
        console.log(`EpisodePage - Processing batch ${Math.floor(i/batchSize) + 1}, movies:`, batch.map(m => m.id));
        
      await Promise.all(
          batch.map(async (movie) => {
          try {
              // Always check individual movie episode cache first
              let episodes: Episode[];
              const movieCacheKey = `episodes-${movie.id}`;
              const cachedEpisodes = cacheManager.getEpisodes(movie.id);
              
              if (cachedEpisodes && cachedEpisodes.length > 0) {
                console.log(`EpisodePage - Using cached episodes for movie ${movie.id} (${movie.title}) - ${cachedEpisodes.length} episodes`);
                episodes = cachedEpisodes;
              } else {
                console.log(`EpisodePage - Fetching episodes for movie ${movie.id} (${movie.title})`);
                episodes = await episodeService.getEpisodesByMovieId(movie.id);
                console.log(`EpisodePage - Fetched ${episodes.length} episodes for movie ${movie.id}`);
                
                // Only cache if we got episodes
                if (episodes.length > 0) {
                  cacheManager.setEpisodes(movie.id, episodes, 10 * 60 * 1000); // Cache for 10 minutes
                }
              }
              
              // Only process if we have episodes
              if (episodes.length > 0) {
                // Only take the latest 3 episodes per movie to reduce data load
                const latestEpisodes = episodes
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3); // Reduced from 5 to 3
                  
                console.log(`EpisodePage - Adding ${latestEpisodes.length} latest episodes from movie ${movie.id}`);
                  
                latestEpisodes.forEach((ep) =>
              all.push({
                ...ep,
                movieTitle: movie.title,
                moviePoster: movie.posterUrl || "/placeholder-poster.jpg",
                thumbnailUrl: ep.thumbnailUrl || movie.posterUrl || "/placeholder-poster.jpg"
              })
            );
              } else {
                console.log(`EpisodePage - No episodes found for movie ${movie.id} (${movie.title})`);
              }
          } catch (err) {
              console.error(`EpisodePage - Error fetching episodes for movie ${movie.id} (${movie.title}):`, err);
              // Continue with other movies even if one fails
          }
        })
      );
        
        // Add small delay between batches to avoid overwhelming API
        if (i + batchSize < movies!.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`EpisodePage - Total episodes collected: ${all.length}`);
      
      const sortedEpisodes = all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`EpisodePage - Episodes sorted, final count: ${sortedEpisodes.length}`);
      
      // Cache the enhanced episodes result for 5 minutes
      cacheManager.setStats(cacheKey, sortedEpisodes, 5 * 60 * 1000);
      
      return sortedEpisodes;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      errorRetryCount: 2,
      shouldRetryOnError: (error) => {
        // Only retry on network errors, not 4xx errors
        return !error?.response || error.response.status >= 500;
      }
    }
  );

  // Debug episodes state
  console.log('EpisodePage - Episodes state:', {
    enhancedEpisodes: enhancedEpisodes?.length || 0,
    episodesError,
    hasEpisodes: !!enhancedEpisodes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Memoize filtered episodes to avoid recalculation
  const filteredEpisodes = useMemo(() => {
    if (!enhancedEpisodes) return [];
    return enhancedEpisodes.filter(
      (ep: EnhancedEpisode) =>
      ep.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.movieTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  }, [enhancedEpisodes, searchQuery]);

  const latestEpisodes = useMemo(() => 
    filteredEpisodes.slice(0, 16), 
    [filteredEpisodes]
  );
  
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
        {/* Debug Panel - Only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-4">
            <APIDebugPanel />
            
            {/* Quick Stats */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="text-white text-lg mb-2">Quick Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-gray-400">Movies Loaded</p>
                  <p className="text-white font-bold">{movies?.length || 0}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-gray-400">Episodes Found</p>
                  <p className="text-white font-bold">{enhancedEpisodes?.length || 0}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-gray-400">Top Episodes</p>
                  <p className="text-white font-bold">{topEpisodes?.length || 0}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <p className="text-gray-400">Cache Size</p>
                  <p className="text-white font-bold">{cacheManager.getCacheStats().episodes}</p>
                </div>
              </div>
              
              {/* Error Display */}
              {(moviesError || episodesError || topEpisodesError) && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded">
                  <p className="text-red-400 font-semibold">Errors:</p>
                  {moviesError && <p className="text-red-300 text-sm">Movies: {moviesError.toString()}</p>}
                  {episodesError && <p className="text-red-300 text-sm">Episodes: {episodesError.toString()}</p>}
                  {topEpisodesError && <p className="text-red-300 text-sm">Top Episodes: {topEpisodesError.toString()}</p>}
                </div>
              )}
            </div>
          </div>
        )}

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
            {latestEpisodes.length > 0 ? (
            <EpisodeGrid episodes={latestEpisodes} />
            ) : !isPageLoading && !episodesError ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">Chưa có tập phim mới nào</p>
                <p className="text-gray-500 text-sm">Hãy quay lại sau để xem các tập phim mới nhất</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Làm mới trang
                </Button>
              </div>
            ) : null}
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
            {(topEpisodes && topEpisodes.length > 0) ? (
              <EpisodeGrid episodes={topEpisodes} showRank />
            ) : !topEpisodesError ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">Chưa có dữ liệu thịnh hành</p>
                <p className="text-gray-500 text-sm">Dữ liệu thống kê đang được cập nhật</p>
              </div>
            ) : null}
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
  // Debug logging for section state
  console.log(`Section "${title}" state:`, {
    isLoading,
    hasError: !!error,
    error: error?.toString(),
    hasChildren: !!children
  });

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
  // Debug logging
  console.log('EpisodeGrid - Received episodes:', {
    count: episodes.length,
    sample: episodes[0] ? {
      id: episodes[0].id,
      movieId: episodes[0].movieId,
      episodeNumber: episodes[0].episodeNumber,
      movieTitle: episodes[0].movieTitle,
      hasTitle: 'title' in episodes[0] ? episodes[0].title : 'N/A',
      hasViews: 'views' in episodes[0] ? episodes[0].views : 'N/A'
    } : null
  });

  if (!episodes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-lg">Không có tập phim nào</p>
        <p className="text-gray-500 text-sm mt-2">Thử làm mới trang hoặc kiểm tra lại sau</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{episodes.map((ep, idx) => (
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
              onError={(e) => {
                console.log('Image load error for episode', ep.id, 'using fallback');
                e.currentTarget.src = "/placeholder-poster.jpg";
              }}
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
                {isEnhancedEpisode(ep) ? ep.title : `Tập ${ep.episodeNumber}`}
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
  // Use a more specific cache key to avoid conflicts
  const { data: episodes, error } = useSWR(
    `movie-episodes-detail-${movieId}`, 
    async () => {
      // Check cache first
      const cached = cacheManager.getEpisodes(movieId);
      if (cached) {
        console.log(`Using cached episodes for movie ${movieId}`);
        return cached;
      }
      
      console.log(`Fetching episodes for movie ${movieId} from API`);
      const episodesData = await episodeService.getEpisodesByMovieId(movieId);
      
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
