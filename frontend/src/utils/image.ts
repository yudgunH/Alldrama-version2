/**
 * Utility functions for handling image URLs
 */

// Supported image formats
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Check if should show skeleton instead of image
 * @param imageUrl - The image URL to check
 * @returns boolean indicating if skeleton should be shown
 */
export function shouldShowSkeleton(imageUrl: string | null | undefined): boolean {
  return !imageUrl || 
         imageUrl.trim() === '' || 
         imageUrl === '/placeholder.svg' ||
         imageUrl === 'null' ||
         imageUrl === 'undefined';
}

/**
 * Convert poster URL to backdrop URL by replacing "poster" with "backdrop"
 * @param posterUrl - The poster URL
 * @returns Backdrop URL
 */
export function convertPosterToBackdrop(posterUrl: string): string {
  return posterUrl.replace(/\/poster(\.|$)/, '/backdrop$1');
}

/**
 * Get image info with skeleton flag
 * @param imageUrl - The image URL
 * @param movieId - Movie ID for auto-detection
 * @param type - Type of image
 * @param posterUrl - Poster URL to convert to backdrop if needed
 * @returns Object with url and shouldShowSkeleton flag
 */
export function getImageInfo(
  imageUrl: string | null | undefined,
  movieId?: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster',
  posterUrl?: string | null | undefined
): { url: string; shouldShowSkeleton: boolean } {
  // For backdrop type, if no backdrop URL but have poster URL, convert it
  if (type === 'backdrop' && shouldShowSkeleton(imageUrl) && posterUrl && !shouldShowSkeleton(posterUrl)) {
    const backdropUrl = convertPosterToBackdrop(posterUrl);
    return { url: backdropUrl, shouldShowSkeleton: false };
  }
  
  // Check if should show skeleton first
  if (shouldShowSkeleton(imageUrl)) {
    // If no movieId either, definitely show skeleton
    if (!movieId) {
      return { url: '', shouldShowSkeleton: true };
    }
    
    // Try auto-detection with movieId
    // For thumbnails, we need episodeId as well, so we can't auto-detect without it
    if (type === 'thumbnail') {
      return { url: '', shouldShowSkeleton: true };
    }
    
    const autoUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/${type}`);
    return { url: autoUrl, shouldShowSkeleton: false };
  }
  
  // If we have a valid URL, use it
  if (imageUrl && imageUrl.trim() !== '' && imageUrl.startsWith('http')) {
    return { url: imageUrl, shouldShowSkeleton: false };
  }
  
  // If we have movieId, try auto-detection
  if (movieId) {
    // For thumbnails, we need episodeId as well, so we can't auto-detect without it
    if (type === 'thumbnail') {
      return { url: '', shouldShowSkeleton: true };
    }
    
    const autoUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/${type}`);
    return { url: autoUrl, shouldShowSkeleton: false };
  }
  
  // Fallback to skeleton
  return { url: '', shouldShowSkeleton: true };
}

/**
 * Get episode thumbnail info with skeleton flag
 * @param thumbnailUrl - The thumbnail URL
 * @param movieId - Movie ID
 * @param episodeId - Episode ID
 * @returns Object with url and shouldShowSkeleton flag
 */
export function getEpisodeThumbnailInfo(
  thumbnailUrl: string | null | undefined,
  movieId: number | string,
  episodeId: number | string
): { url: string; shouldShowSkeleton: boolean } {
  // Check if should show skeleton first
  if (shouldShowSkeleton(thumbnailUrl)) {
    // Auto-detect with movieId and episodeId
    const autoUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/episodes/${movieId}/${episodeId}/thumbnail`);
    return { url: autoUrl, shouldShowSkeleton: false };
  }
  
  // If we have a valid URL, use it
  if (thumbnailUrl && thumbnailUrl.trim() !== '' && thumbnailUrl.startsWith('http')) {
    return { url: thumbnailUrl, shouldShowSkeleton: false };
  }
  
  // Auto-detect format for episode thumbnail
  const autoUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/episodes/${movieId}/${episodeId}/thumbnail`);
  return { url: autoUrl, shouldShowSkeleton: false };
}

/**
 * USAGE PATTERNS FOR AUTO-DETECTED IMAGES:
 * 
 * // 1. Basic usage with auto-detection:
 * import { getAutoDetectedImageUrl } from '@/utils/image'
 * 
 * const backdropUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/backdrop`)
 * // Returns: backdrop.webp (or .jpg if webp not available)
 * 
 * // 2. React hook for real-time updates:
 * import { useAutoDetectedImage } from '@/hooks/useAutoDetectedImage'
 * 
 * const { url, isDetecting, hasDetected } = useAutoDetectedImage(
 *   `https://media.alldrama.tech/movies/${movieId}/backdrop`
 * )
 * 
 * {isDetecting ? (
 *   <Skeleton className="w-full h-full" />
 * ) : (
 *   <img src={url} alt="backdrop" onLoad={() => handleImageLoadSuccess(url)} />
 * )}
 * 
 * // 3. Preload multiple images:
 * import { usePreloadImages } from '@/hooks/useAutoDetectedImage'
 * 
 * const baseUrls = movies.map(m => `https://media.alldrama.tech/movies/${m.id}/poster`)
 * const { isLoading, loadedCount, totalCount } = usePreloadImages(baseUrls)
 * 
 * // 4. Legacy pattern with skeleton:
 * import { getImageInfo } from '@/utils/image'
 * 
 * const imageInfo = getImageInfo(movie.posterUrl, movie.id, 'poster')
 * {imageInfo.shouldShowSkeleton ? <Skeleton /> : <img src={imageInfo.url} />}
 * 
 * // 5. Cache management:
 * import { clearImageFormatCache, getImageCacheStats } from '@/utils/image'
 * 
 * // Clear cache when needed
 * clearImageFormatCache()
 * 
 * // Check cache stats
 * console.log(getImageCacheStats()) // { memoryCache: 10, localStorageCache: 15, failedCache: 2 }
 */

// Cache for storing detected formats and failed attempts
const formatCache = new Map<string, string>();
const failedCache = new Set<string>();

/**
 * Auto-detect the actual image format available on server
 * @param baseUrl - Base URL without extension
 * @param preferredFormats - Array of preferred formats in order
 * @returns The URL with the correct extension
 */
export function getAutoDetectedImageUrl(
  baseUrl: string, 
  preferredFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): string {
  // Check memory cache first
  if (formatCache.has(baseUrl)) {
    return `${baseUrl}.${formatCache.get(baseUrl)}`;
  }
  
  // Check localStorage cache
  const cacheKey = `img_format_${baseUrl}`;
  const cachedFormat = localStorage.getItem(cacheKey);
  
  if (cachedFormat && preferredFormats.includes(cachedFormat)) {
    formatCache.set(baseUrl, cachedFormat);
    return `${baseUrl}.${cachedFormat}`;
  }
  
  // Start async detection in background
  detectImageFormatAsync(baseUrl, preferredFormats);
  
  // Return intelligent default while detection is running
  return getIntelligentDefault(baseUrl, preferredFormats);
}

/**
 * Get intelligent default format based on image type
 */
function getIntelligentDefault(baseUrl: string, preferredFormats: string[]): string {
  // For backdrop images, try webp first as it's more common for larger images
  if (baseUrl.includes('/backdrop')) {
    return `${baseUrl}.webp`;
  }
  
  // For poster images, jpg is most common
  if (baseUrl.includes('/poster')) {
    return `${baseUrl}.jpg`;
  }
  
  // For thumbnails, webp is preferred for smaller file size
  if (baseUrl.includes('/thumbnail')) {
    return `${baseUrl}.webp`;
  }
  
  // Default fallback
  return `${baseUrl}.${preferredFormats[0]}`;
}

/**
 * Async function to detect actual image format on server
 */
async function detectImageFormatAsync(
  baseUrl: string, 
  preferredFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): Promise<void> {
  // Skip if already failed recently
  if (failedCache.has(baseUrl)) {
    return;
  }
  
  try {
    for (const format of preferredFormats) {
      const testUrl = `${baseUrl}.${format}`;
      
      try {
        // Use HEAD request to check if image exists without downloading
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          cache: 'force-cache' // Use browser cache if available
        });
        
        if (response.ok) {
          // Cache the successful format
          formatCache.set(baseUrl, format);
          localStorage.setItem(`img_format_${baseUrl}`, format);
          
          // Trigger re-render for components using this image
          triggerImageUpdate(baseUrl, format);
          return;
        }
      } catch (error) {
        // Continue to next format
        continue;
      }
    }
    
    // If no format worked, cache the failure temporarily
    failedCache.add(baseUrl);
    setTimeout(() => failedCache.delete(baseUrl), 5 * 60 * 1000); // Clear after 5 minutes
    
  } catch (error) {
    console.warn('Image format detection failed:', error);
  }
}

/**
 * Trigger update for components using this image
 */
function triggerImageUpdate(baseUrl: string, format: string): void {
  // Dispatch custom event to notify components
  const event = new CustomEvent('imageFormatDetected', {
    detail: { baseUrl, format, url: `${baseUrl}.${format}` }
  });
  window.dispatchEvent(event);
}

/**
 * Get the best available image format for a given URL
 * @param baseUrl - Base URL without extension
 * @param preferredFormats - Array of preferred formats in order
 * @returns Promise that resolves to the best available format
 */
export async function getBestImageFormat(
  baseUrl: string, 
  preferredFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): Promise<string> {
  for (const format of preferredFormats) {
    const testUrl = `${baseUrl}.${format}`;
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (response.ok) {
        // Cache the successful format for future use
        const cacheKey = `img_format_${baseUrl}`;
        localStorage.setItem(cacheKey, format);
        return testUrl;
      }
    } catch (error) {
      // Continue to next format
      continue;
    }
  }
  
  // Fallback to first preferred format if none work
  return `${baseUrl}.${preferredFormats[0]}`;
}

/**
 * Cache the successful image format for future use
 * @param imageUrl - The successful image URL
 */
export function cacheImageFormat(imageUrl: string): void {
  const extension = getImageExtension(imageUrl);
  if (extension) {
    const baseUrl = imageUrl.replace(/\.[^.]+(\?.*)?$/, '');
    const cacheKey = `img_format_${baseUrl}`;
    localStorage.setItem(cacheKey, extension);
  }
}

/**
 * Hook to handle image load success and cache format
 * @param imageUrl - The image URL that loaded successfully
 */
export function handleImageLoadSuccess(imageUrl: string): void {
  cacheImageFormat(imageUrl);
}

// Note: useAutoDetectedImage hook is now implemented in @/hooks/useAutoDetectedImage

/**
 * Preload and detect image formats for multiple URLs
 * @param baseUrls - Array of base URLs to detect
 * @param preferredFormats - Preferred formats
 */
export async function preloadImageFormats(
  baseUrls: string[],
  preferredFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): Promise<void> {
  const promises = baseUrls.map(baseUrl => 
    detectImageFormatAsync(baseUrl, preferredFormats)
  );
  
  await Promise.allSettled(promises);
}

/**
 * Clear image format cache (useful for testing or cache invalidation)
 */
export function clearImageFormatCache(): void {
  formatCache.clear();
  failedCache.clear();
  
  // Clear localStorage cache
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('img_format_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Get cache statistics for debugging
 */
export function getImageCacheStats(): {
  memoryCache: number;
  localStorageCache: number;
  failedCache: number;
} {
  const localStorageCount = Object.keys(localStorage)
    .filter(key => key.startsWith('img_format_')).length;
    
  return {
    memoryCache: formatCache.size,
    localStorageCache: localStorageCount,
    failedCache: failedCache.size
  };
}

/**
 * Extract file extension from URL
 * @param url - Image URL
 * @returns File extension or null
 */
function getImageExtension(url: string): string | null {
  const match = url.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?|$)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Get a safe poster URL that won't cause ReactDOM.preload errors
 * @param posterUrl - The original poster URL from the movie data
 * @param movieId - The movie ID for constructing the URL
 * @param fallback - Fallback image path (default: "/placeholder.svg")
 * @returns A safe URL that can be used with next/image
 */
export function getSafePosterUrl(
  posterUrl: string | null | undefined, 
  movieId?: number | string,
  fallback: string = "/placeholder.svg"
): string {
  // Check if posterUrl is valid and not empty
  if (shouldShowSkeleton(posterUrl)) {
    if (movieId) {
      // Auto-detect format for movie poster
      return getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/poster`);
    }
    return fallback;
  }

  // If it's already a full URL, return it
  if (posterUrl && posterUrl.startsWith('http://') || posterUrl && posterUrl.startsWith('https://')) {
    return posterUrl;
  }

  // If we have a movieId, construct the full URL
  if (movieId) {
    // Check if posterUrl already has an extension
    const extension = getImageExtension(posterUrl!);
    if (extension) {
      return `https://media.alldrama.tech/movies/${movieId}/poster.${extension}`;
    }
    
    // Auto-detect format
    return getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/poster`);
  }

  // If it's a relative path, return it as is
  if (posterUrl && posterUrl.startsWith('/')) {
    return posterUrl;
  }

  // Default fallback
  return fallback;
}

/**
 * Get a safe backdrop URL
 * @param backdropUrl - The original backdrop URL
 * @param posterUrl - Fallback to poster URL if backdrop is not available
 * @param movieId - The movie ID for constructing URLs
 * @param fallback - Final fallback image path
 * @returns A safe URL that can be used with next/image
 */
export function getSafeBackdropUrl(
  backdropUrl: string | null | undefined,
  posterUrl: string | null | undefined,
  movieId?: number | string,
  fallback: string = "/placeholder.svg"
): string {
  // Try backdrop first
  if (backdropUrl && !shouldShowSkeleton(backdropUrl)) {
    if (backdropUrl.startsWith('http://') || backdropUrl.startsWith('https://')) {
      return backdropUrl;
    }
    if (movieId) {
      // Check if backdropUrl already has an extension
      const extension = getImageExtension(backdropUrl);
      if (extension) {
        return `https://media.alldrama.tech/movies/${movieId}/backdrop.${extension}`;
      }
      
      // Auto-detect format for backdrop
      return getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/backdrop`);
    }
  }

  // If no backdrop but have poster, convert poster to backdrop
  if (posterUrl && !shouldShowSkeleton(posterUrl)) {
    if (posterUrl.startsWith('http://') || posterUrl.startsWith('https://')) {
      return convertPosterToBackdrop(posterUrl);
    }
    if (movieId) {
      // Auto-detect format for backdrop based on poster structure
      return getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/backdrop`);
    }
  }

  // Fallback to poster
  return getSafePosterUrl(posterUrl, movieId, fallback);
}

/**
 * Get image URL with proper error handling and format support
 * @param imageUrl - The image URL
 * @param movieId - Movie ID for constructing URL if needed
 * @param type - Type of image ('poster' | 'backdrop' | 'thumbnail')
 * @param fallback - Fallback image path
 * @param preferredFormat - Preferred image format (deprecated, auto-detected now)
 * @param episodeId - Episode ID (required for thumbnail type)
 * @returns A safe URL
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  movieId?: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster',
  fallback: string = "/placeholder.svg",
  preferredFormat: string = 'jpg',
  episodeId?: number | string
): string {
  if (shouldShowSkeleton(imageUrl)) {
    if (movieId) {
      // For thumbnails, use episodes path structure
      if (type === 'thumbnail' && episodeId) {
        return getAutoDetectedImageUrl(`https://media.alldrama.tech/episodes/${movieId}/${episodeId}/thumbnail`);
      } else if (type === 'thumbnail') {
        // Can't generate thumbnail URL without episodeId
        return fallback;
      }
      
      // Auto-detect format for poster/backdrop
      return getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/${type}`);
    }
    return fallback;
  }

  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    return imageUrl;
  }

  if (movieId) {
    // Check if imageUrl already has an extension
    const extension = getImageExtension(imageUrl!);
    
    if (type === 'thumbnail' && episodeId) {
      if (extension) {
        return `https://media.alldrama.tech/episodes/${movieId}/${episodeId}/thumbnail.${extension}`;
      }
      // Auto-detect format for thumbnail
      return getAutoDetectedImageUrl(`https://media.alldrama.tech/episodes/${movieId}/${episodeId}/thumbnail`);
    } else if (type === 'thumbnail') {
      // Can't generate thumbnail URL without episodeId
      return fallback;
    }
    
    if (extension) {
      return `https://media.alldrama.tech/movies/${movieId}/${type}.${extension}`;
    }
    
    // Auto-detect format
    return getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/${type}`);
  }

  return (imageUrl && imageUrl.startsWith('/')) ? imageUrl : fallback;
}

/**
 * Get episode thumbnail URL with auto-detection
 * @param movieId - Movie ID
 * @param episodeNumber - Episode number
 * @param fallback - Fallback image path
 * @returns Episode thumbnail URL
 */
export function getEpisodeThumbnailUrl(
  movieId: number | string,
  episodeNumber: number | string,
  fallback: string = "/placeholder.svg"
): string {
  return getAutoDetectedImageUrl(`https://media.alldrama.tech/episodes/${movieId}/${episodeNumber}/thumbnail`);
}

/**
 * Get multiple image URLs with different formats for fallback
 * @param movieId - Movie ID
 * @param type - Type of image
 * @param formats - Array of formats to try
 * @returns Array of URLs to try in order
 */
export function getImageUrlsWithFallback(
  movieId: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster',
  formats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): string[] {
  return formats.map(format => 
    `https://media.alldrama.tech/movies/${movieId}/${type}.${format}`
  );
}

/**
 * Create a picture element source set for responsive images
 * @param movieId - Movie ID
 * @param type - Type of image
 * @param sizes - Object with size breakpoints
 * @returns Object with srcSet and sizes for picture element
 */
export function createResponsiveImageSources(
  movieId: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster',
  sizes: { [key: string]: string } = {
    '(max-width: 640px)': 'sm',
    '(max-width: 1024px)': 'md',
    '(min-width: 1025px)': 'lg'
  }
) {
  const baseUrl = `https://media.alldrama.tech/movies/${movieId}`;
  
  return {
    webp: {
      srcSet: Object.entries(sizes).map(([media, size]) => 
        `${baseUrl}/${type}-${size}.webp`
      ).join(', '),
      type: 'image/webp'
    },
    jpg: {
      srcSet: Object.entries(sizes).map(([media, size]) => 
        `${baseUrl}/${type}-${size}.jpg`
      ).join(', '),
      type: 'image/jpeg'
    },
    fallback: `${baseUrl}/${type}.jpg`
  };
} 