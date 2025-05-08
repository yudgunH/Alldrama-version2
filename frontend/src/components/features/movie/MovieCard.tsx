'use client'

import Link from "next/link"
import Image from "next/image"
import type { Movie } from "@/types"
import { generateMovieUrl } from "@/utils/url"
import { Star, Play } from "lucide-react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { AspectRatio } from "@/components/ui/aspect-ratio"
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
  const [imageUrl, setImageUrl] = useState("/images/test.jpg")
  const isMobile = useMobile()
  const movieDetailUrl = generateMovieUrl(movie.id, movie.title)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => setImageLoaded(true)
  const handleImageError = () => {
    setImageError(true)
    setImageUrl("/images/placeholder-poster.jpg")
  }

  const handleCardClick = () => {
    router.push(movieDetailUrl)
  }

  // Render compact variant (used in watch pages for related movies)
  if (variant === "compact") {
    return (
      <Link href={movieDetailUrl} className="block">
        <div className={cn("flex items-center gap-3 group cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors", className)}>
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={imageUrl}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
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
    <div 
      ref={cardRef} 
      className={cn(
        "group overflow-hidden relative rounded-xl transition-all",
        fullWidth ? "w-full" : "", 
        variant === "featured" ? "aspect-[2/1]" : "aspect-[2/3]",
        variant === "slider" ? "border border-gray-700 hover:border-indigo-500/30 hover:shadow-md hover:shadow-indigo-900/10" : "",
        className
      )}
      onClick={handleCardClick}
    >
      <div className={`absolute inset-0 ${variant === "trending" ? "bg-gradient-to-t from-indigo-600 via-indigo-500/30 to-transparent" : ""}`}>
        <div 
          className={`
            h-full w-full relative
            ${!imageLoaded ? "animate-pulse bg-gray-800" : ""}
            ${trapezoid ? "trapezoid" : ""}
          `}
        >
          <img
            src={imageUrl}
            alt={movie.title}
            className={`
              h-full w-full object-cover
              ${imageLoaded ? "opacity-100" : "opacity-0"}
              ${trapezoid ? "trapezoid-image" : ""}
              ${variant === "featured" ? "duration-700 group-hover:scale-105" : ""}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      </div>

      {/* Overlay and content */}
      <div 
        className={`
          absolute inset-0 flex flex-col justify-end
          ${variant === "featured" ? "p-6" : "p-3"}
          ${variant === "trending" ? "" : "bg-gradient-to-t from-black/90 via-black/70 to-black/0"}
        `}
      >
        {/* Rating badge - top right */}
        {variant !== "trending" && movie.rating !== undefined && (
          <div className="absolute top-2 right-2 flex items-center bg-black/60 px-1.5 py-0.5 rounded text-xs font-medium">
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

        {/* Title and info */}
        <h3 className={`font-medium text-white line-clamp-1 ${variant === "featured" ? "text-xl mb-1" : "text-sm"}`}>
          {movie.title}
        </h3>
        
        <div className="flex items-center text-xs text-gray-300 space-x-2">
          {movie.rating !== undefined && (
            <div className="flex items-center text-amber-400 gap-1">
              <Star size={12} className="flex-shrink-0 fill-current" /> 
              <span>{movie.rating}</span>
            </div>
          )}
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
    </div>
  )
}

export default MovieCard