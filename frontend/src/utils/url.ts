export function createSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
    .toLowerCase()
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function getIdFromSlug(slug: string): string {
  // Pattern for slug like "phim-hanh-dong-1-1", "ten-phim-123", etc.
  // We want to extract just the numeric ID at the end
  
  // First, look for numeric ID at the end of the slug
  const numericIdRegex = /-(\d+)$/;
  const match = slug.match(numericIdRegex);
  
  if (match && match[1]) {
    console.log("Found numeric ID at end of slug:", match[1]);
    return match[1]; // Return just the numeric ID
  }
  
  // If that fails, try another approach by splitting on hyphens
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Check if the last part is numeric
  if (lastPart && !isNaN(Number(lastPart))) {
    console.log("Found numeric ID by splitting:", lastPart);
    return lastPart;
  }
  
  // If that fails too, try to find any number in the slug
  const anyNumberRegex = /(\d+)/;
  const numberMatch = slug.match(anyNumberRegex);
  
  if (numberMatch && numberMatch[1]) {
    console.log("Found any numeric part in slug:", numberMatch[1]);
    return numberMatch[1];
  }
  
  console.log("All extraction methods failed, returning original slug");
  return slug; // Return the original slug as fallback
}

export function getEpisodeIdFromSlug(slug: string): string {
  // Format của slug là: episode-2-1-tap-1
  // Chúng ta cần lấy phần episode-2-1
  const regex = /^(episode-[\d-]+)/;
  const match = slug.match(regex);
  
  if (match && match[1]) {
    // Xử lý trường hợp có nhiều dấu gạch ngang trong ID (episode-2-1)
    // Tìm vị trí của "tap" trong slug và lấy phần trước đó
    const tapIndex = slug.indexOf('-tap-');
    if (tapIndex > 0) {
      console.log("Episode ID by tap index:", slug.substring(0, tapIndex));
      return slug.substring(0, tapIndex);
    }
    
    console.log("Episode regex match found:", match[1]);
    return match[1];
  }
  
  console.log("Episode regex match not found, trying fallback");
  // Fallback: lấy các phần đầu tiên của slug
  const parts = slug.split('-');
  if (parts.length >= 2) {
    console.log("Episode fallback returning:", parts[0] + '-' + parts[1]);
    return parts[0] + '-' + parts[1];
  }
  
  console.log("All episode extraction methods failed, returning original slug");
  return slug;
}

export function generateMovieUrl(movie: { id: string | number; title: string } | string | number, title?: string): string {
  // Nếu tham số đầu tiên là object Movie
  if (typeof movie === 'object' && movie !== null) {
    // Đường dẫn /movie/ten-phim-123 cho trang chi tiết phim (thêm ID vào slug)
    return `/movie/${createSlug(movie.title)}-${movie.id}`;
  }
  
  // Nếu truyền riêng id và title
  if (movie !== undefined && title) {
    return `/movie/${createSlug(title)}-${movie}`;
  }
  
  // Fallback case
  console.error('Invalid arguments for generateMovieUrl');
  return '/';
}

export function generateWatchUrl(
  movieId: string | number, 
  movieTitle: string, 
  episodeId?: string | number, 
  episodeNumber?: number
): string {
  // Nếu có episodeId, đây là trang xem tập phim
  if (episodeId !== undefined && episodeNumber) {
    // Đường dẫn đơn giản /watch/ten-phim?episode=123&ep=1
    return `/watch/${createSlug(movieTitle)}-${movieId}?episode=${String(episodeId)}&ep=${episodeNumber}`;
  }
  
  // Nếu không có episodeId, đây là trang xem phim
  return `/watch/${createSlug(movieTitle)}-${movieId}`;
}

// Add a utility function to debug URL generation
export function debugUrlGeneration(id: string | number, title: string): void {
  console.log(`Generating URL for movie: ID=${id}, Title=${title}`);
  const slug = createSlug(title);
  console.log(`Generated slug: ${slug}`);
  const fullUrl = `/movie/${slug}-${id}`;
  console.log(`Final URL: ${fullUrl}`);
}