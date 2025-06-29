'use client'

import Script from 'next/script'

interface NativeBannerProps {
  className?: string
  style?: 'compact' | 'full' | 'sidebar'
}

export default function NativeBanner({ 
  className = '',
  style = 'full'
}: NativeBannerProps) {
  
  // Style classes based on banner type
  const getStyleClasses = () => {
    switch (style) {
      case 'compact':
        return 'min-h-[80px] max-w-2xl mx-auto'
      case 'sidebar':
        return 'min-h-[250px] max-w-xs'
      case 'full':
      default:
        return 'min-h-[120px] max-w-4xl mx-auto'
    }
  }

  return (
    <div className={`w-full py-4 ${className}`}>
      {/* Native Banner Ad Script */}
      <Script
        src="//orientsweptautopsy.com/51e671af8174b21a219f35f16d8e4c70/invoke.js"
        strategy="afterInteractive"
        data-cfasync="false"
        async
      />
      
      {/* Banner container with exact ID as required */}
      <div 
        id="container-51e671af8174b21a219f35f16d8e4c70"
        className={`w-full ${getStyleClasses()} flex items-center justify-center bg-gray-900/30 rounded-lg border border-gray-800/50 transition-all duration-300`}
      >
        {/* Placeholder content while ad loads */}
        <div className="text-gray-500 text-sm opacity-50">Đang tải quảng cáo...</div>
      </div>
    </div>
  )
} 