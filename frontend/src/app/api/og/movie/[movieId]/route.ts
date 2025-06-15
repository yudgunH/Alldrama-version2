import { NextRequest, NextResponse } from 'next/server'
import { serverMovieService } from '@/lib/api/services/movieService.server'
import { getSafePosterUrl, getSafeBackdropUrl } from '@/utils/image.server'

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

    // Get the best image for sharing
    const backdropUrl = getSafeBackdropUrl(movie.backdropUrl, movie.posterUrl, movie.id)
    const posterUrl = getSafePosterUrl(movie.posterUrl, movie.id)
    
    // Prefer backdrop over poster for better social media preview
    const imageUrl = backdropUrl !== '/placeholder.svg' ? backdropUrl : posterUrl
    
    // If it's a relative URL, make it absolute
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}${imageUrl}`

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
      genres: movie.genres?.map((g: any) => typeof g === 'string' ? g : g.name) || []
    }

    // Set cache headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour cache
        'Content-Type': 'application/json',
      },
    })
    
  } catch (error) {
    console.error('Error generating OG data for movie:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 