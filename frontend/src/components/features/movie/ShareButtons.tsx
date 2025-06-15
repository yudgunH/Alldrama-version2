'use client'

import { useState } from 'react'
import { Share, Facebook, Twitter, MessageCircle, Link as LinkIcon, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Movie } from '@/types'

interface ShareButtonsProps {
  movie: Movie
  className?: string
  variant?: 'button' | 'icon'
}

export default function ShareButtons({ movie, className = '', variant = 'button' }: ShareButtonsProps) {
  const [isCopied, setIsCopied] = useState(false)
  
  const movieUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/movie/${movie.id}`
  const shareText = `Đang xem "${movie.title}" trên AllDrama`
  
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(movieUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(movieUrl)}`,
    zalo: `https://zalo.me/share?url=${encodeURIComponent(movieUrl)}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(movieUrl)
      setIsCopied(true)
      toast.success('Đã sao chép link!')
      
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast.error('Không thể sao chép link')
    }
  }

  const handleShare = (platform: string) => {
    const url = shareLinks[platform as keyof typeof shareLinks]
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
    }
  }

  // Native Web Share API (for mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: shareText,
          url: movieUrl,
        })
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          toast.error('Không thể chia sẻ')
        }
      }
    }
  }

  const TriggerButton = variant === 'icon' ? (
    <Button variant="outline" size="sm" className={`p-2 ${className}`}>
      <Share className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
      <Share className="h-4 w-4" />
      Chia sẻ
    </Button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {TriggerButton}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700">
        {/* Native Share (mobile) */}
        {typeof window !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={handleNativeShare} className="text-white hover:bg-gray-700">
            <Share className="mr-2 h-4 w-4" />
            Chia sẻ
          </DropdownMenuItem>
        )}
        
        {/* Facebook */}
        <DropdownMenuItem 
          onClick={() => handleShare('facebook')} 
          className="text-white hover:bg-gray-700"
        >
          <Facebook className="mr-2 h-4 w-4 text-blue-500" />
          Facebook
        </DropdownMenuItem>
        
        {/* Twitter */}
        <DropdownMenuItem 
          onClick={() => handleShare('twitter')} 
          className="text-white hover:bg-gray-700"
        >
          <Twitter className="mr-2 h-4 w-4 text-blue-400" />
          Twitter
        </DropdownMenuItem>
        
        {/* Zalo */}
        <DropdownMenuItem 
          onClick={() => handleShare('zalo')} 
          className="text-white hover:bg-gray-700"
        >
          <MessageCircle className="mr-2 h-4 w-4 text-blue-600" />
          Zalo
        </DropdownMenuItem>
        
        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink} className="text-white hover:bg-gray-700">
          {isCopied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-500" />
              Đã sao chép!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Sao chép link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 