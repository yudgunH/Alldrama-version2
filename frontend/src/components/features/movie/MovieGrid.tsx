'use client'

import { FileQuestion, ChevronLeft, ChevronRight } from "lucide-react"
import MovieCard from "./MovieCard"
import type { Movie } from "@/types"
import { motion } from "framer-motion"
import MoviePopover from "./MoviePopover"
import Link from "next/link"
import { generateMovieUrl } from "@/utils/url"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import React from "react"

interface MovieGridProps {
  movies: Movie[] // Make this required
  isLoading?: boolean
  emptyMessage?: string
  layout?: 'grid' | 'classic'
  onHover?: (movie: Movie) => void
  // Pagination props
  showPagination?: boolean
  totalPages?: number
  currentPage?: number
  onPageChange?: (page: number) => void
}

const MovieGrid = ({
  movies,
  isLoading = false,
  emptyMessage = "Không tìm thấy phim nào",
  layout = 'grid',
  onHover,
  showPagination = false,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
}: MovieGridProps) => {
  // Xử lý chuyển trang
  const handlePageChange = useCallback((newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  }, [onPageChange]);
  
  // Xác định trạng thái trống
  const isEmpty = !isLoading && (!movies || movies.length === 0);
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="w-full aspect-[2/3] rounded-md h-64 sm:h-80" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        
        {showPagination && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-black/60 p-5 rounded-full mb-4">
          <FileQuestion size={48} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">Không tìm thấy phim</h3>
        <p className="text-gray-400 max-w-md">{emptyMessage}</p>
      </div>
    )
  }

  // Render pagination controls
  const renderPagination = () => {
    if (!showPagination || totalPages <= 1) return null;

    return (
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2">
          <Button 
            size="icon"
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage <= 1}
            className={`rounded-full ${
              currentPage > 1 
                ? 'bg-black/80 hover:bg-black/60 border-gray-700' 
                : 'bg-black/50 cursor-not-allowed border-transparent opacity-50'
            } flex items-center justify-center w-10 h-10`}
          >
            <ChevronLeft size={18} />
          </Button>
          
          <div className="px-4 py-2 rounded-md bg-gray-800/50 border border-gray-700">
            <span className="text-gray-300">
              Trang {currentPage} / {totalPages}
            </span>
          </div>

          <Button 
            size="icon"
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage >= totalPages}
            className={`rounded-full ${
              currentPage < totalPages 
                ? 'bg-black/80 hover:bg-black/60 border-gray-700' 
                : 'bg-black/50 cursor-not-allowed border-transparent opacity-50'
            } flex items-center justify-center w-10 h-10`}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    );
  };

  // Render grid layout
  if (layout === 'grid') {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              onMouseEnter={() => onHover?.(movie)}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
        {renderPagination()}
      </div>
    )
  }

  // Render classic layout
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <MoviePopover 
            key={movie.id} 
            movie={movie} 
            size="lg" 
            trigger={
              <Link href={generateMovieUrl(movie.id, movie.title)}>
                <motion.div 
                  className="group relative bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-red-900/20 transition duration-300 flex h-full flex-col"
                  layoutId={`movie-${movie.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onHoverStart={() => onHover?.(movie)}
                  whileHover={{ scale: 1.01 }}
                >
                  {/* Aspect ratio div for the image */}
                  <div className="relative aspect-video">
                    <img 
                      src={'/placeholder-landscape.jpg'} 
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  </div>
                  
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="text-lg font-semibold text-white group-hover:text-red-500 transition-colors line-clamp-2">{movie.title}</h3>
                    
                    <div className="flex items-center mt-1 text-sm text-gray-400">
                      <span>{movie.releaseYear}</span>
                      {movie.duration && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                        </>
                      )}
                    </div>
                    
                    <p className="mt-3 text-gray-400 text-sm line-clamp-2">
                      {movie.summary || ''}
                    </p>
                    
                    <div className="mt-auto pt-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="bg-red-600 text-white font-medium text-xs px-2 py-1 rounded">
                          IMDb
                        </div>
                        <span className="text-amber-400 ml-2 font-medium">{movie.rating || 8.5}</span>
                      </div>
                      
                      {movie.genres && movie.genres.length > 0 && (
                        <div>
                          <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                            {typeof movie.genres[0] === 'string' 
                              ? movie.genres[0] 
                              : movie.genres[0]?.name || 'Action'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            }
          />
        ))}
      </div>
      {renderPagination()}
    </div>
  )
}

export default MovieGrid;
