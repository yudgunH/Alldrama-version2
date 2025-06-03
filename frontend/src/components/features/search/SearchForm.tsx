'use client'

import React from 'react'
import { Search, Filter, Star, Eye, X, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Genre } from '@/types'

interface SearchFormProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedGenre: string
  setSelectedGenre: (genre: string) => void
  selectedYear: string
  setSelectedYear: (year: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  filtersVisible: boolean
  setFiltersVisible: (visible: boolean) => void
  genres: Genre[] | undefined
  years: number[]
  onSubmit: (e: React.FormEvent) => void
  onReset: () => void
  onRemoveFilter: (type: 'query' | 'genre' | 'year' | 'sort') => void
  onGenreChange: (genreName: string) => void
  onYearChange: (year: string) => void
  onSortChange: (sort: string) => void
  updateSearchParamsAndSearch: () => void
  // Current filter values for display
  initialQuery: string
  initialGenre: string
  initialYear: string
  initialSort: string
}

export default function SearchForm({
  searchQuery,
  setSearchQuery,
  selectedGenre,
  setSelectedGenre,
  selectedYear,
  setSelectedYear,
  sortBy,
  setSortBy,
  filtersVisible,
  setFiltersVisible,
  genres,
  years,
  onSubmit,
  onReset,
  onRemoveFilter,
  onGenreChange,
  onYearChange,
  onSortChange,
  updateSearchParamsAndSearch,
  initialQuery,
  initialGenre,
  initialYear,
  initialSort
}: SearchFormProps) {
  return (
    <>
      {/* Header with mobile filter toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Tìm kiếm phim</h1>
        
        {/* Mobile filter toggle */}
        <div className="flex gap-2 md:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1.5"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="h-4 w-4" />
            Bộ lọc {(initialGenre || initialYear || initialSort) ? '(Đang sử dụng)' : ''}
          </Button>
          
          {(initialGenre || initialYear || initialSort) && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-400 border-red-400/20 hover:bg-red-400/10"
              onClick={onReset}
            >
              <X className="h-4 w-4 mr-1" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters display */}
      {(initialQuery || initialGenre || initialYear || initialSort) && (
        <div className="bg-gray-800/50 rounded-lg p-3 mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-300 mr-1">Đang lọc theo:</span>
          
          {initialQuery && (
            <Badge 
              variant="secondary" 
              className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 cursor-pointer gap-1.5"
              onClick={() => onRemoveFilter('query')}
            >
              Từ khóa: {initialQuery}
              <X className="h-3 w-3" />
            </Badge>
          )}
          
          {initialGenre && (
            <Badge 
              variant="secondary" 
              className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer gap-1.5"
              onClick={() => onRemoveFilter('genre')}
            >
              Thể loại: {initialGenre}
              <X className="h-3 w-3" />
            </Badge>
          )}
          
          {initialYear && (
            <Badge 
              variant="secondary" 
              className="bg-green-500/20 text-green-300 hover:bg-green-500/30 cursor-pointer gap-1.5"
              onClick={() => onRemoveFilter('year')}
            >
              Năm: {initialYear}
              <X className="h-3 w-3" />
            </Badge>
          )}
          
          {initialSort && (
            <Badge 
              variant="secondary" 
              className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 cursor-pointer gap-1.5"
              onClick={() => onRemoveFilter('sort')}
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              {sortBy === 'rating-desc' ? 'Đánh giá cao nhất' : 'Lượt xem nhiều nhất'}
              <X className="h-3 w-3" />
            </Badge>
          )}
          
          <Button 
            variant="link" 
            size="sm" 
            className="text-gray-400 hover:text-gray-300 p-0 h-auto text-xs ml-auto hidden md:inline-flex"
            onClick={onReset}
          >
            Xóa tất cả
          </Button>
        </div>
      )}
      
      {/* Search form */}
      <div className={`${filtersVisible ? 'block' : 'hidden md:block'} mb-8`}>
        <form onSubmit={onSubmit} className="bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search-query" className="block text-sm font-medium text-gray-400 mb-1">
                Từ khóa
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search-query"
                  placeholder="Nhập tên phim, diễn viên... (ấn Enter để tìm kiếm)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-400 mb-1">
                Thể loại
              </label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={(e) => onGenreChange(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Tất cả thể loại</option>
                {genres && genres.length > 0 ? (
                  genres.map((genre: Genre) => (
                    <option key={genre.id} value={genre.name}>
                      {genre.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Đang tải danh sách thể loại...</option>
                )}
              </select>
            </div>
            
            <div>
              <label htmlFor="year-filter" className="block text-sm font-medium text-gray-400 mb-1">
                Năm phát hành
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Tất cả các năm</option>
                {years.map((year: number) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap justify-between items-center">
            <div>
              <label htmlFor="sort-by" className="block text-sm font-medium text-gray-400 mb-1">
                Sắp xếp theo
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={sortBy === 'rating-desc' ? 'default' : 'outline'}
                  size="sm"
                  className={sortBy === 'rating-desc' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  onClick={() => onSortChange(sortBy === 'rating-desc' ? '' : 'rating-desc')}
                >
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  Đánh giá cao nhất
                </Button>
                <Button
                  type="button"
                  variant={sortBy === 'views-desc' ? 'default' : 'outline'}
                  size="sm"
                  className={sortBy === 'views-desc' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                  onClick={() => onSortChange(sortBy === 'views-desc' ? '' : 'views-desc')}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Lượt xem nhiều
                </Button>
                
                {sortBy && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-400"
                    onClick={() => onSortChange('')}
                  >
                    X
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-end">
              <Button
                type="button"
                onClick={onReset}
                variant="outline"
                className="mr-2 h-10"
              >
                Đặt lại
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 h-10"
              >
                <Search className="h-4 w-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
} 