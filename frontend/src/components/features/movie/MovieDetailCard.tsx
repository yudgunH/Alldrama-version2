'use client'

import Image from "next/image"
import Link from "next/link"
import { Star, Play, Eye, Calendar, Clock } from "lucide-react"
import { Movie } from "@/types"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { getImageInfo } from "@/utils/image"

interface MovieDetailCardProps {
  movie: Movie
  className?: string
  isLoading?: boolean
}

const MovieDetailCard = ({ 
  movie,
  className = "",
  isLoading = false
}: MovieDetailCardProps) => {
  if (isLoading) {
    return (
      <div className={cn("w-full max-w-3xl mx-auto bg-gray-900 rounded-lg overflow-hidden", className)}>
        <div className="relative">
          <Skeleton className="w-full aspect-[16/9] rounded-lg" />
          <div className="absolute -bottom-12 left-6">
            <Skeleton className="w-24 aspect-[2/3] rounded-lg" />
          </div>
        </div>
        <div className="mt-16 p-3 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  // Get image info for backdrop and poster
  const backdropInfo = getImageInfo(movie.backdropUrl || movie.posterUrl, movie.id, 'backdrop')
  const posterInfo = getImageInfo(movie.posterUrl, movie.id, 'poster')

  return (
    <div className={cn("w-full max-w-3xl mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-xl", className)}>
      <div className="relative">
        {/* Main Landscape Image */}
        <div className="relative aspect-[16/9] w-full">
          {backdropInfo.shouldShowSkeleton ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <Image
              src={backdropInfo.url}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 50vw, 33vw"
              priority
              onError={(e) => {
                console.log('MovieDetailCard - Backdrop image load error for URL:', backdropInfo.url);
              }}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          
          {/* Play Button */}
          <Link href={`/movie/${movie.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="p-3 rounded-full bg-indigo-600/90 text-white transform scale-0 hover:scale-100 transition-transform duration-300">
              <Play size={24} className="ml-0.5" />
            </div>
          </Link>
        </div>

        {/* Content Area with Portrait Poster */}
        <div className="relative px-3 pb-3 bg-gray-950">
          <div className="flex gap-3">
            {/* Portrait Poster */}
            <Link href={`/movie/${movie.id}`} className="relative -mt-12 w-24 aspect-[2/3] rounded-lg overflow-hidden shadow-xl">
              {posterInfo.shouldShowSkeleton ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <Image
                  src={posterInfo.url}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                  onError={(e) => {
                    console.log('MovieDetailCard - Poster image load error for URL:', posterInfo.url);
                  }}
                />
              )}
            </Link>

            {/* Info Area */}
            <div className="flex-1 pt-3">
              <div className="space-y-2">
                {/* Main Title */}
                <Link 
                  href={`/movie/${movie.id}`}
                  className="text-sm font-bold text-white line-clamp-1 hover:text-indigo-400 transition-colors"
                >
                  {movie.title}
                </Link>
                
                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                    <span className="text-amber-400 text-xs font-medium">
                      {movie.rating 
                        ? (typeof movie.rating === 'number' 
                            ? movie.rating.toFixed(1) 
                            : movie.rating)
                        : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Release Year */}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300 text-xs">
                      {movie.releaseYear || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Views */}
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300 text-xs">
                      {movie.views?.toLocaleString() || '0'} lượt xem
                    </span>
                  </div>
                  
                  {/* Duration */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300 text-xs">
                      {movie.duration || 'N/A'} phút
                    </span>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1">
                  {movie.genres?.map((genre, index) => (
                    <span 
                      key={index}
                      className="px-1 py-0.5 text-[8px] bg-gray-800 text-gray-300 rounded-md"
                    >
                      {typeof genre === 'string' ? genre : genre.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MovieDetailCard 