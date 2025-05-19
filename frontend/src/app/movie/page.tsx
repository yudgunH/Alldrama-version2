'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types/movie';
import { Genre } from '@/types/genre';
import MovieGrid from '@/components/features/movie/MovieGrid';
import { Badge } from '@/components/ui/badge';
import { useMovies } from '@/hooks/api/useMovies';
import { useGenres } from '@/hooks/api/useGenres';
import { useRouter } from 'next/navigation';

interface ProcessedMovie extends Movie {
  type: 'movie' | 'series';
}

export default function MovieListPage() {
  const router = useRouter();
  const [activeGenre, setActiveGenre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use the movies hook
  const { 
    movies, 
    loading: isLoading, 
    pagination,
    searchMovies,
  } = useMovies({ limit: 20 });

  const {
    getAllGenres,
  } = useGenres();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  // State for filtered movies
  const [allMovies, setAllMovies] = useState<ProcessedMovie[]>([]);

  // Fetch genres when component mounts
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        setGenresLoading(true);
        const genreData = await getAllGenres();
        if (genreData) {
          setGenres(genreData);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setGenresLoading(false);
      }
    };
    
    fetchGenres();
  }, [getAllGenres]);

  // Fetch movies when filters change
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        await searchMovies({
          page: currentPage,
          limit: 20,
          genre: activeGenre !== 'all' ? Number(activeGenre) : undefined,
          sort: 'views',
          order: 'DESC'
        });
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    };

    fetchMovies();
  }, [activeGenre, currentPage, searchMovies]);

  // Handle genre change
  const handleGenreChange = (genre: string) => {
    if (genre === activeGenre) return;
    router.push(`/search?genre=${encodeURIComponent(genre)}`);
  };
  
  // Process movies with type info
  useEffect(() => {
    if (movies) {
      const processedMovies = movies.map(movie => ({
        ...movie,
        type: movie.totalEpisodes > 0 ? 'series' : 'movie'
      })) as ProcessedMovie[];
      
      setAllMovies(processedMovies);
    }
  }, [movies]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Khám phá phim</h1>
              <p className="text-gray-400 text-lg max-w-2xl">Thư viện phim đa dạng với nhiều thể loại hấp dẫn, cập nhật liên tục những bộ phim mới nhất.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar */}
        <div className="mb-8 bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 sticky top-0 z-20">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h3 className="text-white font-medium">Thể loại phim</h3>
            </div>
            
            {/* Genre Tags */}
            <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
              <div className="flex flex-nowrap md:flex-wrap gap-2 min-w-max md:min-w-0">
                <Badge 
                  variant={activeGenre === 'all' ? "default" : "outline"}
                  className={`px-4 py-2 rounded-full cursor-pointer text-sm font-normal whitespace-nowrap ${
                    activeGenre === 'all' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                  }`}
                  onClick={() => handleGenreChange('all')}
                >
                  Tất cả
                </Badge>
                
                {genresLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-9 bg-gray-800 rounded-full w-20 animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  genres.map((genre) => (
                    <Badge 
                      key={genre.id}
                      variant={activeGenre === genre.name ? "default" : "outline"}
                      className={`px-4 py-2 rounded-full cursor-pointer text-sm font-normal whitespace-nowrap ${
                        activeGenre === genre.name 
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                      }`}
                      onClick={() => handleGenreChange(genre.name)}
                    >
                      {genre.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Movie Grid */}
        <div className="grid grid-cols-1 gap-8">
          <MovieGrid
            isLoading={isLoading}
            movies={allMovies}
            showPagination={true}
            totalPages={pagination?.totalPages || 1}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}