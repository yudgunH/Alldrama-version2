'use client'

import Link from "next/link"
import Image from "next/image"
import { Star, Play, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { generateMovieUrl } from "@/utils/url"
import { Movie } from "@/types"
import MoviePopover from "./MoviePopover"
import { Skeleton } from "@/components/ui/skeleton"

interface TopMoviesSectionProps {
  movies?: Movie[]
  title?: string
  limit?: number
  isLoading?: boolean
}

const TopMoviesSection = ({ 
  movies = [], 
  title = "Top 10 Phim Xem Nhiều", 
  limit = 10,
  isLoading = false
}: TopMoviesSectionProps) => {
  const topMovies = movies?.slice(0, limit) || []
  const sliderRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  const handlePrevClick = () => {
    if (sliderRef.current) {
      const containerWidth = sliderRef.current.clientWidth
      const newPosition = Math.max(0, scrollPosition - containerWidth)
      sliderRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }
  
  const handleNextClick = () => {
    if (sliderRef.current) {
      const containerWidth = sliderRef.current.clientWidth
      const scrollWidth = sliderRef.current.scrollWidth
      const newPosition = Math.min(scrollWidth - containerWidth, scrollPosition + containerWidth)
      sliderRef.current.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  // Hiển thị skeleton khi đang loading hoặc không có dữ liệu
  if (isLoading || topMovies.length === 0) {
    return (
      <div className="py-10 bg-gradient-to-b from-[#0F111A] to-[#151823]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-5">
            {/* Tiêu đề không chứa bất kỳ phần tử con nào khác ngoài text */}
            <div className="flex items-start">
              <h3 className="text-2xl md:text-3xl font-bold">
                <span className="bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">{title}</span>
              </h3>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-hidden pb-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="relative flex-shrink-0 w-[calc(100%/5-12px)] min-w-[190px] py-4">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="py-10 bg-gradient-to-b from-[#0F111A] to-[#151823]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-5">
          {/* Tiêu đề Section */}
          <div className="flex items-start">
            <h3 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">{title}</span>
            </h3>
          </div>
          
          {/* Nút điều hướng */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevClick}
              className="p-2 rounded-full bg-gray-800/70 hover:bg-amber-600/80 text-white transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={handleNextClick}
              className="p-2 rounded-full bg-gray-800/70 hover:bg-amber-600/80 text-white transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        
        <div className="relative overflow-hidden">
          <div 
            ref={sliderRef}
            className="flex gap-3 overflow-x-scroll no-scrollbar scroll-smooth pb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topMovies.map((movie, index) => (
              <div
                key={movie.id}
                className="relative flex-shrink-0 w-[calc(100%/5-12px)] min-w-[190px] py-4"
              >
                <MoviePopover 
                  movie={movie} 
                  size="sm"
                  variant="simple"
                  showPopover={false}
                  trigger={
                    <div className="relative transition-all duration-300 z-5">
                      <Link href={generateMovieUrl(movie.id, movie.title)}>
                        {/* Card thiết kế với hiệu ứng cắt chéo mạnh hơn */}
                        <div 
                          className="relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 bg-[#1A1C25] group hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)] hover:scale-[1.035] transform-gpu"
                          style={{
                            borderRadius: '10px 10px 10px 10px',
                            clipPath: index % 2 === 0 
                              ? 'polygon(0 0, 100% 25px, 100% 100%, 0 100%)' // Card lẻ: cắt chéo nhiều hơn từ trái sang phải
                              : 'polygon(0 25px, 100% 0, 100% 100%, 0 100%)' // Card chẵn: cắt chéo nhiều hơn từ phải sang trái
                          }}
                        >
                          {/* Poster Image */}
                          <div className="relative aspect-[2/3] w-full">
                            <Image 
                              src={"/images/test.jpg"} 
                              alt={movie.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                              priority={index < 5}
                            />
                            
                            {/* Overlay badges */}
                            <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                              <span className="bg-[#4B5563] text-white text-[9px] px-1 py-0.5 rounded-md font-medium">
                                PD.{movie.releaseYear ? movie.releaseYear.toString().substring(2) : 'NA'}
                              </span>
                              <span className="bg-[#22C55E] text-white text-[9px] px-1 py-0.5 rounded-md font-medium">
                                TM.{movie.releaseYear ? movie.releaseYear.toString().substring(2) : 'NA'}
                              </span>
                            </div>
                            
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0F111A] via-transparent to-transparent opacity-70"></div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-2.5 text-white">
                            <h3 className="font-bold text-sm line-clamp-1">{movie.title}</h3>
                            <p className="text-[10px] text-gray-400 line-clamp-1 mb-1">
                              {movie.summary ? movie.summary.substring(0, 50) + '...' : 'Đang cập nhật thông tin'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-[10px] text-gray-300 gap-2">
                                <span className="px-1 py-0.5 bg-gray-800 rounded-sm">
                                  T{movie.releaseYear ? movie.releaseYear.toString().substring(2) : 'NA'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-[#FFD95A]" fill="#FFD95A" />
                                  <span className="text-[#FFD95A] font-medium">
                                    {movie.rating 
                                      ? (typeof movie.rating === 'number' 
                                          ? movie.rating.toFixed(1) 
                                          : movie.rating)
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Số thứ tự phim được đặt bên dưới */}
                              <div>
                                <span style={{fontFamily: 'Georgia, serif'}} className="text-2xl font-extrabold text-[#FFD95A] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
                                  {index + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300 bg-black/30 transition-all">
                            <div className="p-2.5 rounded-full bg-[#22C55E] text-white transform scale-0 group-hover:scale-100 duration-300 shadow-lg">
                              <Play fill="white" size={20} />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopMoviesSection 