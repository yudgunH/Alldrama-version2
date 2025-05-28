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
  maxItems = 7,
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
  
  // State cho dữ liệu phim
  const [movieData, setMovieData] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(!movies);
  const [error, setError] = useState<string | null>(null);
  
  // Sử dụng dữ liệu từ props
  useEffect(() => {
    if (movies && movies.length > 0) {
      setMovieData(movies);
      setLoading(false);
    } else {
      setMovieData([]);
      setLoading(false);
    }
  }, [movies]);
  
  // Tính toán các thông số pagination và hiển thị
  const moviesForDisplay = movieData && movieData.length > 0 ? movieData : [];
  const responsiveMaxItems = isMobile ? 3 : (isTablet ? 5 : maxItems);
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
    setTouchStart(0);
    setTouchEnd(0);
  };
  
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: responsiveMaxItems }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-[2/3] rounded-md h-48 sm:h-56 md:h-64" />
              <Skeleton className="h-4 w-3/4 rounded-sm" />
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
      
      {/* Case 3: Có dữ liệu */}
      {!loading && !error && movieData && movieData.length > 0 && (
        <>
          {isMobile ? (
            // Mobile view with horizontal scrolling
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
                    width: 'calc(33.333% - 0.75rem)',
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
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

      {/* Case 4: Không có dữ liệu */}
      {!loading && !error && (!movieData || movieData.length === 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: responsiveMaxItems }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-[2/3] rounded-md h-48 sm:h-56 md:h-64" />
              <Skeleton className="h-4 w-3/4 rounded-sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieSlider