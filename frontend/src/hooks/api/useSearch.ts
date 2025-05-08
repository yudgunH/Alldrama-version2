import useSWR from 'swr';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Movie, Genre, MovieSearchParams } from '@/types';

export type SearchFilters = {
  query?: string;
  genre?: string;
  year?: string;
  sortBy?: string;
};

export type SearchResults = {
  movies: Movie[];
  genres: Genre[];
  years: number[];
  total: number;
  loading: boolean;
  error: any;
};

// Custom fetcher sử dụng axios
const apiGet = (url: string) => axios.get(url).then(res => res.data);

export const useSearch = (filters: SearchFilters = {}) => {
  const { query = '', genre = '', year = '', sortBy = '' } = filters;
  
  // Fetch danh sách thể loại
  const { data: genresData, error: genresError } = useSWR(
    API_ENDPOINTS.GENRES.LIST,
    apiGet
  );
  
  // Tạo URL với các query params
  let url = API_ENDPOINTS.MOVIES.SEARCH;
  
  // Xây dựng các tham số tìm kiếm
  const params = new URLSearchParams();
  
  if (query) params.append('q', query);
  
  // Nếu có thể loại, tìm kiếm ID của thể loại và thêm vào params
  // Lấy danh sách genres từ API
  // Xử lý cho cả trường hợp API trả về mảng thể loại trực tiếp hoặc đối tượng có thuộc tính genres
  const genres = (() => {
    if (!genresData) return [];
    
    // Nếu genresData là mảng, sử dụng trực tiếp
    if (Array.isArray(genresData)) {
      return genresData;
    }
    
    // Nếu genresData là đối tượng có thuộc tính genres, sử dụng thuộc tính genres
    if (genresData.genres && Array.isArray(genresData.genres)) {
      return genresData.genres;
    }
    
    return [];
  })();
  
  // Nếu có genre filter và genres đã load, tìm ID của genre
  if (genre && genres.length > 0) {
    // Tìm genre theo tên
    const selectedGenre = genres.find((g: Genre) => g.name === genre);
    
    // Nếu tìm thấy genre, sử dụng ID thay vì tên
    if (selectedGenre) {
      params.append('genre', selectedGenre.id.toString());
    } else {
      // Nếu không tìm thấy, thực hiện client-side filtering
      console.log(`Genre "${genre}" not found in database, will filter client-side`);
    }
  }
  
  // Nếu có năm, thêm vào params
  if (year) params.append('year', year);
  
  const searchUrl = `${url}?${params.toString()}`;

  // Fetch dữ liệu tìm kiếm
  const { data, error, isLoading, isValidating } = useSWR(
    query || genre || year ? searchUrl : null,
    apiGet
  );
  
  // Fetch tất cả phim nếu cần thiết cho việc lọc
  const { data: allMoviesData } = useSWR(
    // Chỉ fetch khi chưa có dữ liệu tìm kiếm và đang ở trang tìm kiếm
    !isLoading && !data ? `${API_ENDPOINTS.MOVIES.LIST}?limit=1000&fields=releaseYear,genres` : null,
    apiGet
  );
  
  // Tạo danh sách các năm phát hành từ dữ liệu phim
  const years = (() => {
    // Ưu tiên sử dụng dữ liệu từ phim đã tìm kiếm
    const movieList = data?.movies || allMoviesData?.movies || [];
    
    if (movieList.length > 0) {
      const yearsSet = new Set(
        movieList
          .map((movie: Movie) => movie.releaseYear)
          .filter(Boolean) as number[]
      );
      return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    }
    
    return [];
  })();
  
  // Xử lý dữ liệu phim - lọc và sắp xếp
  const processedMovies = (() => {
    if (!data?.movies && !allMoviesData?.movies) return [];
    
    // Sử dụng kết quả từ API tìm kiếm nếu có, nếu không thì dùng tất cả phim
    let movies = [...(data?.movies || allMoviesData?.movies || [])];
    
    // Nếu có thể loại nhưng API không hỗ trợ lọc hoặc không tìm thấy ID genre, thực hiện lọc ở client
    if (genre && !data?.filtered_by_genre) {
      movies = movies.filter((movie: Movie) => {
        if (!movie.genres) return false;
        
        // Kiểm tra xem thể loại có trong danh sách thể loại của phim không
        return movie.genres.some((g: any) => {
          // Xử lý trường hợp genres là mảng chuỗi hoặc mảng đối tượng
          if (typeof g === 'string') {
            return g.toLowerCase() === genre.toLowerCase();
          } else if (typeof g === 'object' && g !== null) {
            return g.name?.toLowerCase() === genre.toLowerCase();
          }
          return false;
        });
      });
    }
    
    // Lọc theo năm nếu API không hỗ trợ
    if (year && !data?.filtered_by_year) {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        movies = movies.filter((movie: Movie) => movie.releaseYear === yearNum);
      }
    }
    
    // Sắp xếp theo tiêu chí nếu có
    if (sortBy === 'rating-desc') {
      return movies.sort((a, b) => {
        const ratingA = typeof a.rating === 'number' ? a.rating : 0;
        const ratingB = typeof b.rating === 'number' ? b.rating : 0;
        return ratingB - ratingA;
      });
    } else if (sortBy === 'views-desc') {
      return movies.sort((a, b) => {
        const viewsA = typeof a.views === 'number' ? a.views : 0;
        const viewsB = typeof b.views === 'number' ? b.views : 0;
        return viewsB - viewsA;
      });
    }
    
    return movies;
  })();

  console.log("Loaded genres:", genres); // Debug log

  return {
    movies: processedMovies,
    genres,
    years,
    total: data?.total || processedMovies.length || 0,
    loading: isLoading || isValidating,
    error: error || genresError
  };
}; 