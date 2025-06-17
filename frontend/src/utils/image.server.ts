/**
 * Server-safe image utilities
 * Không sử dụng localStorage hoặc browser APIs
 */

/**
 * Try to detect image format for a given base URL
 * Returns the first working format or jpg as fallback
 */
async function detectImageFormat(
  baseUrl: string,
  formats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): Promise<string> {
  for (const format of formats) {
    try {
      const testUrl = `${baseUrl}.${format}`;
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        return format;
      }
    } catch (error) {
      // Continue to next format
      continue;
    }
  }
  
  // Fallback to jpg
  return 'jpg';
}

/**
 * Get poster URL with smart format detection
 */
function getPosterUrlWithFormat(movieId: number | string, format: string = 'jpg'): string {
  return `https://media.alldrama.tech/movies/${movieId}/poster.${format}`;
}

/**
 * Get backdrop URL with smart format detection
 */
function getBackdropUrlWithFormat(movieId: number | string, format: string = 'jpg'): string {
  return `https://media.alldrama.tech/movies/${movieId}/backdrop.${format}`;
}

/**
 * Server-safe function to get poster URL with format detection
 */
export function getSafePosterUrl(
  posterUrl: string | null | undefined, 
  movieId?: number | string,
  fallback: string = "/placeholder.svg"
): string {
  // Always try to use the API provided URL first
  if (posterUrl && posterUrl.trim() !== '' && !posterUrl.includes('placeholder') && posterUrl !== '/') {
    try {
      // If it's already a full URL, return as is
      if (posterUrl.startsWith('http')) {
        return posterUrl;
      }
      
      // If it's a relative path, keep as is for local assets
      if (posterUrl.startsWith('/')) {
        return posterUrl;
      }
      
      return posterUrl;
    } catch (error) {
      console.warn('Error processing poster URL:', error);
    }
  }

  // Fallback: construct URL from media server if we have movieId
  // Try multiple formats for better compatibility
  if (movieId) {
    // Return URL with auto-detection query parameter for better format handling
    const baseUrl = `https://media.alldrama.tech/movies/${movieId}/poster`;
    
    // For social sharing, we'll try common formats in order of preference
    // PNG first for better quality, then JPG for compatibility
    return `${baseUrl}.png`;
  }

  return fallback;
}

/**
 * Server-safe function to get backdrop URL with format detection
 */
export function getSafeBackdropUrl(
  backdropUrl: string | null | undefined,
  posterUrl: string | null | undefined,
  movieId?: number | string,
  fallback: string = "/placeholder.svg"
): string {
  // Try backdrop first
  if (backdropUrl && backdropUrl.trim() !== '' && !backdropUrl.includes('placeholder')) {
    try {
      // If it's already a full URL, return as is
      if (backdropUrl.startsWith('http')) {
        return backdropUrl;
      }
      // If relative path, keep as is for local assets
      if (backdropUrl.startsWith('/')) {
        return backdropUrl;
      }
      return backdropUrl;
    } catch (error) {
      console.warn('Error processing backdrop URL:', error);
    }
  }

  // Try to construct backdrop URL from movieId with format detection
  if (movieId) {
    const baseUrl = `https://media.alldrama.tech/movies/${movieId}/backdrop`;
    // Try PNG first, then JPG
    return `${baseUrl}.png`;
  }

  // Fallback to poster if backdrop not available
  if (posterUrl && posterUrl.trim() !== '' && !posterUrl.includes('placeholder')) {
    try {
      // If poster is full URL, convert to backdrop
      if (posterUrl.startsWith('http')) {
        return convertPosterToBackdrop(posterUrl);
      }
      // Convert poster to backdrop format if needed
      const convertedBackdrop = convertPosterToBackdrop(posterUrl);
      if (convertedBackdrop !== posterUrl) {
        return convertedBackdrop;
      }
      return posterUrl;
    } catch (error) {
      console.warn('Error converting poster to backdrop:', error);
    }
  }

  return fallback;
}

/**
 * Convert poster URL to backdrop URL (server-safe)
 */
function convertPosterToBackdrop(posterUrl: string): string {
  if (!posterUrl) return posterUrl;
  
  try {
    // Simple conversion: replace 'poster' with 'backdrop' in path
    if (posterUrl.includes('/poster')) {
      return posterUrl.replace('/poster', '/backdrop');
    }
    // If it's a full poster URL, replace poster.ext with backdrop.ext
    if (posterUrl.includes('poster.')) {
      return posterUrl.replace(/poster\.(jpg|jpeg|png|webp)/, 'backdrop.$1');
    }
    return posterUrl;
  } catch (error) {
    return posterUrl;
  }
}

/**
 * Server-safe function to get image URL
 */
export function getImageUrl(
  imageUrl: string | null | undefined,
  movieId?: number | string,
  type: 'poster' | 'backdrop' | 'thumbnail' = 'poster',
  fallback: string = "/placeholder.svg"
): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return fallback;
  }

  try {
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // If it's a placeholder, return fallback
    if (imageUrl.includes('placeholder') || imageUrl === '/') {
      return fallback;
    }

    // For server-side, return the URL as provided
    return imageUrl;
  } catch (error) {
    console.warn('Error processing image URL:', error);
    return fallback;
  }
}

/**
 * Enhanced function to get poster URL with multiple format fallbacks
 * This function returns multiple URLs to try in order of preference
 */
export function getPosterUrlsWithFallback(
  posterUrl: string | null | undefined,
  movieId?: number | string
): string[] {
  const urls: string[] = [];
  
  // First try the original poster URL if valid
  if (posterUrl && posterUrl.trim() !== '' && !posterUrl.includes('placeholder') && posterUrl !== '/') {
    if (posterUrl.startsWith('http')) {
      urls.push(posterUrl);
    }
  }
  
  // Then try constructed URLs with different formats
  if (movieId) {
    const baseUrl = `https://media.alldrama.tech/movies/${movieId}/poster`;
    // Try in order of preference: PNG (better quality), JPG (better compatibility), JPEG, WebP
    urls.push(`${baseUrl}.png`);
    urls.push(`${baseUrl}.jpg`);
    urls.push(`${baseUrl}.jpeg`);
    urls.push(`${baseUrl}.webp`);
  }
  
  return urls;
}

/**
 * Enhanced function to get backdrop URL with multiple format fallbacks
 */
export function getBackdropUrlsWithFallback(
  backdropUrl: string | null | undefined,
  posterUrl: string | null | undefined,
  movieId?: number | string
): string[] {
  const urls: string[] = [];
  
  // First try the original backdrop URL if valid
  if (backdropUrl && backdropUrl.trim() !== '' && !backdropUrl.includes('placeholder')) {
    if (backdropUrl.startsWith('http')) {
      urls.push(backdropUrl);
    }
  }
  
  // Then try constructed backdrop URLs
  if (movieId) {
    const baseUrl = `https://media.alldrama.tech/movies/${movieId}/backdrop`;
    urls.push(`${baseUrl}.png`);
    urls.push(`${baseUrl}.jpg`);
    urls.push(`${baseUrl}.jpeg`);
    urls.push(`${baseUrl}.webp`);
  }
  
  // Finally try converting poster URLs to backdrop
  if (posterUrl && posterUrl.trim() !== '' && !posterUrl.includes('placeholder')) {
    if (posterUrl.startsWith('http')) {
      urls.push(convertPosterToBackdrop(posterUrl));
    }
  }
  
  return urls;
} 