'use client'

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MovieCard from '@/components/features/movie/MovieCard';
import { Movie, Genre } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowUpDown, X, Star, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { movieService, genreService } from '@/lib/api';
import { cacheManager } from '@/lib/cache/cacheManager';
import useSWR from 'swr';
import { useAuth } from '@/hooks/api/useAuth';

// Hàm tiện ích debounce để tránh gọi API liên tục
const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

// Loading component for Suspense
const SearchPageLoader = () => {
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div className="h-10 w-48 bg-gray-800 rounded-lg animate-pulse mb-4 md:mb-0"></div>
            <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="mb-6">
            <div className="bg-gray-800 rounded-lg h-16 w-full animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component that uses useSearchParams
const SearchContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // Lấy các tham số tìm kiếm từ URL
  const initialQuery = searchParams.get('q') || '';
  const initialGenre = searchParams.get('genre') || '';
  const initialYear = searchParams.get('year') || '';
  const initialSort = searchParams.get('sort') || '';
  
  // Trạng thái nội bộ của form
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [filtersVisible, setFiltersVisible] = useState(true);
  
  // Search results state
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Fetch genres with SWR and cache - chỉ fetch một lần
  const { data: genres } = useSWR(
    'genres-list',
    async () => {
      // Check cache first
      const cached = cacheManager.getGenres();
      if (cached) {
        console.log('Using cached genres data');
        return cached;
      }
      
      // Fetch from API if not cached
      console.log('Fetching genres data from API');
      const genresData = await genreService.getAllGenres();
      
      // Cache the result for 30 minutes
      cacheManager.setGenres(genresData, 30 * 60 * 1000);
      
      return genresData;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1800000, // 30 minutes
    }
  );

  // Generate years list
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 1990;
    const yearsList = [];
    for (let year = currentYear; year >= startYear; year--) {
      yearsList.push(year);
    }
    return yearsList;
  }, []);
  
  // Đồng bộ state với URL params khi trang load
  useEffect(() => {
    setSearchQuery(initialQuery);
    setSelectedGenre(initialGenre);
    setSelectedYear(initialYear);
    setSortBy(initialSort);
    
    // Chỉ auto-search nếu có params từ URL (user navigate trực tiếp với params)
    if (initialQuery || initialGenre || initialYear || initialSort) {
      performSearch(initialQuery, initialGenre, initialYear, initialSort);
    }
  }, []);
  
  // Hiển thị bộ lọc trên mobile nếu đã có filter
  useEffect(() => {
    if (initialGenre || initialYear || initialSort) {
      setFiltersVisible(true);
    }
  }, [initialGenre, initialYear, initialSort]);
  
  // Perform search function
  const performSearch = useCallback(async (query = searchQuery, genre = selectedGenre, year = selectedYear, sort = sortBy) => {
    // Generate search key for caching
      const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (genre) params.set('genre', genre);
    if (year) params.set('year', year);
    if (sort) params.set('sort', sort);
    const searchKey = `search-${params.toString()}`;
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      // Check cache first
      const cached = cacheManager.getStats(searchKey);
      if (cached) {
        console.log(`Using cached search results for: ${searchKey}`);
        setSearchResults(cached);
        setLoading(false);
        return;
      }
      
      // Build search params cho API - sử dụng đúng tên parameter
      const apiParams: any = {};
      
      // Sử dụng 'q' thay vì 'query' để match với movieService.searchMovies
      if (query) apiParams.q = query;
      
      // Chuyển đổi genre name thành genre ID nếu có
      if (genre && genres && genres.length > 0) {
        const selectedGenreObj = genres.find((g: Genre) => g.name === genre);
        if (selectedGenreObj) {
          apiParams.genre = selectedGenreObj.id;
        } else {
          // Nếu không tìm thấy genre ID, vẫn truyền tên để API xử lý
          apiParams.genre = genre;
        }
      }
      
      if (year) apiParams.year = parseInt(year);
      
      // Sửa lại logic sorting để match với API
      if (sort) {
        const [field, order] = sort.split('-');
        apiParams.sort = field; // 'rating' hoặc 'views'
        apiParams.order = order?.toUpperCase() || 'DESC'; // 'ASC' hoặc 'DESC'
      }
      
      // Fetch from API
      console.log(`Fetching search results from API for: ${searchKey}`, apiParams);
      const results = await movieService.searchMovies(apiParams);
      
      // Cache the result for 5 minutes
      cacheManager.setStats(searchKey, results, 5 * 60 * 1000);
      
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre, selectedYear, sortBy, genres]);
  
  // Cập nhật URL và thực hiện tìm kiếm
  const updateSearchParamsAndSearch = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (selectedYear) params.set('year', selectedYear);
    if (sortBy) params.set('sort', sortBy);
    
    router.push(`/search?${params.toString()}`);
    performSearch();
  }, [searchQuery, selectedGenre, selectedYear, sortBy, router, performSearch]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParamsAndSearch();
  };
  
  const handleReset = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setSortBy('');
    setSearchResults(null);
    setHasSearched(false);
    router.push('/search');
  };
  
  // Xóa một bộ lọc đã chọn
  const removeFilter = (type: 'query' | 'genre' | 'year' | 'sort') => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === 'query') {
      params.delete('q');
      setSearchQuery('');
    } else if (type === 'genre') {
      params.delete('genre');
      setSelectedGenre('');
    } else if (type === 'year') {
      params.delete('year');
      setSelectedYear('');
    } else if (type === 'sort') {
      params.delete('sort');
      setSortBy('');
    }
    
    router.push(`/search?${params.toString()}`);
    // Perform search with updated filters
    setTimeout(() => {
      if (type === 'query') {
        performSearch('', selectedGenre, selectedYear, sortBy);
      } else if (type === 'genre') {
        performSearch(searchQuery, '', selectedYear, sortBy);
      } else if (type === 'year') {
        performSearch(searchQuery, selectedGenre, '', sortBy);
      } else if (type === 'sort') {
        performSearch(searchQuery, selectedGenre, selectedYear, '');
    }
    }, 0);
  };
  
  // Chọn thể loại
  const handleGenreChange = (genreName: string) => {
    if (genreName === selectedGenre) return;
    
    setSelectedGenre(genreName);
    
    // Cập nhật URL và search ngay lập tức
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (genreName) params.set('genre', genreName);
    if (selectedYear) params.set('year', selectedYear);
    if (sortBy) params.set('sort', sortBy);
    
    router.push(`/search?${params.toString()}`);
    performSearch(searchQuery, genreName, selectedYear, sortBy);
  };

  // Extract data from search results
  const movies = searchResults?.movies || [];
  const total = searchResults?.total || 0;
  
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
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
                  onClick={handleReset}
                >
                  <X className="h-4 w-4 mr-1" />
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>
          
          {/* Hiển thị bộ lọc đã áp dụng */}
          {(initialQuery || initialGenre || initialYear || initialSort) && (
            <div className="bg-gray-800/50 rounded-lg p-3 mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-300 mr-1">Đang lọc theo:</span>
              
              {initialQuery && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 cursor-pointer gap-1.5"
                  onClick={() => removeFilter('query')}
                >
                  Từ khóa: {initialQuery}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              
              {initialGenre && (
                <Badge 
                  variant="secondary" 
                  className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 cursor-pointer gap-1.5"
                  onClick={() => removeFilter('genre')}
                >
                  Thể loại: {initialGenre}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              
              {initialYear && (
                <Badge 
                  variant="secondary" 
                  className="bg-green-500/20 text-green-300 hover:bg-green-500/30 cursor-pointer gap-1.5"
                  onClick={() => removeFilter('year')}
                >
                  Năm: {initialYear}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              
              {initialSort && (
                <Badge 
                  variant="secondary" 
                  className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 cursor-pointer gap-1.5"
                  onClick={() => removeFilter('sort')}
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
                onClick={handleReset}
              >
                Xóa tất cả
              </Button>
            </div>
          )}
          
          {/* Form tìm kiếm */}
          <div className={`${filtersVisible ? 'block' : 'hidden md:block'} mb-8`}>
            <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="search-query" className="block text-sm font-medium text-gray-400 mb-1">
                    Từ khóa
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="search-query"
                      placeholder="Nhập tên phim, diễn viên..."
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
                    onChange={(e) => handleGenreChange(e.target.value)}
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
                    onChange={(e) => {
                      const newYear = e.target.value;
                      // Prevent duplicate requests if value didn't change
                      if (newYear === selectedYear) return;
                      
                      setSelectedYear(newYear);
                      // Debounce the update to avoid multiple API calls
                      updateSearchParamsAndSearch();
                    }}
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
                      variant={sortBy === 'rating-desc' ? 'default' : 'outline'}
                      size="sm"
                      className={sortBy === 'rating-desc' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                      onClick={() => {
                        const newSortBy = sortBy === 'rating-desc' ? '' : 'rating-desc';
                        setSortBy(newSortBy);
                        // Sử dụng debounce để tránh gọi API liên tục
                        setTimeout(() => {
                          updateSearchParamsAndSearch();
                        }, 0);
                      }}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5" />
                      Đánh giá cao nhất
                    </Button>
                    <Button
                      variant={sortBy === 'views-desc' ? 'default' : 'outline'}
                      size="sm"
                      className={sortBy === 'views-desc' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                      onClick={() => {
                        const newSortBy = sortBy === 'views-desc' ? '' : 'views-desc';
                        setSortBy(newSortBy);
                        // Sử dụng debounce để tránh gọi API liên tục
                        setTimeout(() => {
                          updateSearchParamsAndSearch();
                        }, 0);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Lượt xem nhiều
                    </Button>
                    
                    {sortBy && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-400"
                        onClick={() => {
                          setSortBy('');
                          // Sử dụng debounce để tránh gọi API liên tục
                          setTimeout(() => {
                            updateSearchParamsAndSearch();
                          }, 0);
                        }}
                      >
                        X
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    className="mr-2"
                  >
                    Đặt lại
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Tìm kiếm
                  </Button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Thể loại dạng grid - chỉ hiển thị khi không có filter nào */}
          {genres && genres.length > 0 && !initialGenre && !initialQuery && !initialYear && !initialSort && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-white mb-4">Tìm kiếm theo thể loại</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {genres.map((genre: Genre) => (
                  <Button
                    key={genre.id}
                    variant="outline"
                    size="sm"
                    className="justify-center text-gray-300 hover:text-white hover:bg-amber-600/20 hover:border-amber-500/50 border-gray-600 bg-gray-800/50 py-3 h-auto transition-all duration-200"
                    onClick={() => handleGenreChange(genre.name)}
                  >
                    <span className="text-center">{genre.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Kết quả tìm kiếm */}
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
                  onClick={() => performSearch()}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Thử lại
                </Button>
              </div>
            ) : movies.length > 0 ? (
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
            ) : (
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
          
          {/* Hiển thị giải thích sắp xếp nếu có */}
          {sortBy && movies.length > 0 && (
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
        </div>
      </div>
    </div>
  );
};

// Main component with Suspense boundary
const SearchPage = () => {
  return (
    <Suspense fallback={<SearchPageLoader />}>
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;
