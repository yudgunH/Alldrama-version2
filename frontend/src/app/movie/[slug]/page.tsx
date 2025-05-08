'use client';

import { Suspense } from 'react';
import MovieDetail from '@/components/features/movie/MovieDetail';
import { useMovies } from '@/hooks/api/useMovies';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useParams } from 'next/navigation';
import { Movie } from '@/types';
import { getIdFromSlug } from '@/utils/url';
import { useAuth } from '@/hooks/api/useAuth';
import { useFavorites } from '@/hooks/api/useFavorites';

export default function MovieDetailPage() {
  // Get slug from route params
  const params = useParams();
  const slug = params?.slug as string || '';
  
  // State for the component
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movieId, setMovieId] = useState<string | number | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  
  // Get the getMovie function from the useMovies hook
  const { getMovie } = useMovies();
  
  // Get auth and favorites functionality
  const { isAuthenticated } = useAuth();
  const { refreshFavorites } = useFavorites();
  
  // Refresh favorites list when page loads (if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    }
  }, [isAuthenticated, refreshFavorites]);
  
  // Extract the movie ID from the slug and fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setIsLoading(true);
        setError(null);
    
        // Extract ID from the slug using the utility function
        const id = getIdFromSlug(slug);
    
    if (!id || isNaN(Number(id))) {
      console.error("Could not extract numeric ID from slug:", slug);
      setError("Không tìm thấy phim");
          return;
        }
        
        // Convert extracted ID to number for API calls
        const numericId = Number(id);
        console.log(`Extracted movie ID ${numericId} from slug: ${slug}`);
        
        // Set the movie ID
        setMovieId(numericId);
        
        // Fetch the movie data
        const movieData = await getMovie(numericId);
        
        if (!movieData) {
          setError("Không tìm thấy thông tin phim");
          return;
        }
        
        // Set the movie data
        setMovie(movieData);
      } catch (err) {
        console.error("Error fetching movie:", err);
        setError("Đã xảy ra lỗi khi tải thông tin phim");
      } finally {
    setIsLoading(false);
      }
    };
    
    if (slug) {
      fetchMovieData();
    }
  }, [slug, getMovie]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-[70vh] bg-gray-800/50 animate-pulse flex items-center justify-center">
        <Skeleton className="w-3/4 h-[80%] max-w-7xl mx-auto rounded-xl" />
      </div>
    );
  }
  
  // Show error state
  if (error || !movieId || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-white">
          <AlertDescription className="text-center">
            <h1 className="text-2xl text-white font-bold">Không tìm thấy phim</h1>
            <p className="text-gray-400 mt-4">
              {error || "Phim bạn đang tìm không tồn tại hoặc đã bị xóa."}
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div>
      <Suspense fallback={
        <div className="h-[70vh] bg-gray-800/50 animate-pulse flex items-center justify-center">
          <Skeleton className="w-3/4 h-[80%] max-w-7xl mx-auto rounded-xl" />
        </div>
      }>
        <MovieDetail movieId={movieId} initialData={movie} />
      </Suspense>
    </div>
  );
}