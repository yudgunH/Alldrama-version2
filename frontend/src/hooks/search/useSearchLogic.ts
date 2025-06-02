'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { movieService, genreService } from '@/lib/api'
import { cacheManager } from '@/lib/cache/cacheManager'
import useSWR from 'swr'
import { Genre, Movie } from '@/types'

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>()

export function useSearchLogic() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get search parameters from URL
  const initialQuery = searchParams.get('q') || ''
  const initialGenre = searchParams.get('genre') || ''
  const initialYear = searchParams.get('year') || ''
  const initialSort = searchParams.get('sort') || ''
  
  // Internal form state
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre)
  const [selectedYear, setSelectedYear] = useState<string>(initialYear)
  const [sortBy, setSortBy] = useState<string>(initialSort)
  const [filtersVisible, setFiltersVisible] = useState(true)
  
  // Search results state
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Fetch genres with SWR and cache - optimized with longer cache
  const { data: genres } = useSWR(
    'genres-list',
    async () => {
      const cached = cacheManager.getGenres()
      if (cached) {
        return cached
      }
      
      const genresData = await genreService.getAllGenres()
      cacheManager.setGenres(genresData, 60 * 60 * 1000) // Cache for 1 hour
      return genresData
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // 1 hour
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  // Generate years list - memoized and from cached movies first
  const years = useMemo(() => {
    // First try to get years from cached movies
    const cachedMovies = cacheManager.getAllCachedMovies()
    
    if (cachedMovies.length > 0) {
      // Get years from cached movies
      const yearsFromCache = new Set(
        cachedMovies
          .map((movie: Movie) => movie.releaseYear)
          .filter(Boolean) as number[]
      )
      
      if (yearsFromCache.size > 0) {
        return Array.from(yearsFromCache).sort((a, b) => Number(b) - Number(a))
      }
    }
    
    // Fallback to generating years range (only if no cached movies)
    const currentYear = new Date().getFullYear()
    const startYear = 1990
    const yearsList = []
    for (let year = currentYear; year >= startYear; year--) {
      yearsList.push(year)
    }
    return yearsList
  }, [genres]) // Re-compute when genres change (indicates data has loaded)
  
  // Optimized cache key generation
  const generateCacheKey = useCallback((query: string, genre: string, year: string, sort: string) => {
    // Normalize parameters for better cache hits
    const normalizedQuery = query.toLowerCase().trim()
    const params = []
    
    if (normalizedQuery) params.push(`q:${normalizedQuery}`)
    if (genre) params.push(`g:${genre}`)
    if (year) params.push(`y:${year}`)
    if (sort) params.push(`s:${sort}`)
    
    return `search-v2:${params.join('|')}`
  }, [])
  
  // Enhanced search function with better cache utilization
  const performSearch = useCallback(async (
    query = searchQuery, 
    genre = selectedGenre, 
    year = selectedYear, 
    sort = sortBy,
    forceFromCache = false // New parameter to prioritize cache
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    const cacheKey = generateCacheKey(query, genre, year, sort)
    
    // Check for pending request (deduplication)
    if (pendingRequests.has(cacheKey)) {
      try {
        const result = await pendingRequests.get(cacheKey)
        setSearchResults(result)
        return
      } catch (error) {
        // Request was cancelled or failed, continue with new request
      }
    }
    
    setLoading(true)
    setError(null)
    setHasSearched(true)
    
    try {
      // Check cache first
      const cached = cacheManager.getStats(cacheKey)
      if (cached) {
        setSearchResults(cached)
        setLoading(false)
        return
      }
      
      // Enhanced cache check - always check discovered movies for any filters
      const cachedMovies = cacheManager.searchCachedMovies(query.trim(), genre, year)
      if (cachedMovies.length > 0 || forceFromCache) {
        // Sort cached movies if needed
        let sortedMovies = [...cachedMovies]
        if (sort) {
          const [field, order] = sort.split('-')
          if (field === 'rating') {
            sortedMovies.sort((a, b) => {
              const ratingA = typeof a.rating === 'number' ? a.rating : 0
              const ratingB = typeof b.rating === 'number' ? b.rating : 0
              return order === 'desc' ? ratingB - ratingA : ratingA - ratingB
            })
          } else if (field === 'views') {
            sortedMovies.sort((a, b) => {
              const viewsA = typeof a.views === 'number' ? a.views : 0
              const viewsB = typeof b.views === 'number' ? b.views : 0
              return order === 'desc' ? viewsB - viewsA : viewsA - viewsB
            })
          }
        }
        
        const cacheResult = {
          movies: sortedMovies,
          total: sortedMovies.length,
          fromCache: true
        }
        
        setSearchResults(cacheResult)
        setLoading(false)
        
        // Cache this result with the current cache key
        cacheManager.setStats(cacheKey, cacheResult, 10 * 60 * 1000)
        return
      }
      
      // Only call API if we have a query or it's a fresh search without cache
      if (!query.trim() && !genre && !year && cachedMovies.length === 0) {
        // For empty searches, return empty results instead of calling API
        const emptyResult = { movies: [], total: 0, fromCache: false }
        setSearchResults(emptyResult)
        setLoading(false)
        return
      }
      
      // Build optimized search params
      const apiParams: any = {
        limit: 20, // Increased limit for better UX
      }
      
      if (query.trim()) {
        apiParams.q = query.trim()
      }
      
      // Convert genre name to ID efficiently
      if (genre && genres?.length) {
        const selectedGenreObj = genres.find((g: Genre) => g.name === genre)
        apiParams.genre = selectedGenreObj?.id || genre
      }
      
      if (year) {
        apiParams.year = parseInt(year)
      }
      
      // Optimize sorting
      if (sort) {
        const [field, order] = sort.split('-')
        apiParams.sort = field
        apiParams.order = order?.toUpperCase() || 'DESC'
      }
      
      // Create and store the request promise
      const requestPromise = movieService.searchMovies(apiParams)
      pendingRequests.set(cacheKey, requestPromise)
      
      const results = await requestPromise
      
      // Remove from pending requests
      pendingRequests.delete(cacheKey)
      
      // Add discovered movies to cache
      if (results?.movies?.length > 0) {
        cacheManager.addDiscoveredMovies(results.movies)
      }
      
      // Cache with intelligent TTL
      const cacheTTL = query || genre || year ? 10 * 60 * 1000 : 30 * 60 * 1000
      cacheManager.setStats(cacheKey, results, cacheTTL)
      
      setSearchResults(results)
    } catch (err: any) {
      pendingRequests.delete(cacheKey)
      
      if (err.name === 'AbortError') {
        return // Request was cancelled, don't set error
      }
      
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedGenre, selectedYear, sortBy, genres, generateCacheKey])
  
  // Sync state with URL params when page loads
  useEffect(() => {
    setSearchQuery(initialQuery)
    setSelectedGenre(initialGenre)
    setSelectedYear(initialYear)
    setSortBy(initialSort)
    
    // Auto-search if there are params from URL (when user navigates directly with params)
    if (initialQuery || initialGenre || initialYear || initialSort) {
      performSearch(initialQuery, initialGenre, initialYear, initialSort)
    }
  }, []) // Remove performSearch from deps to avoid infinite loop
  
  // Show filters on mobile if filters are active
  useEffect(() => {
    if (initialGenre || initialYear || initialSort) {
      setFiltersVisible(true)
    }
  }, [initialGenre, initialYear, initialSort])
  
  // Update URL and perform search - only triggered by form submit or filter changes
  const updateSearchParamsAndSearch = useCallback(() => {
    const params = new URLSearchParams()
    
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedGenre) params.set('genre', selectedGenre)
    if (selectedYear) params.set('year', selectedYear)
    if (sortBy) params.set('sort', sortBy)
    
    const newUrl = `/search?${params.toString()}`
    
    // Avoid unnecessary navigation
    if (newUrl !== window.location.pathname + window.location.search) {
      router.push(newUrl)
    }
    
    performSearch()
  }, [searchQuery, selectedGenre, selectedYear, sortBy, router, performSearch])
  
  // Handle form submission (Enter key or Search button)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateSearchParamsAndSearch()
  }
  
  const handleReset = () => {
    // Cancel ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedYear('')
    setSortBy('')
    setSearchResults(null)
    setHasSearched(false)
    router.push('/search')
  }
  
  // Remove a specific filter with optimization
  const removeFilter = (type: 'query' | 'genre' | 'year' | 'sort') => {
    const params = new URLSearchParams(searchParams.toString())
    
    let newQuery = searchQuery
    let newGenre = selectedGenre
    let newYear = selectedYear
    let newSort = sortBy
    
    if (type === 'query') {
      params.delete('q')
      newQuery = ''
      setSearchQuery('')
    } else if (type === 'genre') {
      params.delete('genre')
      newGenre = ''
      setSelectedGenre('')
    } else if (type === 'year') {
      params.delete('year')
      newYear = ''
      setSelectedYear('')
    } else if (type === 'sort') {
      params.delete('sort')
      newSort = ''
      setSortBy('')
    }
    
    router.push(`/search?${params.toString()}`)
    
    // Perform search immediately when removing filters
    requestAnimationFrame(() => {
      performSearch(newQuery, newGenre, newYear, newSort)
    })
  }
  
  // Handle genre change - use cache first
  const handleGenreChange = (genreName: string) => {
    if (genreName === selectedGenre) return
    
    setSelectedGenre(genreName)
    
    // Build new URL
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (genreName) params.set('genre', genreName)
    if (selectedYear) params.set('year', selectedYear)
    if (sortBy) params.set('sort', sortBy)
    
    router.push(`/search?${params.toString()}`)
    
    // Search with cache priority
    requestAnimationFrame(() => {
      performSearch(searchQuery, genreName, selectedYear, sortBy, true) // Force cache check
    })
  }

  // Handle year change - use cache first
  const handleYearChange = (year: string) => {
    if (year === selectedYear) return
    
    setSelectedYear(year)
    
    // Build new URL
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedGenre) params.set('genre', selectedGenre)
    if (year) params.set('year', year)
    if (sortBy) params.set('sort', sortBy)
    
    router.push(`/search?${params.toString()}`)
    
    // Search with cache priority
    requestAnimationFrame(() => {
      performSearch(searchQuery, selectedGenre, year, sortBy, true) // Force cache check
    })
  }

  // Handle sort change - use cache first
  const handleSortChange = (sort: string) => {
    if (sort === sortBy) return
    
    setSortBy(sort)
    
    // Build new URL
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (selectedGenre) params.set('genre', selectedGenre)
    if (selectedYear) params.set('year', selectedYear)
    if (sort) params.set('sort', sort)
    
    router.push(`/search?${params.toString()}`)
    
    // Search with cache priority (sorting can always be done from cache)
    requestAnimationFrame(() => {
      performSearch(searchQuery, selectedGenre, selectedYear, sort, true) // Force cache check
    })
  }

  // Extract data from search results
  const movies = searchResults?.movies || []
  const total = searchResults?.total || searchResults?.pagination?.total || 0
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  return {
    // State
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
    
    // Data
    genres,
    years,
    movies,
    total,
    loading,
    error,
    hasSearched,
    
    // URL params
    initialQuery,
    initialGenre,
    initialYear,
    initialSort,
    
    // Actions
    handleSubmit,
    handleReset,
    removeFilter,
    handleGenreChange,
    handleYearChange,
    handleSortChange,
    updateSearchParamsAndSearch,
    performSearch
  }
} 