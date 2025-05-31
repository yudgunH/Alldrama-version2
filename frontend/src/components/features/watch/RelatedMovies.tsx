import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import MoviePopover from "@/components/features/movie/MoviePopover";
import { generateMovieUrl } from "@/utils/url";
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { movieService } from '@/lib/api/services/movieService';
import { Movie } from '@/types';
import Link from 'next/link';
import { getSafePosterUrl } from '@/utils/image'

interface RelatedMoviesProps {
  movieId?: string;
  movie?: Movie;
  relatedMoviesData?: Movie[];
}

export default function RelatedMovies({ movieId, movie, relatedMoviesData }: RelatedMoviesProps) {
  const [relatedMovies, setRelatedMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!relatedMoviesData);
  
  // Define the common glass background style
  const GLASS_BG = "bg-gradient-to-br from-gray-800/70 to-gray-900/80 border-gray-700/60 backdrop-blur-sm shadow-lg";
  
  useEffect(() => {
    // If related movies data is provided directly, use it
    if (relatedMoviesData) {
      setRelatedMovies(relatedMoviesData);
      setIsLoading(false);
      return;
    }
    
    const fetchRelatedMovies = async () => {
      setIsLoading(true);
      try {
        // If complete movie object is provided, use it directly
        const currentMovie = movie || (movieId ? await movieService.getMovieById(movieId) : null);
        
        if (!currentMovie) {
          throw new Error('No movie data available');
        }
        
        const currentMovieId = String(currentMovie.id);
        
        if (currentMovie.genres && currentMovie.genres.length > 0) {
          // Get first genre ID to find related movies
          const genreId = typeof currentMovie.genres[0] === 'string'
            ? currentMovie.genres[0]
            : currentMovie.genres[0].id;
          
          // Fetch movies by genre
          const response = await movieService.getMoviesByGenre(Number(genreId), 5);
          
          // Filter out the current movie
          const filtered = response.movies.filter((m: any) => String(m.id) !== currentMovieId);
          setRelatedMovies(filtered);
        } else {
          // If no genres, get top rated movies instead
          const response = await movieService.getPopularMovies(6);
          const filtered = response.movies.filter((m: any) => String(m.id) !== currentMovieId);
          setRelatedMovies(filtered.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching related movies:', err);
        // Fallback to empty array
        setRelatedMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (movieId || movie) {
      fetchRelatedMovies();
    }
  }, [movieId, movie, relatedMoviesData]);
  
  if (isLoading) {
    return (
      <Card className={GLASS_BG}>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Phim liên quan</h2>
          <div className="space-y-3">
            {[1, 2, 3].map(index => (
              <div key={index} className="flex items-center p-2">
                <div className="flex-shrink-0 w-16 h-24 rounded bg-gray-700 animate-pulse" />
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-700 rounded animate-pulse mb-2 w-3/4" />
                  <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Thay vì return null khi không có phim liên quan, hiển thị top phim trending
  if (relatedMovies.length === 0) {
    const fetchPopularMovies = async () => {
      try {
        const response = await movieService.getPopularMovies(5);
        setRelatedMovies(response.movies);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Gọi hàm fetchPopularMovies khi không có related movies
    if (!isLoading) {
      fetchPopularMovies();
      setIsLoading(true); // Đặt loading lại để hiển thị skeleton
      return (
        <Card className={GLASS_BG}>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Đang tải phim khác...</h2>
            <div className="space-y-3">
              {[1, 2, 3].map(index => (
                <div key={index} className="flex items-center p-2">
                  <div className="flex-shrink-0 w-16 h-24 rounded bg-gray-700 animate-pulse" />
                  <div className="ml-3 flex-1">
                    <div className="h-4 bg-gray-700 rounded animate-pulse mb-2 w-3/4" />
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
  }
  
  return (
    <Card className={GLASS_BG}>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Phim liên quan</h2>
        <div className="space-y-3">
          {relatedMovies.map(relatedMovie => (
            <div key={relatedMovie.id}>
              <Link 
                href={generateMovieUrl(relatedMovie.id, relatedMovie.title)}
                className="flex items-center p-2 hover:bg-gray-700/50 rounded-md transition-colors"
              >
                <div className="flex-shrink-0 w-16 h-24 rounded overflow-hidden bg-gray-900">
                  <img 
                    src={getSafePosterUrl(relatedMovie.posterUrl, relatedMovie.id)}
                    alt={relatedMovie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <h3 className="text-white text-sm font-medium truncate">{relatedMovie.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {relatedMovie.releaseYear && (
                      <span className="text-xs text-gray-400">{relatedMovie.releaseYear}</span>
                    )}
                    <div className="flex items-center text-xs text-amber-400">
                      <Star className="h-3 w-3 mr-0.5" fill="currentColor" />
                      <span>{relatedMovie.rating || "8.5"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
