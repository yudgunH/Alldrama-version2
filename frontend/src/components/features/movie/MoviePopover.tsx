'use client'

import Link from "next/link"
import Image from "next/image"
import type { Movie } from "@/types"
import { generateMovieUrl, generateWatchUrl } from "@/utils/url"
import { Star, Play, Heart, Info, Calendar, Clock, Film, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useState, useRef, useEffect } from "react"
import { useMobile } from '@/hooks/use-mobile'
import { useAuth } from '@/hooks/api/useAuth'
import { useFavorites } from '@/hooks/api/useFavorites'
import { toast } from 'sonner'


interface MoviePopoverProps {
  movie: Movie
  trigger?: React.ReactNode
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'simple'
  showPopover?: boolean
  hoverDelay?: number
}

const MoviePopover = ({ 
  movie, 
  trigger, 
  children,
  size = 'md',
  variant = 'default',
  showPopover = true,
  hoverDelay = 500 // Default 250ms delay
}: MoviePopoverProps) => {
  const [open, setOpen] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const isMobile = useMobile(1024)
  const isDesktop = !isMobile
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Auth and favorites hooks
  const { isAuthenticated } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  
  // Generate URLs using the utility functions
  const movieDetailUrl = generateMovieUrl(movie.id, movie.title)
  const watchUrl = generateWatchUrl(movie.id, movie.title)
  
  const imageUrl = "/images/test.jpg"

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])
  
  // Check if the movie is in favorites when component mounts
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (isAuthenticated && movie) {
        try {
          const favorited = await isFavorite(movie.id)
          setIsLiked(favorited)
        } catch (error) {
          console.error("Error checking favorite status:", error)
        }
      }
    }
    
    // Only run this effect if the user is authenticated
    if (isAuthenticated) {
      checkFavoriteStatus()
    }
  }, [isAuthenticated, movie, isFavorite])

  // Handle toggle favorite
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    // Prevent the click from propagating to parent elements
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào danh sách yêu thích")
      return
    }
    
    if (movie) {
      try {
        const favorited = await toggleFavorite(movie.id)
        if (favorited !== null) {
          setIsLiked(favorited)
          if (favorited) {
            toast.success("Đã thêm vào danh sách yêu thích")
          } else {
            toast.error("Đã xóa khỏi danh sách yêu thích")
          }
        }
      } catch (error) {
        console.error("Error toggling favorite:", error)
        toast.error("Không thể thay đổi trạng thái yêu thích")
      }
    }
  }

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    
    timerRef.current = setTimeout(() => {
      setOpen(true)
    }, hoverDelay)
  }

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setOpen(false)
  }

  const sizeConfig = {
    sm: {
      width: 'w-72',
      titleSize: 'text-base',
      topClass: 'top-[-30px]',
      descriptionLines: 'line-clamp-2',
      showActors: false,
      showVersions: false
    },
    md: {
      width: 'w-68',
      titleSize: 'text-lg',
      topClass: 'top-[-20px]',
      descriptionLines: 'line-clamp-3',
      showActors: true,
      showVersions: true
    },
    lg: {
      width: 'w-96',
      titleSize: 'text-xl',
      topClass: 'top-[-10px]',
      descriptionLines: 'line-clamp-4',
      showActors: true,
      showVersions: true
    }
  }[size]

  // If children are provided, use them as the trigger
  const triggerElement = children || trigger

  // On mobile or if showPopover is false, just render the trigger without popover functionality
  if (isMobile || !showPopover) {
    // Trả về trigger element mà không wrap bằng Link để tránh lỗi Link lồng trong Link
    return (
      <>{triggerElement}</>
    )
  }

  return (
    <div className="relative group">
      <div 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={triggerRef}
      >
        <div className={`${open ? 'opacity-90 scale-[1.05]' : 'opacity-100'} transition-all duration-300`}>
          {triggerElement}
        </div>

        {open && (
          <div 
            ref={popoverRef}
            className={`${sizeConfig.width} ${sizeConfig.topClass} absolute transform scale-[1.10] p-0 border border-amber-500/30 shadow-2xl rounded-md overflow-hidden transition-all duration-300 z-[9]`}
            style={{
              opacity: open ? 1 : 0,
              left: '55%',
              transform: 'translateX(-50%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Overlay */}
            <div className="w-full h-full bg-black/80">
              <div className="p-4">
                {/* Rating badge */}
                <Badge className="bg-amber-600/90 text-white mb-3 inline-flex items-center">
                  <Star size={12} className="mr-1 fill-white" />
                  {movie.rating || "N/A"}
                </Badge>

                {/* Title */}
                <h3 className={`text-white font-bold ${sizeConfig.titleSize} line-clamp-2 mb-2`}>
                  {movie.title}
                </h3>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <Calendar size={14} className="text-amber-500" />
                    <span>{movie.releaseYear}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <Clock size={14} className="text-amber-500" />
                    <span>{movie.duration || "N/A"} Phút</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <Star size={14} className="text-amber-500" />
                    <span>{movie.rating || "N/A"} / 10</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <User size={14} className="text-amber-500" />
                    <span>Chưa cập nhật</span>
                  </div>
                </div>

                {/* Description */}
                <p className={`text-xs text-gray-300 ${sizeConfig.descriptionLines} mb-3`}>
                  {movie.summary || "Chưa có mô tả cho phim này."}
                </p>

                {variant === 'simple' ? (
                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      asChild 
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-9"
                    >
                      <Link href={watchUrl}>
                        <Play size={16} className="mr-1" />
                        Xem phim
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {(sizeConfig.showActors || sizeConfig.showVersions) && (
                      <Separator className="my-3 bg-gray-800/60" />
                    )}

                    {sizeConfig.showVersions && (
                      <div className="mb-4">
                        <h4 className="text-xs text-gray-400 mb-1.5 flex items-center">
                          <Film size={12} className="mr-1 text-amber-500" />
                          Phiên bản
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {["Vietsub", "Thuyết minh", "Lồng tiếng"].map((version) => (
                            <Badge key={version} variant="outline" className="bg-gray-800/80 text-xs text-white border-gray-700">
                              {version}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <Button 
                        asChild 
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white h-9"
                      >
                        <Link href={watchUrl}>
                          <Play size={16} className="mr-1" />
                          Xem ngay
                        </Link>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className={`h-9 w-9 ${isLiked ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-pink-500'}`}
                        onClick={handleToggleFavorite}
                      >
                        <Heart size={16} className={isLiked ? 'fill-white' : ''} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-9 w-9 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-amber-500"
                        asChild
                      >
                        <Link href={movieDetailUrl}>
                          <Info size={16} />
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MoviePopover
