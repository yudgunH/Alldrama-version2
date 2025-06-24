'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Movie } from '@/types/movie';
import { Genre } from '@/types/genre';
import MovieGrid from '@/components/features/movie/MovieGrid';
import { Badge } from '@/components/ui/badge';
import { useGenres } from '@/hooks/api/useGenres';
import { useRouter } from 'next/navigation';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useMoviesInfinite } from '@/hooks/useMoviesInfinite';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cacheManager } from '@/lib/cache/cacheManager';

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
  
  // Check cache first before using infinite scroll
  const [cachedMovies, setCachedMovies] = useState<Movie[]>([]);
  const [showingCachedResults, setShowingCachedResults] = useState(false);
  const [nextPageToLoad, setNextPageToLoad] = useState(1); // Track next page to load from server
  const [loadingMore, setLoadingMore] = useState(false); // Track loading state for load more button
  const [hasMoreToLoad, setHasMoreToLoad] = useState(true); // Track if there are more movies to load
  
  // Use infinite scroll hook for movies
  const {
    movies,
    loading: isLoading,
    pagination,
    hasMore,
    loadMore,
    isValidating,
    searchMovies,
    refreshFromServer
  } = useMoviesInfinite(searchParams, {
    initialPageSize: 15,
    pageSize: 20,
    preloadCount: 5,
    enableCache: true,
    preserveDataOnSearch: true
  });

  // Infinite scroll hook
  const { isFetching, lastElementRef } = useInfiniteScroll(
    loadMore,
    hasMore,
    {
      threshold: 200, // Trigger when 200px from bottom
      enabled: !isLoading && hasMore && !showingCachedResults,
    }
  );

  const { getAllGenres } = useGenres();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // Check cache on component mount
  useEffect(() => {
    const checkCache = () => {
      // Get cached movies first
      const allCachedMovies = cacheManager.getAllCachedMovies();

      
      if (allCachedMovies.length > 0) {
        // Only show first 15 cached movies
        const first15Movies = allCachedMovies.slice(0, 15);
        setCachedMovies(first15Movies);
        setShowingCachedResults(true);
        setNextPageToLoad(2); // Next page to load is page 2
        
        // Also add them to the cacheManager for consistency
        cacheManager.addDiscoveredMovies(first15Movies);
      } else {
        // No cache, start fresh
        setShowingCachedResults(false);
        setNextPageToLoad(1);
      }
    };
    
    checkCache();
  }, []);

  // Fetch genres when component mounts - check cache first
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setGenresLoading(true);
        
        // Check cache first
        const cachedGenres = cacheManager.getGenres();
        if (cachedGenres) {
          setGenres(cachedGenres);
          setGenresLoading(false);
          return;
        }
        
        // Fetch from API if not cached
        const genreData = await getAllGenres();
        if (genreData) {
          setGenres(genreData);
          // Cache the genres
          cacheManager.setGenres(genreData, 60 * 60 * 1000); // 1 hour
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setGenresLoading(false);
      }
    };
    
    fetchGenres();
  }, [getAllGenres]);

  // Handle genre change with cache priority
  const handleGenreChange = useCallback((genre: string) => {
    if (genre === activeGenre) return;
    
    setActiveGenre(genre);
    
    // Check cache first for genre filtering
    if (genre !== 'all') {
      const genreObj = genres.find(g => g.name === genre);
      const cachedForGenre = cacheManager.searchCachedMovies('', genre, '');
      
      if (cachedForGenre.length > 0) {
        // Use cached results
        setCachedMovies(cachedForGenre);
        setShowingCachedResults(true);
        
        // Navigate to search page for better UX
        router.push(`/search?genre=${encodeURIComponent(genre)}`);
        return;
      }
    } else {
      // Show all cached movies
      const allCached = cacheManager.getAllCachedMovies();
      if (allCached.length > 0) {
        setCachedMovies(allCached);
        setShowingCachedResults(true);
        return;
      }
    }
    
    // If no cache, proceed with API call
    setShowingCachedResults(false);
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
  }, [activeGenre, searchMovies, router, genres]);

  // Function to load more movies from server and append to cache
  const loadMoreFromServer = useCallback(async () => {
    if (loadingMore) return; // Prevent double loading
    
    try {
      setLoadingMore(true);
      
      const newParams = {
        genre: activeGenre !== 'all' ? genres.find(g => g.name === activeGenre)?.id : undefined,
        sort: 'views' as const,
        order: 'DESC' as const,
        page: nextPageToLoad,
        limit: 15
      };



      // Import movieService to fetch directly
      const { movieService } = await import('@/lib/api/services/movieService');
      const result = await movieService.getMovies(newParams);

      if (result?.movies && result.movies.length > 0) {
        if (nextPageToLoad === 1) {
          // First page - cache these movies
          setCachedMovies(result.movies);
          setShowingCachedResults(true);
          
          // Update cache manager only for first page
          cacheManager.addDiscoveredMovies(result.movies);
        } else {
          // Subsequent pages - don't cache, just append to display
          const currentDisplayMovies = showingCachedResults ? cachedMovies : [];
          const allDisplayMovies = [...currentDisplayMovies, ...result.movies];
          setCachedMovies(allDisplayMovies);
          setShowingCachedResults(false); // Not showing cached results anymore
        }
        
        setNextPageToLoad(nextPageToLoad + 1);
      } else {
        // No more movies available
        setHasMoreToLoad(false);
      }
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [activeGenre, genres, nextPageToLoad, cachedMovies, loadingMore]);

  // Auto load first batch if no cache and no API movies
  useEffect(() => {
    if (!showingCachedResults && cachedMovies.length === 0 && (!movies || movies.length === 0) && !isLoading && nextPageToLoad === 1) {

      loadMoreFromServer();
    }
  }, [showingCachedResults, cachedMovies.length, movies, isLoading, nextPageToLoad, loadMoreFromServer]);
  
  // Memoize processed movies to avoid unnecessary recalculations
  const allMovies = useMemo(() => {
    // Always use cachedMovies for display (contains either cache-only or cache + additional pages)
    const sourceMovies = cachedMovies.length > 0 ? cachedMovies : movies || [];
    
    if (!sourceMovies || sourceMovies.length === 0) return [];
    
    return sourceMovies.map((movie: Movie) => ({
        ...movie,
        type: movie.totalEpisodes > 0 ? 'series' : 'movie'
      })) as ProcessedMovie[];
  }, [movies, cachedMovies]);
  
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
              <div className="flex items-center gap-4">
                {/* Cache info - only show for first 15 movies */}
                {showingCachedResults && cachedMovies.length === 15 && (
                  <div className="text-xs text-gray-500">
                    Cache: 15 phim đầu
                  </div>
                )}
                {isValidating && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang tải...
                  </div>
                )}
              </div>
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
          {isLoading && !showingCachedResults ? (
            <LoadingSkeleton />
          ) : (
            <>
              <MovieGrid
                isLoading={false}
                movies={allMovies}
                showPagination={false} // Disable pagination for infinite scroll
                totalPages={pagination?.totalPages || 1}
                currentPage={pagination?.currentPage || 1}
                onPageChange={() => {}} // Not used with infinite scroll
              />
              
              {/* Infinite scroll trigger element - only for API results */}
              {hasMore && !showingCachedResults && (
                <div ref={lastElementRef} className="w-full h-10 flex items-center justify-center">
                  {isFetching && <LoadMoreSkeleton />}
                </div>
              )}
              
              {/* Load more button */}
              {allMovies.length > 0 && (
                <div className="text-center py-8">
                  <div className="flex gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreFromServer}
                      disabled={loadingMore || !hasMoreToLoad}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Đang tải thêm 15 phim...
                        </>
                      ) : !hasMoreToLoad ? (
                        'Đã tải hết phim'
                      ) : (
                        `Tải thêm phim`
                      )}
                    </Button>
                  </div>
                </div>
              )}

              
              {/* End of results message */}
              {!hasMore && !showingCachedResults && allMovies.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">Đã hiển thị {allMovies.length} phim</p>
                </div>
              )}
              
              {/* No results message */}
              {!isLoading && allMovies.length === 0 && !showingCachedResults && (
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