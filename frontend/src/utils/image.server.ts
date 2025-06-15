/**
 * Server-safe image utilities
 * Không sử dụng localStorage hoặc browser APIs
 */

/**
 * Server-safe function to get poster URL
 */
export function getSafePosterUrl(
  posterUrl: string | null | undefined, 
  movieId?: number | string,
  fallback: string = "/placeholder.svg"
): string {
  if (!posterUrl || posterUrl.trim() === '') {
    // If we have movieId, try to construct poster URL
    if (movieId) {
      return `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
    }
    return fallback;
  }

  try {
    // If it's already a full URL, return as is
    if (posterUrl.startsWith('http')) {
      return posterUrl;
    }

    // If it's a placeholder or invalid, try to construct from movieId
    if (posterUrl.includes('placeholder') || posterUrl === '/') {
      if (movieId) {
        return `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
      }
      return fallback;
    }

    // If it's a relative path, make it absolute
    if (posterUrl.startsWith('/')) {
      return posterUrl; // Keep relative for local assets
    }

    // For server-side, construct full URL if we have movieId
    if (movieId) {
      return `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
    }

    return posterUrl;
  } catch (error) {
    console.warn('Error processing poster URL:', error);
    if (movieId) {
      return `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
    }
    return fallback;
  }
}

/**
 * Server-safe function to get backdrop URL
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

  // Try to construct backdrop URL from movieId
  if (movieId) {
    return `https://media.alldrama.tech/movies/${movieId}/backdrop.jpg`;
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