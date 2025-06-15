'use client'

import { Movie } from '@/types'
import { getSafePosterUrl, getSafeBackdropUrl } from '@/utils/image'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

interface SocialPreviewProps {
  movie: Movie
  className?: string
}

export default function SocialPreview({ movie, className = '' }: SocialPreviewProps) {
  const backdropUrl = getSafeBackdropUrl(movie.backdropUrl, movie.posterUrl, movie.id)
  const posterUrl = getSafePosterUrl(movie.posterUrl, movie.id)
  
  // Choose the best image for preview
  const previewImage = backdropUrl !== '/placeholder.svg' ? backdropUrl : posterUrl
  
  const movieUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://alldrama.net'}/movie/${movie.id}`
  const title = `${movie.title} - Xem phim trực tuyến tại AllDrama`
  const description = movie.summary 
    ? `${movie.summary.slice(0, 150)}${movie.summary.length > 150 ? '...' : ''}`
    : `Xem phim ${movie.title} (${movie.releaseYear}) với chất lượng cao tại AllDrama. Đánh giá: ${movie.rating || 'N/A'}/10`

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Preview chia sẻ trên mạng xã hội</h3>
      
      {/* Facebook Preview */}
      <Card className="bg-gray-800 border-gray-700 overflow-hidden max-w-lg">
        <CardContent className="p-0">
          <div className="aspect-[1.91/1] relative bg-gray-900">
            <Image
              src={previewImage}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
          <div className="p-3 bg-gray-800">
            <div className="text-xs text-gray-400 mb-1 uppercase">alldrama.net</div>
            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">{title}</h4>
            <p className="text-gray-300 text-xs line-clamp-2">{description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Twitter Preview */}
      <Card className="bg-gray-800 border-gray-700 overflow-hidden max-w-lg">
        <CardContent className="p-0">
          <div className="p-3 bg-gray-800">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <ExternalLink className="w-3 h-3" />
              alldrama.net
            </div>
            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">{title}</h4>
            <p className="text-gray-300 text-xs line-clamp-2 mb-3">{description}</p>
          </div>
          <div className="aspect-[2/1] relative bg-gray-900">
            <Image
              src={previewImage}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp/Zalo Preview */}
      <Card className="bg-gray-800 border-gray-700 overflow-hidden max-w-sm">
        <CardContent className="p-0">
          <div className="aspect-[4/3] relative bg-gray-900">
            <Image
              src={previewImage}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </div>
          <div className="p-3 bg-green-700">
            <h4 className="text-white font-semibold text-sm line-clamp-1 mb-1">{movie.title}</h4>
            <p className="text-green-100 text-xs line-clamp-2 mb-1">{description}</p>
            <div className="text-green-200 text-xs">📱 AllDrama</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 