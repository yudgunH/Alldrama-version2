'use client'

import { useMobile } from '@/hooks/use-mobile'

interface NativeBannerProps {
  className?: string
  style?: 'compact' | 'full' | 'sidebar'
  hideOnMobile?: boolean
}

export default function NativeBanner({ 
  className = '',
  style = 'full',
  hideOnMobile = false
}: NativeBannerProps) {
  const isMobile = useMobile()
  
  // Hide banner on mobile if specified
  if (hideOnMobile && isMobile) {
    return null
  }
  
  // Style classes based on banner type and device
  const getStyleClasses = () => {
    const baseClasses = 'w-full flex items-center justify-center bg-gray-900/30 rounded-lg border border-gray-800/50 transition-all duration-300'
    
    if (isMobile) {
      // Mobile-optimized heights - much smaller
      switch (style) {
        case 'compact':
          return `${baseClasses} min-h-[50px] max-w-full mx-auto`
        case 'sidebar':
          return `${baseClasses} min-h-[80px] max-w-full` // Much smaller on mobile
        case 'full':
        default:
          return `${baseClasses} min-h-[50px] max-w-full mx-auto` // Significantly smaller
      }
    } else {
      // Desktop heights
      switch (style) {
        case 'compact':
          return `${baseClasses} min-h-[80px] max-w-2xl mx-auto`
        case 'sidebar':
          return `${baseClasses} min-h-[250px] max-w-xs`
        case 'full':
        default:
          return `${baseClasses} min-h-[120px] max-w-4xl mx-auto`
      }
    }
  }

  // Responsive padding
  const getPaddingClasses = () => {
    if (isMobile) {
      return 'py-1' // Minimal padding on mobile
    }
    return 'py-4'
  }

  return (
    <div className={`w-full ${getPaddingClasses()} ${className}`}>      
      {/* Banner container - script loaded globally in layout */}
      <div 
        id="container-51e671af8174b21a219f35f16d8e4c70"
        className={getStyleClasses()}
      >
        {/* Placeholder content while ad loads */}
        <div className={`text-gray-500 opacity-50 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {isMobile ? 'Quảng cáo' : 'Đang tải quảng cáo...'}
        </div>
      </div>
    </div>
  )
} 