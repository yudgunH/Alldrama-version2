'use client'

import Link from "next/link"
import Image from "next/image"
import type { Movie } from "@/types"
import { generateMovieUrl } from "@/utils/url"
import { getSafePosterUrl, getImageInfo } from "@/utils/image"
import { Star, Play } from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Skeleton } from "@/components/ui/skeleton"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface MovieCardProps {
  movie: Movie
  index?: number
  variant?: "slider" | "grid" | "featured" | "trending" | "compact"
  trapezoid?: boolean
  className?: string
  fullWidth?: boolean
}

const MovieCard = ({ 
  movie, 
  index = 0, 
  variant = "slider", 
  trapezoid = false,
  className = "",
  fullWidth = false
}: MovieCardProps) => {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const movieDetailUrl = generateMovieUrl(movie.id, movie.title)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Use the new image info utility to determine if skeleton should be shown
  const imageInfo = getImageInfo(movie.posterUrl, movie.id, 'poster')

  const handleCardClick = () => {
    router.push(movieDetailUrl)
  }

  // Render compact variant (used in watch pages for related movies)
  if (variant === "compact") {
    return (
      <Link href={movieDetailUrl} className="block">
        <div className={cn("flex items-center gap-3 group cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors", className)}>
          <div className="relative aspect-[2/3] w-24 overflow-hidden">
            {imageInfo.shouldShowSkeleton ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Image
                src={imageInfo.url}
                alt={movie.title}
                fill
                sizes="96px"
                className="object-cover transition-transform group-hover:scale-110"
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true)
                  setIsLoading(false)
                }}
              />
            )}
            {!imageInfo.shouldShowSkeleton && isLoading && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{movie.title}</h3>
            <div className="flex items-center mt-1 text-xs text-gray-300 space-x-2">
              <span className="inline-block">{movie.releaseYear}</span>
              {movie.rating !== undefined && (
                <>
                  <span className="inline-block text-gray-500">•</span>
                  <span className="flex items-center text-amber-400 gap-1">
                    <Star size={10} className="flex-shrink-0 fill-current" /> 
                    <span>{movie.rating}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Render standard card variants
  return (
    <div className="flex flex-col gap-2">
    <div 
      ref={cardRef} 
      className={cn(
          "group overflow-hidden relative rounded-md transition-all",
        fullWidth ? "w-full" : "", 
        variant === "featured" ? "aspect-[2/1]" : "aspect-[2/3]",
        variant === "slider" ? "border border-gray-700 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-900/10" : "",
        className
      )}
      onClick={handleCardClick}
    >
      <div className={`absolute inset-0 ${variant === "trending" ? "bg-gradient-to-t from-indigo-600 via-indigo-500/30 to-transparent" : ""}`}>
          <div className={cn(
            "h-full w-full relative",
            isLoading && !imageInfo.shouldShowSkeleton && "animate-pulse bg-gray-800",
            trapezoid && "trapezoid"
          )}>
            {imageInfo.shouldShowSkeleton ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <Image
                src={imageInfo.url}
              alt={movie.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={cn(
                  "object-cover transition-transform duration-700",
                  isLoading ? "opacity-0" : "opacity-100",
                  trapezoid && "trapezoid-image",
                  variant === "featured" && "group-hover:scale-105"
                )}
                onLoadingComplete={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true)
                  setIsLoading(false)
                }}
                priority={variant === "featured" || variant === "trending"}
            />
            )}
        </div>
      </div>

      {/* Overlay and content - only show if not skeleton */}
      {!imageInfo.shouldShowSkeleton && (
        <div 
            className={cn(
              "absolute inset-0 flex flex-col justify-end",
              variant === "featured" ? "p-6" : "p-3",
              variant === "trending" ? "" : "bg-gradient-to-t from-black/90 via-black/70 to-black/0"
            )}
        >
          {/* Rating badge - top right */}
          {variant !== "trending" && movie.rating !== undefined && (
              <div className="absolute top-2 right-2 flex items-center bg-black/60 px-1.5 py-0.5 rounded-sm text-xs font-medium">
              <Star size={12} className="text-amber-400 fill-current mr-0.5" /> 
              <span className="text-white">{movie.rating}</span>
            </div>
          )}

          {/* Play button - center */}
          {(variant === "featured" || variant === "trending") && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 flex items-center justify-center bg-indigo-600/90 rounded-full">
                <Play size={24} className="text-white ml-1" />
              </div>
            </div>
          )}

            {/* Info */}
          <div className="flex items-center text-xs text-gray-300 space-x-2">
            <span className="inline-block">{movie.releaseYear}</span>
            
            {(variant === "featured" || variant === "trending") && movie.genres && movie.genres[0] && (
              <>
                <span className="inline-block text-gray-500">•</span>
                <span className="inline-block">
                  {typeof movie.genres[0] === "string" ? movie.genres[0] : movie.genres[0].name}
                </span>
              </>
            )}
            {variant === "trending" && movie.rating !== undefined && (
              <>
                <span className="inline-block text-gray-500">•</span>
                <span className="flex items-center gap-1">
                  <Star size={10} className="flex-shrink-0 text-amber-400 fill-current" /> 
                  <span>{movie.rating}</span>
                </span>
              </>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Title below card */}
      <h3 className="font-medium text-white line-clamp-1 text-sm group-hover:text-indigo-400 transition-colors">
        {movie.title}
      </h3>
    </div>
  )
}

export default MovieCard