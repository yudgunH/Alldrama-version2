'use client'

import Link from "next/link"
import type { Movie } from "@/types"
import MovieCard from "./MovieCard"
import { Button } from "@/components/ui/button"
import { generateMovieUrl } from "@/utils/url"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import MoviePopover from "./MoviePopover"
import { useState, useEffect, useCallback } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { useMovies } from "@/hooks/api/useMovies"
import { Skeleton } from "@/components/ui/skeleton"

interface MovieSliderProps {
  title: string
  movies?: Movie[]
  endpoint?: "newest" | "popular" | "trending" | "featured" | "topRated"
  genreId?: number | string
  variant?: "default" | "popular" | "trending" | "new" | "top"
  className?: string
  maxItems?: number
  size?: 'sm' | 'md' | 'lg'
  showPopover?: boolean
  limit?: number
}

const MovieSlider = ({ 
  title, 
  movies, 
  endpoint,
  genreId,
  variant = "default",
  className = "",
  maxItems = 5,
  size = 'md',
  showPopover = true,
  limit = 10
}: MovieSliderProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const isMobileSmall = useMobile(768);
  const isMobileLarge = useMobile(1024);
  
  // Determine device type from breakpoints
  const isMobile = isMobileSmall;
  const isTablet = isMobileLarge && !isMobileSmall;
  
  // State cho dữ liệu phim từ API
  const [movieData, setMovieData] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(!movies);
  const [error, setError] = useState<string | null>(null);
  
  // Sử dụng hooks API
  const { 
    getFeaturedMovies,
    getPopularMovies,
    getTrendingMovies,
    getNewestMovies,
    getSimilarMovies,
  } = useMovies();
  
  // Fetch dữ liệu từ API
  const fetchMovies = useCallback(async () => {
    // Nếu đã truyền movies thì sử dụng chúng, không cần gọi API
    if (movies && movies.length > 0) {
      setMovieData(movies);
      setLoading(false);
      return;
    }
    
    // Nếu không có endpoint và genreId thì không gọi API
    if (!endpoint && !genreId) {
      setMovieData([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let result: Movie[] = [];
      
      if (genreId) {
        // Khi có genreId, sử dụng getSimilarMovies hoặc getMoviesByGenre
        const genreIdValue = typeof genreId === 'string' ? genreId : String(genreId);
        result = await getSimilarMovies(genreIdValue);
      } else if (endpoint) {
        // Fetch movies theo endpoint
        switch (endpoint) {
          case "newest":
            result = await getNewestMovies();
            break;
          case "popular":
            result = await getPopularMovies();
            break;
          case "trending":
            result = await getTrendingMovies();
            break;
          case "featured":
            result = await getFeaturedMovies();
            break;
          case "topRated":
            // Sử dụng getTrendingMovies để thay thế topRated
            result = await getTrendingMovies();
            break;
          default:
            result = [];
        }
      }
      
      // Nếu kết quả là null, đặt thành mảng rỗng để tránh lỗi
      if (!result) {
        result = [];
      }
      
      setMovieData(result);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Không thể tải dữ liệu phim");
    } finally {
      setLoading(false);
    }
  }, [endpoint, movies, genreId, getFeaturedMovies, getPopularMovies, getTrendingMovies, getNewestMovies, getSimilarMovies]);
  
  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);
  
  // Tính toán các thông số pagination và hiển thị
  const moviesForDisplay = movieData && movieData.length > 0 ? movieData : [];
  const responsiveMaxItems = isTablet ? 4 : maxItems;
  const totalPages = Math.ceil(moviesForDisplay.length / responsiveMaxItems);
  const startIndex = currentPage * responsiveMaxItems;
  const displayMovies = moviesForDisplay.slice(startIndex, startIndex + responsiveMaxItems);
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };
  
  // Handle touch events for mobile scrolling
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    // No action needed - we're using native scroll behavior instead of pagination
    // Reset values
    setTouchStart(0);
    setTouchEnd(0);
  };
  
  // Chlu1ec9 mu1ed9t return duy nhu1ea5t u1edf cuu1ed1i cu1ee7a component
  return (
    <div className={cn("w-full mb-8 md:mb-12", className)}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-1 h-6 bg-indigo-500 rounded-full`}></div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-400">
            {title}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {totalPages > 1 && !isMobile && movieData && movieData.length > 0 && !loading && !error && (
            <div className="flex items-center space-x-2">
              <Button 
                size="icon"
                variant="outline"
                onClick={handlePrevPage} 
                disabled={currentPage === 0}
                className={`rounded-full ${
                  currentPage > 0 
                    ? 'bg-black/80 hover:bg-black/60 border-gray-700' 
                    : 'bg-black/50 cursor-not-allowed border-transparent opacity-50'
                } flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9`}
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </Button>

              <Button 
                size="icon"
                variant="outline"
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages - 1}
                className={`rounded-full ${
                  currentPage < totalPages - 1 
                    ? 'bg-black/80 hover:bg-black/60 border-gray-700' 
                    : 'bg-black/50 cursor-not-allowed border-transparent opacity-50'
                } flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9`}
              >
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Case 1: Loading */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-[2/3] rounded-md h-64 sm:h-72" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}
      
      {/* Case 2: Error */}
      {!loading && error && (
        <div className="bg-red-900/30 border border-red-700 rounded-md p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}
      
      {/* Case 3: Clu00f3 du1eef liu1ec7u */}
      {!loading && !error && movieData && movieData.length > 0 && (
        <>
          {isMobile ? (
            // Mobile/tablet view with horizontal scrolling
            <div 
              className="overflow-x-auto flex gap-3 snap-x snap-mandatory scrollbar-hide pb-4"
              style={{ 
                scrollbarWidth: 'none', 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory'
              }}
            >
              {displayMovies.map((movie, index) => (
                <div 
                  key={String(movie.id)}
                  className="flex-shrink-0 snap-start" 
                  style={{ 
                    width: isMobile ? 'calc(50% - 0.75rem)' : 'calc(33.333% - 1rem)',
                    scrollSnapAlign: 'start'
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                  >
                    <MoviePopover
                      movie={movie}
                      trigger={
                        <Link 
                          href={generateMovieUrl(movie.id, movie.title)} 
                          className="transition-transform hover:scale-[1.03] duration-300 block w-full h-full"
                          onClick={() => console.log(`Clicked movie: ${movie.title} (ID: ${movie.id}), URL: ${generateMovieUrl(movie.id, movie.title)}`)}
                        >
                          <MovieCard
                            movie={movie}
                            index={index}
                            variant={variant === "trending" ? "trending" : "slider"}
                            trapezoid={false}
                            fullWidth={true}
                            className="h-full"
                          />
                        </Link>
                      }
                      size={size}
                      showPopover={showPopover}
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop view with grid layout
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
              {displayMovies.map((movie, index) => (
                <motion.div
                  key={String(movie.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <MoviePopover
                    movie={movie}
                    trigger={
                      <Link 
                        href={generateMovieUrl(movie.id, movie.title)} 
                        className="transition-transform hover:scale-[1.03] duration-300 block w-full h-full"
                        onClick={() => console.log(`Clicked movie: ${movie.title} (ID: ${movie.id}), URL: ${generateMovieUrl(movie.id, movie.title)}`)}
                      >
                        <MovieCard
                          movie={movie}
                          index={index}
                          variant={variant === "trending" ? "trending" : "slider"}
                          trapezoid={false}
                          fullWidth={true}
                          className="h-full"
                        />
                      </Link>
                    }
                    size={size}
                    showPopover={showPopover}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Case 4: Non data */}
      {!loading && !error && (!movieData || movieData.length === 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-[2/3] rounded-md h-64 sm:h-72" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MovieSlider