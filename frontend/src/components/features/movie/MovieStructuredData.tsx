import { Movie } from '@/types'
import { getSafePosterUrl, getSafeBackdropUrl } from '@/utils/image'

interface MovieStructuredDataProps {
  movie: Movie
}

export default function MovieStructuredData({ movie }: MovieStructuredDataProps) {
  const posterUrl = getSafePosterUrl(movie.posterUrl, movie.id)
  const backdropUrl = getSafeBackdropUrl(movie.backdropUrl, movie.posterUrl, movie.id)
  
  // Generate absolute URLs
  const absolutePosterUrl = posterUrl.startsWith('http') 
    ? posterUrl 
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}${posterUrl}`
    
  const absoluteBackdropUrl = backdropUrl.startsWith('http') 
    ? backdropUrl 
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}${backdropUrl}`
  
  const movieUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/movie/${movie.id}`
  const watchUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/watch/${movie.id}/1`

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "alternateName": movie.title,
    "description": movie.summary || `Xem phim ${movie.title} trực tuyến tại AllDrama`,
    "url": movieUrl,
    "image": [
      absolutePosterUrl,
      absoluteBackdropUrl
    ],
    "thumbnail": absolutePosterUrl,
    "datePublished": movie.releaseYear ? `${movie.releaseYear}-01-01` : undefined,
    "genre": movie.genres?.map(g => typeof g === 'string' ? g : g.name) || [],
    "duration": movie.duration ? `PT${movie.duration}M` : undefined, // ISO 8601 duration format
    "aggregateRating": movie.rating ? {
      "@type": "AggregateRating",
      "ratingValue": movie.rating,
      "ratingCount": movie.views || 1,
      "bestRating": 10,
      "worstRating": 1
    } : undefined,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/WatchAction",
        "userInteractionCount": movie.views || 0
      }
    ],
    "potentialAction": [
      {
        "@type": "WatchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": watchUrl,
          "inLanguage": "vi",
          "actionPlatform": [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform",
            "https://schema.org/IOSPlatform",
            "https://schema.org/AndroidPlatform"
          ]
        },
        "expectsAcceptanceOf": {
          "@type": "Offer",
          "category": "free",
          "availableAtOrFrom": {
            "@type": "WebSite",
            "name": "AllDrama",
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'
          }
        }
      }
    ],
    "publisher": {
      "@type": "Organization",
      "name": "AllDrama",
      "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net',
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/logo.svg`
      }
    },
    "provider": {
      "@type": "Organization",
      "name": "AllDrama",
      "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "VND",
      "availability": "https://schema.org/InStock",
      "category": "free"
    },
    "contentRating": "PG-13", // Default rating, you can make this dynamic if you have the data
    "inLanguage": "vi",
    "countryOfOrigin": {
      "@type": "Country",
      "name": "Việt Nam"
    }
  }

  // Remove undefined fields
  const cleanedData = JSON.parse(JSON.stringify(structuredData))

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(cleanedData, null, 2)
      }}
    />
  )
} 