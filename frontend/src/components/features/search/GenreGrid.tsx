'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Genre } from '@/types'
import { cacheManager } from '@/lib/cache/cacheManager'

interface GenreGridProps {
  genres: Genre[] | undefined
  onGenreChange: (genreName: string) => void
  shouldShow: boolean
}

export default function GenreGrid({ genres, onGenreChange, shouldShow }: GenreGridProps) {
  if (!shouldShow || !genres || genres.length === 0) return null

  // Check if we have cached movies to improve genre selection
  const cacheStats = cacheManager.getCacheStats()
  const hasCachedMovies = cacheStats.totalCachedMovies > 0

  const handleGenreClick = (genreName: string) => {
    // When user clicks on genre from grid, prioritize cache usage
    onGenreChange(genreName)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-white">Tìm kiếm theo thể loại</h2>
        {/* {hasCachedMovies && (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {cacheStats.totalCachedMovies} phim đã cache
          </span>
        )} */}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {genres.map((genre: Genre) => {
          // Check if this genre has movies in cache
          const cachedForGenre = cacheManager.searchCachedMovies('', genre.name, '')
          const hasMoviesInCache = cachedForGenre.length > 0

          return (
            <Button
              key={genre.id}
              variant="outline"
              size="sm"
              className={`
                text-center p-3 h-auto min-h-[48px] text-sm font-medium 
                border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white
                hover:border-gray-500 transition-all duration-200
                ${hasMoviesInCache ? 'ring-1 ring-blue-500/30 bg-blue-500/5' : ''}
              `}
              onClick={() => handleGenreClick(genre.name)}
            >
              <div className="flex flex-col items-center gap-1">
                <span>{genre.name}</span>
                {hasMoviesInCache && (
                  <span className="text-xs text-blue-400">
                    {cachedForGenre.length} phim
                  </span>
                )}
              </div>
            </Button>
          )
        })}
      </div>
      
      {hasCachedMovies && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          💡 Tìm kiếm sẽ nhanh hơn theo tag thể loại
        </div>
      )}
    </div>
  )
} 