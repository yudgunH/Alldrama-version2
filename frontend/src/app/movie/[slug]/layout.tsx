import { Metadata } from 'next'
import { serverMovieService } from '@/lib/api/services/movieService.server'
import { getIdFromSlug } from '@/utils/url'
import { getSafePosterUrl, getSafeBackdropUrl } from '@/utils/image.server'

interface Props {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // Await params in Next.js 15
    const resolvedParams = await params
    
    // Extract movie ID from slug
    const movieId = getIdFromSlug(resolvedParams.slug)
    
    if (!movieId || isNaN(Number(movieId))) {
      return {
        title: 'Phim không tồn tại - AllDrama',
        description: 'Phim bạn đang tìm không tồn tại trên AllDrama',
      }
    }

    // Fetch movie data with fallback
    let movie;
    try {
      movie = await serverMovieService.getMovieById(Number(movieId))
    } catch (error) {
      console.warn('Failed to fetch movie for metadata, using fallback:', error)
      // Return basic metadata as fallback
      return {
        title: `Phim ${movieId} - AllDrama`,
        description: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu',
        openGraph: {
          title: `Phim ${movieId} - AllDrama`,
          description: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu',
          type: 'video.movie',
          siteName: 'AllDrama',
        },
        twitter: {
          card: 'summary_large_image',
          title: `Phim ${movieId} - AllDrama`,
          description: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu',
        },
      }
    }
    
    if (!movie) {
      console.warn(`⚠️ [generateMetadata] No movie data found for ID ${movieId}, using fallback metadata`);
      return {
        title: `Phim ${movieId} - AllDrama`,
        description: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu với chất lượng cao và đa dạng thể loại.',
        openGraph: {
          title: `Phim ${movieId} - AllDrama`,
          description: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu với chất lượng cao và đa dạng thể loại.',
          type: 'video.movie',
          siteName: 'AllDrama',
          images: [
            {
              url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/logo-seo.svg`,
              width: 1200,
              height: 630,
              alt: 'AllDrama',
            }
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `Phim ${movieId} - AllDrama`,
          description: 'Xem phim trực tuyến tại AllDrama - Nền tảng phim châu Á hàng đầu với chất lượng cao và đa dạng thể loại.',
          images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/logo-seo.svg`],
        },
      }
    }

    // Generate image URLs
    const posterUrl = getSafePosterUrl(movie.posterUrl, movie.id)
    const backdropUrl = getSafeBackdropUrl(movie.backdropUrl, movie.posterUrl, movie.id)
    
    // Choose the best image for sharing (prefer backdrop, fallback to poster)
    const shareImage = backdropUrl !== '/placeholder.svg' ? backdropUrl : posterUrl
    const absoluteShareImage = shareImage.startsWith('http') 
      ? shareImage 
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}${shareImage}`

    const title = `${movie.title} - Xem phim trực tuyến tại AllDrama`
    const description = movie.summary 
      ? `${movie.summary.slice(0, 150)}${movie.summary.length > 150 ? '...' : ''}`
      : `Xem phim ${movie.title} (${movie.releaseYear}) với chất lượng cao tại AllDrama. Đánh giá: ${movie.rating || 'N/A'}/10`
      
    const movieUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/movie/${resolvedParams.slug}`

    console.log(`✅ [generateMetadata] Successfully generated metadata for: ${movie.title} (ID: ${movie.id})`);

    return {
      title,
      description,
      keywords: `${movie.title}, phim trực tuyến, xem phim, ${movie.releaseYear}, AllDrama, ${movie.genres?.map((g: any) => typeof g === 'string' ? g : g.name).join(', ') || ''}`,
      
      // Open Graph
      openGraph: {
        title,
        description,
        url: movieUrl,
        siteName: 'AllDrama',
        images: [
          {
            url: absoluteShareImage,
            width: 1200,
            height: 630,
            alt: movie.title,
            type: 'image/jpeg',
          }
        ],
        locale: 'vi_VN',
        type: 'video.movie',
        // Additional video-specific metadata
        ...(movie.releaseYear && { 
          videoReleaseDate: `${movie.releaseYear}-01-01` 
        }),
        ...(movie.duration && { 
          videoDuration: movie.duration * 60 // convert minutes to seconds
        }),
      },

      // Twitter Card
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [absoluteShareImage],
        creator: '@alldrama',
      },

      // Additional metadata
      alternates: {
        canonical: movieUrl,
      },
      
      // Robots
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },

      // Structured data hints
      other: {
        'movie:rating': movie.rating?.toString() || '',
        'movie:release_date': movie.releaseYear?.toString() || '',
        'movie:duration': movie.duration?.toString() || '',
        'movie:genre': movie.genres?.map((g: any) => typeof g === 'string' ? g : g.name).join(',') || '',
      },
    }
  } catch (error) {
    console.error('Error generating movie metadata:', error)
    
    return {
      title: 'Lỗi tải phim - AllDrama',
      description: 'Đã xảy ra lỗi khi tải thông tin phim. Vui lòng thử lại sau.',
    }
  }
}

export default function MovieLayout({ children }: Props) {
  return <>{children}</>
} 