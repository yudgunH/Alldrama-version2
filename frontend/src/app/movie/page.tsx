'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Movie } from '@/types/movie';
import { Genre } from '@/types/genre';
import MovieGrid from '@/components/features/movie/MovieGrid';
import { Badge } from '@/components/ui/badge';
import { useMoviesInfinite } from '@/hooks/api/useMoviesInfinite';
import { useGenres } from '@/hooks/api/useGenres';
import { useRouter } from 'next/navigation';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ProcessedMovie extends Movie {
  type: 'movie' | 'series';
}

export default function MovieListPage() {
  const router = useRouter();
  const [activeGenre, setActiveGenre] = useState('all');
  const [searchParams, setSearchParams] = useState({
    genre: undefined as number | undefined,
    sort: 'views' as const,
    order: 'DESC' as const,
  });
  
  // Use infinite scroll hook for movies
  const { 
    movies, 
    loading: isLoading, 
    pagination,
    hasMore,
    loadMore,
    isValidating,
    searchMovies,
    cacheStats,
  } = useMoviesInfinite(searchParams, {
    initialPageSize: 15, // Load 15 movies initially
    pageSize: 20, // Load 20 more when scrolling
    preloadCount: 5, // Preload 5 movie details
    enableCache: true,
  });

  // Infinite scroll hook
  const { isFetching, lastElementRef } = useInfiniteScroll(
    loadMore,
    hasMore,
    {
      threshold: 200, // Trigger when 200px from bottom
      enabled: !isLoading && hasMore,
    }
  );

  const { getAllGenres } = useGenres();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // Fetch genres when component mounts - only once
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setGenresLoading(true);
        const genreData = await getAllGenres();
        if (genreData) {
          setGenres(genreData);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setGenresLoading(false);
      }
    };
    
    fetchGenres();
  }, [getAllGenres]);

  // Handle genre change
  const handleGenreChange = useCallback((genre: string) => {
    if (genre === activeGenre) return;
    
    setActiveGenre(genre);
    
    const newParams = {
      genre: genre !== 'all' ? Number(genre) : undefined,
      sort: 'views' as const,
      order: 'DESC' as const,
    };
    
    setSearchParams(newParams);
    searchMovies(newParams);
    
    // Navigate to search page for better UX
    if (genre !== 'all') {
    router.push(`/search?genre=${encodeURIComponent(genre)}`);
    }
  }, [activeGenre, searchMovies, router]);
  
  // Memoize processed movies to avoid unnecessary recalculations
  const allMovies = useMemo(() => {
    if (!movies) return [];
    
    return movies.map(movie => ({
        ...movie,
        type: movie.totalEpisodes > 0 ? 'series' : 'movie'
      })) as ProcessedMovie[];
  }, [movies]);
  
  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  // Load more skeleton component
  const LoadMoreSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Khám phá phim</h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Thư viện phim đa dạng với nhiều thể loại hấp dẫn, cập nhật liên tục những bộ phim mới nhất.
              </p>
              {/* Cache stats for debugging */}
              {process.env.NODE_ENV === 'development' && cacheStats && (
                <div className="mt-2 text-xs text-gray-500">
                  Cache: {cacheStats.movies} movies, {cacheStats.movieDetails} details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="mb-8 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 sticky top-0 z-20">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h3 className="text-white font-medium">Thể loại phim</h3>
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang tải...
                </div>
              )}
            </div>
            
            {/* Genre Tags */}
            <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex flex-nowrap md:flex-wrap gap-2 min-w-max md:min-w-0">
                <Badge 
                  variant={activeGenre === 'all' ? "default" : "outline"}
                  className={`px-4 py-2 rounded-full cursor-pointer text-sm font-normal whitespace-nowrap ${
                    activeGenre === 'all' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                  onClick={() => handleGenreChange('all')}
                >
                  Tất cả
                </Badge>
                
                {genresLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-9 bg-gray-800 rounded-full w-20 animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  genres.map((genre) => (
                    <Badge 
                      key={genre.id}
                      variant={activeGenre === genre.name ? "default" : "outline"}
                      className={`px-4 py-2 rounded-full cursor-pointer text-sm font-normal whitespace-nowrap ${
                        activeGenre === genre.name 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      }`}
                      onClick={() => handleGenreChange(genre.name)}
                    >
                      {genre.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Movie Grid */}
        <div className="grid grid-cols-1 gap-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
          <MovieGrid
                isLoading={false}
            movies={allMovies}
                showPagination={false} // Disable pagination for infinite scroll
            totalPages={pagination?.totalPages || 1}
                currentPage={1}
                onPageChange={() => {}} // Not used with infinite scroll
              />
              
              {/* Infinite scroll trigger element */}
              {hasMore && (
                <div ref={lastElementRef} className="w-full h-10 flex items-center justify-center">
                  {isFetching && <LoadMoreSkeleton />}
                </div>
              )}
              
              {/* End of results message */}
              {!hasMore && allMovies.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Đã hiển thị tất cả {allMovies.length} phim</p>
                </div>
              )}
              
              {/* No results message */}
              {!isLoading && allMovies.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">Không tìm thấy phim nào</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => handleGenreChange('all')}
                  >
                    Xem tất cả phim
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}