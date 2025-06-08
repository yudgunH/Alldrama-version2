'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAutoDetectedImageUrl, clearImageFormatCache, getImageCacheStats } from '@/utils/image'

/**
 * React hook to get auto-detected image URL with real-time updates
 * @param baseUrl - Base URL without extension
 * @param preferredFormats - Array of preferred formats
 * @returns Object with current URL and loading state
 */
export function useAutoDetectedImage(
  baseUrl: string,
  preferredFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): { url: string; isDetecting: boolean; hasDetected: boolean } {
  const [url, setUrl] = useState<string>('')
  const [isDetecting, setIsDetecting] = useState(true)
  const [hasDetected, setHasDetected] = useState(false)

  useEffect(() => {
    if (!baseUrl) {
      setUrl('')
      setIsDetecting(false)
      setHasDetected(false)
      return
    }

    // Get initial URL (might be intelligent default)
    const initialUrl = getAutoDetectedImageUrl(baseUrl, preferredFormats)
    setUrl(initialUrl)

    // Check if we already have cached format
    const cacheKey = `img_format_${baseUrl}`
    const cachedFormat = localStorage.getItem(cacheKey)
    
    if (cachedFormat && preferredFormats.includes(cachedFormat)) {
      setIsDetecting(false)
      setHasDetected(true)
      return
    }

    // Listen for format detection events
    const handleFormatDetected = (event: CustomEvent) => {
      if (event.detail.baseUrl === baseUrl) {
        setUrl(`${baseUrl}.${event.detail.format}`)
        setIsDetecting(false)
        setHasDetected(true)
      }
    }

    const handleFormatFailed = (event: CustomEvent) => {
      if (event.detail.baseUrl === baseUrl) {
        setIsDetecting(false)
        setHasDetected(false)
      }
    }

    // Add event listeners
    window.addEventListener('imageFormatDetected', handleFormatDetected as EventListener)
    window.addEventListener('imageFormatFailed', handleFormatFailed as EventListener)

    // Start detection if not already cached
    setIsDetecting(true)

    return () => {
      window.removeEventListener('imageFormatDetected', handleFormatDetected as EventListener)
      window.removeEventListener('imageFormatFailed', handleFormatFailed as EventListener)
    }
  }, [baseUrl, preferredFormats])

  return { url, isDetecting, hasDetected }
}

/**
 * Hook to preload multiple images and track progress
 * @param baseUrls - Array of base URLs without extensions
 * @param preferredFormats - Array of preferred formats
 * @returns Object with loading state and progress
 */
export function usePreloadImages(
  baseUrls: string[],
  preferredFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): { 
  isLoading: boolean; 
  loadedCount: number; 
  totalCount: number; 
  progress: number;
  urls: string[];
} {
  const [loadedCount, setLoadedCount] = useState(0)
  const [urls, setUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (baseUrls.length === 0) {
      setIsLoading(false)
      setLoadedCount(0)
      setUrls([])
      return
    }

    setIsLoading(true)
    setLoadedCount(0)

    // Get initial URLs
    const initialUrls = baseUrls.map(baseUrl => 
      getAutoDetectedImageUrl(baseUrl, preferredFormats)
    )
    setUrls(initialUrls)

    let completed = 0
    const totalCount = baseUrls.length

    const handleFormatDetected = (event: CustomEvent) => {
      const { baseUrl, format } = event.detail
      const index = baseUrls.indexOf(baseUrl)
      
      if (index !== -1) {
        setUrls(prev => {
          const newUrls = [...prev]
          newUrls[index] = `${baseUrl}.${format}`
          return newUrls
        })
        
        completed++
        setLoadedCount(completed)
        
        if (completed >= totalCount) {
          setIsLoading(false)
        }
      }
    }

    const handleFormatFailed = (event: CustomEvent) => {
      const { baseUrl } = event.detail
      const index = baseUrls.indexOf(baseUrl)
      
      if (index !== -1) {
        completed++
        setLoadedCount(completed)
        
        if (completed >= totalCount) {
          setIsLoading(false)
        }
      }
    }

    // Add event listeners
    window.addEventListener('imageFormatDetected', handleFormatDetected as EventListener)
    window.addEventListener('imageFormatFailed', handleFormatFailed as EventListener)

    // Check for already cached formats
    let alreadyCached = 0
    baseUrls.forEach(baseUrl => {
      const cacheKey = `img_format_${baseUrl}`
      const cachedFormat = localStorage.getItem(cacheKey)
      
      if (cachedFormat && preferredFormats.includes(cachedFormat)) {
        alreadyCached++
      }
    })

    if (alreadyCached >= totalCount) {
      setIsLoading(false)
      setLoadedCount(totalCount)
    }

    return () => {
      window.removeEventListener('imageFormatDetected', handleFormatDetected as EventListener)
      window.removeEventListener('imageFormatFailed', handleFormatFailed as EventListener)
    }
  }, [baseUrls, preferredFormats])

  const progress = baseUrls.length > 0 ? (loadedCount / baseUrls.length) * 100 : 0

  return {
    isLoading,
    loadedCount,
    totalCount: baseUrls.length,
    progress,
    urls
  }
}

/**
 * Hook to manage image cache
 * @returns Object with cache management functions
 */
export function useImageCache() {
  const clearCache = useCallback(() => {
    clearImageFormatCache()
  }, [])

  const getCacheStats = useCallback(() => {
    return getImageCacheStats()
  }, [])

  const [cacheStats, setCacheStats] = useState(() => getImageCacheStats())

  const refreshStats = useCallback(() => {
    setCacheStats(getImageCacheStats())
  }, [])

  useEffect(() => {
    // Refresh stats periodically
    const interval = setInterval(refreshStats, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [refreshStats])

  return {
    clearCache,
    getCacheStats,
    cacheStats,
    refreshStats
  }
} 