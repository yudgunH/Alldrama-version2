'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import SearchForm from '@/components/features/search/SearchForm'
import GenreGrid from '@/components/features/search/GenreGrid'
import SearchResults from '@/components/features/search/SearchResults'
import { useSearchLogic } from '@/hooks/search/useSearchLogic'

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
  )
}

// Main component that uses useSearchParams
const SearchContent = () => {
  const {
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
  } = useSearchLogic()
  
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Search Form with filters */}
          <SearchForm
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGenre={selectedGenre}
            setSelectedGenre={setSelectedGenre}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
            genres={genres}
            years={years}
            onSubmit={handleSubmit}
            onReset={handleReset}
            onRemoveFilter={removeFilter}
            onGenreChange={handleGenreChange}
            onYearChange={handleYearChange}
            onSortChange={handleSortChange}
            updateSearchParamsAndSearch={updateSearchParamsAndSearch}
            initialQuery={initialQuery}
            initialGenre={initialGenre}
            initialYear={initialYear}
            initialSort={initialSort}
          />
          
          {/* Genre Grid - only show when no active filters */}
          <GenreGrid
            genres={genres}
            onGenreChange={handleGenreChange}
            shouldShow={!initialGenre && !initialQuery && !initialYear && !initialSort}
          />
          
          {/* Search Results */}
          <SearchResults
            hasSearched={hasSearched}
            loading={loading}
            error={error}
            movies={movies}
            total={total}
            sortBy={sortBy}
            onRetry={() => performSearch()}
          />
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
const SearchPage = () => {
  return (
    <Suspense fallback={<SearchPageLoader />}>
      <SearchContent />
    </Suspense>
  )
}

export default SearchPage
