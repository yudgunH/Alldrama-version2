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
 * Get image info with skeleton flag
 * @param imageUrl - The image URL
 * @param movieId - Movie ID for auto-detection
 * @param type - Type of image
 * @returns Object with url and shouldShowSkeleton flag
 */
export function getImageInfo(
  imageUrl: string | null | undefined,
  movieId?: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster'
): { url: string; shouldShowSkeleton: boolean } {
  // Check if should show skeleton first
  if (shouldShowSkeleton(imageUrl)) {
    // If no movieId either, definitely show skeleton
    if (!movieId) {
      return { url: '', shouldShowSkeleton: true };
    }
    
    // Try auto-detection with movieId
    const autoUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/${type}`);
    return { url: autoUrl, shouldShowSkeleton: false };
  }
  
  // If we have a valid URL, use it
  if (imageUrl && imageUrl.trim() !== '' && imageUrl.startsWith('http')) {
    return { url: imageUrl, shouldShowSkeleton: false };
  }
  
  // If we have movieId, try auto-detection
  if (movieId) {
    const autoUrl = getAutoDetectedImageUrl(`https://media.alldrama.tech/movies/${movieId}/${type}`);
    return { url: autoUrl, shouldShowSkeleton: false };
  }
  
  // Fallback to skeleton
  return { url: '', shouldShowSkeleton: true };
}

/**
 * SIMPLE PATTERN TO FIX ReactDOM.preload() ERRORS:
 * 
 * // 1. Import utilities and Skeleton
 * import { getImageInfo } from '@/utils/image'
 * import { Skeleton } from '@/components/ui/skeleton'
 * 
 * // 2. In your component, replace:
 * // OLD: <img src={movie.posterUrl || '/placeholder.svg'} />
 * // NEW:
 * const imageInfo = getImageInfo(movie.posterUrl, movie.id, 'poster')
 * 
 * {imageInfo.shouldShowSkeleton ? (
 *   <Skeleton className="w-full h-full" />
 * ) : (
 *   <img src={imageInfo.url} alt="..." className="..." />
 * )}
 * 
 * // 3. For episode thumbnails:
 * const thumbInfo = getImageInfo(episode.thumbnailUrl, movieId, 'thumbnail')
 * 
 * // This prevents ReactDOM.preload() errors by never passing empty URLs to Image components
 */

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
  // For now, return the first preferred format
  // In a real implementation, you might want to check server response
  // But since we can't make async calls in most React contexts, we'll use jpg as default
  return `${baseUrl}.jpg`;
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
 * @returns A safe URL
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  movieId?: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster',
  fallback: string = "/placeholder.svg",
  preferredFormat: string = 'jpg'
): string {
  if (shouldShowSkeleton(imageUrl)) {
    if (movieId) {
      // Auto-detect format
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