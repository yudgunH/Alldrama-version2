import { NextRequest, NextResponse } from 'next/server'
import { serverMovieService } from '@/lib/api/services/movieService.server'
import { getSafePosterUrl, getSafeBackdropUrl, getPosterUrlsWithFallback } from '@/utils/image.server'

/**
 * Check if image URL exists and return the first working one
 */
async function getWorkingImageUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        return url;
      }
    } catch (error) {
      // Continue to next URL
      continue;
    }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    const movieId = parseInt(params.movieId)
    
    if (isNaN(movieId)) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 })
    }

    // Fetch movie data
    const movie = await serverMovieService.getMovieById(movieId)
    
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    // Get multiple poster URLs to try (PNG first, then JPG, etc.)
    const posterUrls = getPosterUrlsWithFallback(movie.posterUrl, movie.id);
    
    // Find the first working image URL
    let workingImageUrl = await getWorkingImageUrl(posterUrls);
    
    // If no poster works, try fallback URLs
    if (!workingImageUrl) {
      const fallbackUrls = [
        `https://media.alldrama.tech/movies/${movieId}/poster.png`,
        `https://media.alldrama.tech/movies/${movieId}/poster.jpg`,
        `https://media.alldrama.tech/movies/${movieId}/poster.jpeg`,
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/logo-og.svg`
      ];
      
      workingImageUrl = await getWorkingImageUrl(fallbackUrls);
    }
    
    // Final fallback to default poster
    const imageUrl = workingImageUrl || `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
    
    // Ensure we always have an absolute URL for sharing
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}${imageUrl}`;

    // Return metadata for the movie
    const response = {
      title: movie.title,
      description: movie.summary || `Xem phim ${movie.title} trực tuyến tại AllDrama`,
      image: absoluteImageUrl,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/movie/${movieId}`,
      type: 'video.movie',
      site_name: 'AllDrama',
      rating: movie.rating,
      release_year: movie.releaseYear,
      duration: movie.duration,
      genres: movie.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || [],
      // Debug info for development
      debug: process.env.NODE_ENV === 'development' ? {
        posterUrlsChecked: posterUrls,
        workingImageUrl,
        finalImageUrl: absoluteImageUrl
      } : undefined
    }

    // Set cache headers for better performance
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error generating OG metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 