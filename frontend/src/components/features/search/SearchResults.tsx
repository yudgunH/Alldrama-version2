'use client'

import React from 'react'
import { Eye } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import MovieCard from '@/components/features/movie/MovieCard'
import { Movie } from '@/types'

interface SearchResultsProps {
  hasSearched: boolean
  loading: boolean
  error: any
  movies: Movie[]
  total: number
  sortBy: string
  onRetry: () => void
}

export default function SearchResults({
  hasSearched,
  loading,
  error,
  movies,
  total,
  sortBy,
  onRetry
}: SearchResultsProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          {!hasSearched ? (
            'Nhập từ khóa hoặc chọn bộ lọc để tìm kiếm'
          ) : loading ? (
            'Đang tìm kiếm...'
          ) : (
            `Kết quả tìm kiếm (${total})`
          )}
        </h2>
        
        {sortBy && hasSearched && (
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <span>Sắp xếp theo:</span>
            <span className="text-amber-400 font-medium">
              {sortBy === 'rating-desc' ? 'Đánh giá cao nhất' : 'Lượt xem nhiều nhất'}
            </span>
          </div>
        )}
      </div>
      
      <Separator className="mb-6 bg-gray-800" />
      
      {!hasSearched ? (
        // Welcome message khi chưa search
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-600 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <p className="text-gray-400 text-lg">Chào mừng bạn đến với trang tìm kiếm phim!</p>
          <p className="text-gray-500 mt-2">Nhập từ khóa, chọn thể loại, năm phát hành hoặc cách sắp xếp để bắt đầu tìm kiếm.</p>
        </div>
      ) : loading ? (
        // Skeleton loading
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-64 w-full rounded-lg bg-gray-800" />
              <Skeleton className="h-4 w-3/4 rounded bg-gray-800" />
              <Skeleton className="h-3 w-1/2 rounded bg-gray-800" />
            </div>
          ))}
        </div>
      ) : error ? (
        // Error message
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-400 text-lg">Có lỗi xảy ra khi tìm kiếm</p>
          <p className="text-red-300 mt-2">Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.</p>
          <Button 
            onClick={onRetry}
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Thử lại
          </Button>
        </div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {movies.map((movie: Movie) => (
              <div key={movie.id} className="transition-transform hover:-translate-y-1">
                <MovieCard 
                  movie={{
                    ...movie,
                    rating: movie.rating || 0,
                    views: movie.views || 0
                  }}
                  variant="grid"
                />
                
                {/* Hiển thị thêm thông tin lượt xem nếu đang sắp xếp theo lượt xem */}
                {sortBy === 'views-desc' && movie.views > 0 && (
                  <div className="mt-2 text-xs text-gray-400 flex items-center">
                    <Eye className="h-3 w-3 mr-1 inline text-blue-400" />
                    <span>{movie.views.toLocaleString()} lượt xem</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Hiển thị giải thích sắp xếp nếu có */}
          {sortBy && (
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                {sortBy === 'rating-desc' 
                  ? 'Phim được đánh giá cao nhất' 
                  : 'Phim có lượt xem nhiều nhất'}
              </h3>
              <p className="text-xs text-gray-400">
                {sortBy === 'rating-desc' 
                  ? 'Danh sách được sắp xếp theo điểm đánh giá của người dùng từ cao đến thấp.' 
                  : 'Danh sách được sắp xếp theo số lượt xem từ nhiều đến ít.'}
              </p>
            </div>
          )}
        </>
      ) : (
        // No results
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-600 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <p className="text-gray-400 text-lg">Không tìm thấy phim phù hợp với tìm kiếm của bạn.</p>
          <p className="text-gray-500 mt-2">Hãy thử với từ khóa khác hoặc thay đổi bộ lọc.</p>
        </div>
      )}
    </div>
  )
} 