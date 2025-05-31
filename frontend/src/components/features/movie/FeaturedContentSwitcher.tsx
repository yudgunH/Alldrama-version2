'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Star, Calendar, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Movie } from '@/types'
import { generateMovieUrl } from '@/utils/url'
import { getSafePosterUrl, getImageInfo } from '@/utils/image'
import { useMobile } from '@/hooks/use-mobile'
import { motion, AnimatePresence } from 'framer-motion'

export interface FeaturedContentSwitcherProps {
  items?: Movie[]
  title?: string
  variant?: 'default' | 'indigo' | 'amber' | 'dark'
  aspectRatio?: 'video' | 'poster' | 'banner' | 'landscape' | 'portrait'
  itemsPerView?: number
  showThumbnails?: boolean
  initialIndex?: number
  renderDetailContent?: (item: Movie, index: number) => React.ReactNode
  onItemChange?: (item: Movie, index: number) => void
  className?: string
  showProgress?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  defaultIndex?: number
  wrapContainer?: boolean
  isLoading?: boolean
}

const FeaturedContentSwitcher = ({
  items = [],
  title = 'Nổi bật',
  variant = 'default',
  aspectRatio = 'video',
  itemsPerView = 5,
  showThumbnails = true,
  initialIndex = 0,
  renderDetailContent,
  onItemChange,
  className,
  showProgress = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  defaultIndex = 0,
  wrapContainer = true,
  isLoading = false
}: FeaturedContentSwitcherProps) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex)
  const totalItems = items?.length || 0
  const selectedItem = totalItems > 0 ? items[selectedIndex] : null
  const isMobile = useMobile()
  
  // Touch handling for mobile
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const mainRef = useRef<HTMLDivElement>(null)
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      // Handle left swipe - go to next item
      handleItemSelect((selectedIndex + 1) % totalItems)
    }
    
    if (isRightSwipe) {
      // Handle right swipe - go to previous item
      handleItemSelect(selectedIndex === 0 ? totalItems - 1 : selectedIndex - 1)
    }
    
    // Reset values
    setTouchStart(0)
    setTouchEnd(0)
  }
  
  // Get viewport size with debouncing to prevent excessive re-renders
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateSize()
    
    // Debounce resize events
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateSize, 150)
    }
    
    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Memoize variant styles to prevent recalculation
  const styles = useMemo(() => {
    switch (variant) {
      case 'indigo':
        return {
          gradient: 'from-indigo-900 via-purple-900 to-indigo-900',
          accent: 'bg-indigo-600',
          accentHover: 'hover:bg-indigo-700',
          titleGradient: 'from-indigo-400 to-purple-400',
          border: 'border-indigo-500/20',
          badgeBg: 'bg-indigo-600/10',
          badgeText: 'text-indigo-400',
          highlight: 'text-indigo-400'
        }
      case 'amber':
        return {
          gradient: 'from-amber-900 via-orange-900 to-amber-900',
          accent: 'bg-amber-600',
          accentHover: 'hover:bg-amber-700',
          titleGradient: 'from-amber-400 to-red-400',
          border: 'border-amber-500/20',
          badgeBg: 'bg-amber-600/10',
          badgeText: 'text-amber-400',
          highlight: 'text-amber-400'
        }
      case 'dark':
        return {
          gradient: 'from-gray-900 via-gray-800 to-gray-900',
          accent: 'bg-gray-700',
          accentHover: 'hover:bg-gray-600',
          titleGradient: 'from-gray-200 to-gray-400',
          border: 'border-gray-700',
          badgeBg: 'bg-gray-700',
          badgeText: 'text-gray-300',
          highlight: 'text-gray-300'
        }
      default:
        return {
          gradient: 'from-gray-900 via-gray-800 to-gray-900',
          accent: 'bg-gray-700',
          accentHover: 'hover:bg-gray-600',
          titleGradient: 'from-gray-200 to-gray-400',
          border: 'border-gray-700',
          badgeBg: 'bg-gray-700',
          badgeText: 'text-gray-300',
          highlight: 'text-gray-300'
        }
    }
  }, [variant])
  
  // Get aspect ratio style
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'poster': return 'aspect-[2/3]'
      case 'banner': return 'aspect-[21/9]'
      case 'landscape': return 'aspect-[16/9]'
      case 'portrait': return 'aspect-[9/16]'
      default: return 'aspect-video'
    }
  }
  
  // Stable callback for item selection
  const handleItemSelect = useCallback((index: number) => {
    if (!items || items.length === 0) return
    
    setSelectedIndex(index)
    if (onItemChange && items[index]) {
      onItemChange(items[index], index)
    }
  }, [items, onItemChange])
  
  // Auto play functionality with proper cleanup
  useEffect(() => {
    if (!autoPlay || totalItems <= 1) return

    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % totalItems)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, totalItems])
  
  // Keyboard navigation with proper cleanup
  useEffect(() => {
    if (totalItems === 0) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % totalItems)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [totalItems])
  
  // Calculate visible thumbnails
  const visibleThumbs = useMemo(() => Math.min(items.length, 8), [items.length])
  
  // Track failed images to prevent retry loops
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  
  const handleImageError = useCallback((url: string) => {
    setFailedImages(prev => new Set(prev).add(url))
  }, [])
  
  // Hiển thị skeleton khi đang loading hoặc không có dữ liệu
  if (isLoading) {
    return wrapContainer ? (
      <section className="bg-gray-950">
        <div className="w-full">
          <div className="py-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="w-full aspect-[21/9] rounded-lg" />
          </div>
        </div>
      </section>
    ) : (
      <div className="py-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="w-full aspect-[21/9] rounded-lg" />
      </div>
    )
  }
  
  // Return null if no items
  if (!items || items.length === 0) return null
  
  const content = (
    <div 
      ref={mainRef} 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd} 
      className={cn('space-y-4 py-12', className)}
    >
      {title && (
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className={`bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent`}>
            {title}
          </span>
        </h2>
      )}
      
      <div className="relative">
        {/* Featured Item Display */}
        <div className="relative w-full aspect-[30/9] overflow-hidden rounded-lg">
          {selectedItem && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {(() => {
                  const imageInfo = getImageInfo(selectedItem.posterUrl, selectedItem.id, 'poster');
                  const shouldShowSkeleton = imageInfo.shouldShowSkeleton || failedImages.has(imageInfo.url);
                  
                  return shouldShowSkeleton ? (
                    <Skeleton className="w-full h-full" />
                  ) : (
                    <Image
                      src={imageInfo.url}
                      alt={selectedItem?.title || "Movie poster"}
                      fill
                      priority
                      className="object-cover"
                      onError={(e) => {
                        console.log('FeaturedContentSwitcher - Main image load error for URL:', imageInfo.url);
                        handleImageError(imageInfo.url);
                      }}
                    />
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </motion.div>
            </AnimatePresence>
          )}
          
          {selectedItem && (
            <div className={cn(
              "absolute bottom-0 left-0 w-full p-2",
              viewportSize.width < 640 ? "" : "p-6 pb-16"
            )}>
              <div className="flex flex-col gap-2 max-w-2xl">
                <h3 className={cn(` font-bold bg-gradient-to-r ${styles.titleGradient} bg-clip-text text-transparent`, viewportSize.width < 640 ? "text-base" : "text-3xl")}>
                  {selectedItem.title}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedItem.releaseYear && (
                    <Badge variant="outline" className="text-xs bg-white/10 text-white">
                      {selectedItem.releaseYear}
                    </Badge>
                  )}
                  {selectedItem.rating && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs bg-white/10 text-white">
                      <Star className="h-3 w-3" />
                      {typeof selectedItem.rating === 'number' 
                        ? selectedItem.rating.toFixed(1) 
                        : selectedItem.rating}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/80 line-clamp-2 md:line-clamp-3">
                  {selectedItem.summary || "Đang cập nhật thông tin phim..."}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1"
                    asChild
                  >
                    <Link href={`/watch/${String(selectedItem.id)}`}>
                      <Play className="h-3 w-3" />
                      Xem ngay
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 bg-white/10 hover:bg-white/20 text-sm text-white"
                    asChild
                  >
                    <Link href={generateMovieUrl(String(selectedItem.id), selectedItem.title)}>
                      <Info className="h-3 w-3" />
                      Chi tiết
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Thumbnail Navigation - Desktop only */}
        {showThumbnails && (
          <>
            {/* Desktop thumbnails */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-8 hidden md:block">
              <div className="flex justify-center">
                <div className="inline-flex p-2 rounded-xl space-x-6 shadow-xl">
                  {items.slice(0, visibleThumbs).map((item, index) => {
                    const thumbInfo = getImageInfo(item.posterUrl, item.id, 'poster');
                    const shouldShowSkeleton = thumbInfo.shouldShowSkeleton || failedImages.has(thumbInfo.url);
                    
                    return (
                      <div
                        key={item.id || index}
                        className={cn(
                          'relative rounded-md overflow-hidden transition-all duration-200 cursor-pointer h-27 w-20',
                          index === selectedIndex 
                            ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-gray-950 z-10 scale-110' 
                            : 'opacity-70 hover:opacity-100'
                        )}
                        onClick={() => handleItemSelect(index)}
                      >
                        {shouldShowSkeleton ? (
                          <Skeleton className="w-full h-full" />
                        ) : (
                          <img
                            src={thumbInfo.url}
                            alt={item?.title || `Movie ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log('FeaturedContentSwitcher - Thumbnail image load error for URL:', thumbInfo.url);
                              handleImageError(thumbInfo.url);
                            }}
                          />
                        )}
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 py-1 px-1.5 text-[10px] font-medium truncate",
                          index === selectedIndex 
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-900/80 text-gray-300'
                        )}>
                          {item.title || `Movie ${index + 1}`}
                        </div>
                        {index === selectedIndex && (
                          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                            <div className="rounded-full bg-indigo-600/80 p-1">
                              <Play className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Mobile dots navigation */}
            <div className="md:hidden flex items-center justify-center mt-8">
              <div className="inline-flex bg-gray-900/90 backdrop-blur-md px-3 py-2 rounded-full space-x-2">
                {items.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleItemSelect(index)}
                    className={cn(
                      'rounded-full transition-all',
                      index === selectedIndex 
                        ? 'bg-indigo-600 w-3 h-3' 
                        : 'bg-gray-700 w-2 h-2 hover:bg-gray-600'
                    )}
                    aria-label={`Go to item ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Progress Indicator for non-thumbnail mode */}
        {showProgress && !showThumbnails && (
          <div className="flex items-center justify-center mt-8 gap-1">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => handleItemSelect(index)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  index === selectedIndex ? 'bg-indigo-600 w-3' : 'bg-gray-700 hover:bg-gray-600'
                )}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
  
  // Wrap in container if needed
  if (wrapContainer) {
    return (
      <section className="bg-gray-950">
        <div className="w-full">
          {content}
        </div>
      </section>
    )
  }
  
  return content
}

export default FeaturedContentSwitcher