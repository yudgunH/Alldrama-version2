import { useState, useEffect, useRef, useCallback } from 'react'

export interface QualityLevel {
  label: string
  value: string | number
  bitrate?: number
  height?: number
  width?: number
}

interface UseVideoQualityProps {
  videoElement: HTMLVideoElement | null
  hlsInstance: any // Hls instance
  isHLS: boolean
}

export function useVideoQuality({ videoElement, hlsInstance, isHLS }: UseVideoQualityProps) {
  const [availableQualities, setAvailableQualities] = useState<QualityLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState<string>('auto')
  const [isLoading, setIsLoading] = useState(false)

  // Extract quality from HLS level
  const extractQualityFromLevel = useCallback((level: any, index: number): QualityLevel => {
    // Try to get quality from height
    if (level.height && level.height > 0) {
      return {
        label: `${level.height}p`,
        value: index,
        bitrate: level.bitrate,
        height: level.height,
        width: level.width
      }
    }

    // Try to extract from URL
    if (level.url) {
      const urls = Array.isArray(level.url) ? level.url : [level.url]
      for (const url of urls) {
        const qualityMatch = url.match(/(\d+)(?:p?m3u8|p\.m3u8|p)/i)
        if (qualityMatch) {
          const height = parseInt(qualityMatch[1])
          return {
            label: `${height}p`,
            value: index,
            bitrate: level.bitrate,
            height: height
          }
        }
      }
    }

    // Fallback based on bitrate
    if (level.bitrate) {
      const bitrate = level.bitrate
      let label = 'Unknown'
      let height = 0

      if (bitrate >= 8000000) {
        label = '4K'
        height = 2160
      } else if (bitrate >= 5000000) {
        label = '1080p'
        height = 1080
      } else if (bitrate >= 3000000) {
        label = '720p'
        height = 720
      } else if (bitrate >= 1500000) {
        label = '480p'
        height = 480
      } else if (bitrate >= 800000) {
        label = '360p'
        height = 360
      } else {
        label = '240p'
        height = 240
      }

      return {
        label,
        value: index,
        bitrate: level.bitrate,
        height
      }
    }

    // Final fallback
    return {
      label: `Quality ${index + 1}`,
      value: index,
      bitrate: level.bitrate
    }
  }, [])

  // Update available qualities when HLS levels change
  useEffect(() => {
    if (!isHLS || !hlsInstance) {
      setAvailableQualities([])
      return
    }

    const updateQualities = () => {
      const levels = hlsInstance.levels || []
      if (levels.length === 0) return

      const qualities: QualityLevel[] = [
        { label: 'Auto', value: 'auto' }
      ]

      // Add all available levels
      levels.forEach((level: any, index: number) => {
        qualities.push(extractQualityFromLevel(level, index))
      })

      // Sort by height/bitrate descending
      qualities.sort((a, b) => {
        if (a.value === 'auto') return -1
        if (b.value === 'auto') return 1
        
        if (a.height && b.height) {
          return b.height - a.height
        }
        
        if (a.bitrate && b.bitrate) {
          return b.bitrate - a.bitrate
        }
        
        return 0
      })

      setAvailableQualities(qualities)
    }

    // Listen for HLS events
    hlsInstance.on('hlsManifestParsed', updateQualities)
    hlsInstance.on('hlsLevelLoaded', updateQualities)

    // Initial update
    updateQualities()

    return () => {
      hlsInstance.off('hlsManifestParsed', updateQualities)
      hlsInstance.off('hlsLevelLoaded', updateQualities)
    }
  }, [hlsInstance, isHLS, extractQualityFromLevel])

  // Change quality level
  const changeQuality = useCallback(async (qualityValue: string) => {
    if (!hlsInstance || !isHLS) return

    setIsLoading(true)
    
    try {
      if (qualityValue === 'auto') {
        hlsInstance.currentLevel = -1 // Auto quality
        setCurrentQuality('auto')
      } else {
        const levelIndex = parseInt(qualityValue.toString())
        if (!isNaN(levelIndex) && levelIndex >= 0 && levelIndex < hlsInstance.levels.length) {
          hlsInstance.currentLevel = levelIndex
          const selectedQuality = availableQualities.find(q => q.value === levelIndex)
          setCurrentQuality(selectedQuality?.label || qualityValue.toString())
        }
      }

      // Add a small delay to allow HLS to switch
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      // console.error('Error changing quality:', error)
    } finally {
      setIsLoading(false)
    }
  }, [hlsInstance, isHLS, availableQualities])

  // Get current quality info
  const getCurrentQualityInfo = useCallback(() => {
    if (!hlsInstance || !isHLS) return null

    const currentLevel = hlsInstance.currentLevel
    if (currentLevel === -1) {
      return { label: 'Auto', value: 'auto' }
    }

    const level = hlsInstance.levels[currentLevel]
    if (level) {
      return extractQualityFromLevel(level, currentLevel)
    }

    return null
  }, [hlsInstance, isHLS, extractQualityFromLevel])

  // Update current quality when HLS level changes
  useEffect(() => {
    if (!hlsInstance || !isHLS) return

    const handleLevelSwitch = () => {
      const qualityInfo = getCurrentQualityInfo()
      if (qualityInfo) {
        setCurrentQuality(qualityInfo.label)
      }
    }

    hlsInstance.on('hlsLevelSwitched', handleLevelSwitch)
    
    return () => {
      hlsInstance.off('hlsLevelSwitched', handleLevelSwitch)
    }
  }, [hlsInstance, isHLS, getCurrentQualityInfo])

  return {
    availableQualities,
    currentQuality,
    isLoading,
    changeQuality,
    getCurrentQualityInfo
  }
} 