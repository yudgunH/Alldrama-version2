'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { createSlug, generateWatchUrl, generateMovieUrl } from '@/utils/url';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, Play, Grid, Clock, Filter,
  Calendar, TrendingUp, ListFilter, Search
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Episode } from '@/types';
import { movieService, episodeService } from '@/lib/api';
import { Movie } from '@/types';
import { statsService, TopEpisode } from '@/lib/api/services/statsService';

// Enhanced episode type with additional movie information
interface EnhancedEpisode extends Episode {
  movieTitle: string;
  moviePoster: string;
}

export default function EpisodeListPage() {
  const [activeTab, setActiveTab] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch movies with episodes
  const { data: movies, error: moviesError } = useSWR(
    'movies-with-episodes',
    async () => {
      const response = await movieService.getMovies({ limit: 20 });
      return response.movies;
    }
  );

  // Fetch top/trending episodes
  const { data: topEpisodes, error: topEpisodesError } = useSWR(
    'top-episodes',
    async () => {
      return statsService.getTopEpisodes(12);
    }
  );

  // Fetch latest episodes - we'll combine data from all series movies
  const { data: enhancedEpisodes, error: episodesError } = useSWR(
    movies ? 'all-episodes' : null, 
    async () => {
      // This will hold all episodes with movie information
      const allEpisodes: EnhancedEpisode[] = [];
      
      // For each movie, fetch its episodes and add movie info
      await Promise.all(
        movies!.map(async (movie) => {
          try {
            const episodes = await episodeService.getEpisodesByMovieId(movie.id);
            
            // Add movie information to each episode
            episodes.forEach(episode => {
              allEpisodes.push({
                ...episode,
                movieTitle: movie.title,
                moviePoster: movie.posterUrl || '/placeholder-poster.jpg'
              });
            });
          } catch (error) {
            console.error(`Error fetching episodes for movie ${movie.id}:`, error);
          }
        })
      );
      
      // Sort by creation date (newest first)
      return allEpisodes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // The filtering happens automatically in the filteredEpisodes computed value
    setTimeout(() => setIsLoading(false), 500);
  };

  // Filter episodes based on search query
  const filteredEpisodes = enhancedEpisodes
    ? enhancedEpisodes.filter(episode => 
        (episode.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (episode.movieTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      )
    : [];

  // Get latest episodes from the filtered list
  const latestEpisodes = filteredEpisodes.slice(0, 16);

  // Show loading state when data is fetching
  const isPageLoading = !enhancedEpisodes && !episodesError;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero Section with curved design */}
      <div className="w-full bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 relative pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Tập Mới Cập Nhật</h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Khám phá các tập phim mới nhất từ những bộ phim bạn yêu thích. Cập nhật liên tục, không bỏ lỡ bất kỳ nội dung nào.
              </p>
            </div>
            
            <form onSubmit={handleSearch} className="flex w-full md:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  type="search"
                  placeholder="Tìm kiếm tập phim..." 
                  className="pl-10 bg-black/20 border-gray-700 text-white focus:border-gray-500 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="ml-2 bg-gray-600 hover:bg-gray-700 text-white">
                Tìm
              </Button>
            </form>
          </div>
        </div>
        
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gray-900 rounded-t-[50%]"></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4 relative z-20">
        {/* Filter Bar */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={activeTab === 'latest' ? "default" : "outline"} 
                size="sm"
                className={activeTab === 'latest' ? "bg-gray-800 hover:bg-gray-700" : "bg-transparent border-gray-600"}
                onClick={() => setActiveTab('latest')}
              >
                <Clock size={16} className="mr-2" /> Mới nhất
              </Button>
              <Button 
                variant={activeTab === 'trending' ? "default" : "outline"} 
                size="sm"
                className={activeTab === 'trending' ? "bg-gray-800 hover:bg-gray-700" : "bg-transparent border-gray-600"}
                onClick={() => setActiveTab('trending')}
              >
                <TrendingUp size={16} className="mr-2" /> Thịnh hành
              </Button>
              <Button 
                variant={activeTab === 'series' ? "default" : "outline"} 
                size="sm"
                className={activeTab === 'series' ? "bg-gray-800 hover:bg-gray-700" : "bg-transparent border-gray-600"}
                onClick={() => setActiveTab('series')}
              >
                <ListFilter size={16} className="mr-2" /> Theo bộ phim
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-300">
                  <Filter size={16} className="mr-2" /> Lọc
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-700">
                  <Calendar size={14} className="mr-2" /> Mới nhất trước
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-700">
                  <Calendar size={14} className="mr-2" /> Cũ nhất trước
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Episodes Grid - Latest Tab */}
        <div className={activeTab === 'latest' ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Clock size={20} className="mr-2 text-gray-400" />
            <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
              Tập mới cập nhật
            </span>
          </h2>
          
          {isPageLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array(8).fill(0).map((_, index) => (
                <Card key={index} className="bg-gray-800/40 border-gray-700 h-full animate-pulse">
                  <div className="aspect-video bg-gray-700"></div>
                  <CardContent className="p-4">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4 mt-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : episodesError ? (
            <div className="text-center py-10">
              <p className="text-red-400">Không thể tải dữ liệu tập phim. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${isLoading ? 'opacity-60' : ''}`}>
              {latestEpisodes.map((episode) => (
                <Link 
                  href={generateWatchUrl(episode.movieId, episode.movieTitle, episode.id, episode.episodeNumber)}
                  key={`${episode.movieId}-${episode.id}`}
                >
                  <Card className="bg-gray-800/40 border-gray-700 hover:border-gray-500 transition-all overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-video">
                      <img 
                        src={episode.moviePoster} 
                        alt={episode.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                        <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-12 w-12 rounded-full">
                          <Play size={24} fill="white" />
                        </Button>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-gray-600 text-white">Tập {episode.episodeNumber}</Badge>
                    </div>
                    <CardContent className="p-4 flex-grow flex flex-col">
                      <h3 className="font-bold text-white mb-1 line-clamp-1">{episode.title}</h3>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-1">{episode.movieTitle}</p>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(episode.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <Badge variant="outline" className="bg-gray-700/50 text-gray-300 border-gray-600">
                          {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Trending episodes tab content */}
        <div className={activeTab === 'trending' ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <TrendingUp size={20} className="mr-2 text-gray-400" />
            <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
              Tập phim thịnh hành
            </span>
          </h2>
          
          {!topEpisodes && !topEpisodesError ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array(8).fill(0).map((_, index) => (
                <Card key={index} className="bg-gray-800/40 border-gray-700 h-full animate-pulse">
                  <div className="aspect-video bg-gray-700"></div>
                  <CardContent className="p-4">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4 mt-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topEpisodesError ? (
            <div className="text-center py-10">
              <p className="text-red-400">Không thể tải dữ liệu tập phim thịnh hành. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {topEpisodes && topEpisodes.map((episode, index) => (
                <Link 
                  href={generateWatchUrl(episode.movieId, episode.movie.title, episode.id, episode.episodeNumber)}
                  key={`${episode.movieId}-${episode.id}`}
                >
                  <Card className="bg-gray-800/40 border-gray-700 hover:border-gray-500 transition-all overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-video">
                      <img 
                        src={episode.movie.posterUrl || '/placeholder-poster.jpg'} 
                        alt={`Episode ${episode.episodeNumber}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                        <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-12 w-12 rounded-full">
                          <Play size={24} fill="white" />
                        </Button>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-gray-600 text-white">Tập {episode.episodeNumber}</Badge>
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-gray-500 to-gray-700 text-white text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                    </div>
                    <CardContent className="p-4 flex-grow flex flex-col">
                      <h3 className="font-bold text-white mb-1 line-clamp-1">Tập {episode.episodeNumber}</h3>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-1">{episode.movie.title}</p>
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400 flex items-center">
                          <TrendingUp size={12} className="mr-1" /> {episode.views.toLocaleString()} lượt xem
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Series tab content */}
        <div className={activeTab === 'series' ? 'block' : 'hidden'}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <ListFilter size={20} className="mr-2 text-gray-400" />
            <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
              Phim bộ
            </span>
          </h2>
          
          {!movies && !moviesError ? (
            <div className="space-y-10">
              {Array(3).fill(0).map((_, index) => (
                <div key={index} className="mb-8">
                  <div className="h-6 bg-gray-700 rounded w-1/4 mb-4 animate-pulse"></div>
                  <div className="flex gap-4 overflow-x-auto">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-[280px] h-[200px] bg-gray-800 rounded animate-pulse"></div>
                    ))}
                  </div>
                  <Separator className="bg-gray-800 my-8" />
                </div>
              ))}
            </div>
          ) : moviesError ? (
            <div className="text-center py-10">
              <p className="text-red-400">Không thể tải dữ liệu phim. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {movies && movies.slice(0, 5).map((movie: Movie) => (
                <div key={movie.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <Link href={generateMovieUrl(movie.id, movie.title)} className="group">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-gray-300 to-gray-100 bg-clip-text text-transparent">
                        {movie.title}
                      </h3>
                    </Link>
                    <Link href={generateMovieUrl(movie.id, movie.title)}>
                      <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white">
                        Xem tất cả tập
                      </Button>
                    </Link>
                  </div>
                  
                  <ScrollArea className="pb-4">
                    <MovieEpisodes movieId={movie.id} movieTitle={movie.title} posterUrl={movie.posterUrl} />
                  </ScrollArea>
                  
                  <Separator className="bg-gray-800 my-8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to fetch and display episodes for a specific movie
function MovieEpisodes({ movieId, movieTitle, posterUrl }: { movieId: number, movieTitle: string, posterUrl?: string }) {
  const { data: episodes, error } = useSWR(
    `movie-episodes-${movieId}`,
    () => episodeService.getEpisodesByMovieId(movieId)
  );

  if (error) return <p className="text-red-400">Không thể tải dữ liệu.</p>;
  if (!episodes) return (
    <div className="flex gap-4">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[280px] h-[200px] bg-gray-800 rounded animate-pulse"></div>
      ))}
    </div>
  );

  return (
    <div className="flex gap-4">
      {episodes.slice(0, 5).map((episode) => (
        <Link 
          href={generateWatchUrl(movieId, movieTitle, episode.id, episode.episodeNumber)}
          key={episode.id}
          className="flex-shrink-0 w-[280px]"
        >
          <Card className="bg-gray-800/40 border-gray-700 hover:border-gray-500 transition-all overflow-hidden h-full">
            <div className="relative aspect-video">
              <img 
                src={posterUrl || '/placeholder-poster.jpg'} 
                alt={episode.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                <Button size="icon" className="bg-gray-600 hover:bg-gray-700 text-white h-12 w-12 rounded-full">
                  <Play size={24} fill="white" />
                </Button>
              </div>
              <Badge className="absolute top-2 right-2 bg-gray-600 text-white">Tập {episode.episodeNumber}</Badge>
            </div>
            <CardContent className="p-4">
              <h4 className="font-medium text-white line-clamp-1">{episode.title}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {Math.floor(episode.duration / 60)}:{(episode.duration % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(episode.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
} 