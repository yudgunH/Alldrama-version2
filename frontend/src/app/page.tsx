'use client'

import Hero from '@/components/ui/Hero';
import MovieSlider from '@/components/features/movie/MovieSlider';
import TopMoviesSection from '@/components/features/movie/TopMoviesSection';
import GenreList from '@/components/features/genre/GenreList';
import CommentsAndRankings from "@/components/features/movie/CommentsAndRankings"
import FeaturedContentSwitcher from '@/components/features/movie/FeaturedContentSwitcher';
import { useHomepageData } from '@/hooks/api/useHomepageData';
import { Skeleton } from '@/components/ui/skeleton';


export default function Home() {
  // Sử dụng custom hook để lấy tất cả dữ liệu trang chủ trong 1 lần gọi API
  const { 
    newest, 
    popular, 
    featured, 
    trending, 
    genres, 
    isLoading, 
    error 
  } = useHomepageData();


  // Hiển thị lỗi nếu có
  if (error) {
    return (
      <div className="h-[70vh] bg-gray-800 animate-pulse flex items-center justify-center">
        <Skeleton className="w-3/4 h-[80%] max-w-7xl mx-auto rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Hero />
      
      {/* Top 10 Movies Section with trapezoid cards */}
      {/* <TopMoviesSection 
        movies={trending} 
        isLoading={isLoading}
        title="Top 10 Phim Đang Hot"
        limit={10}
      /> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section for featured movie sliders */}
        <section className="py-4 space-y-12">
          <MovieSlider 
            title="Phim mới nhất" 
            movies={newest}
            size="md"
            variant="new" 
          />
          
          <MovieSlider 
            title="Phim xem nhiều" 
            movies={popular}
            size="md"
            variant="popular" 
          />
{/*           
          <MovieSlider 
            title="Phim đánh giá cao" 
            movies={featured}
            size="md"
            variant="top" 
          />
          
          <MovieSlider 
            title="Phim đang hot" 
            movies={trending}
            size="md"
            variant="trending"
          /> */}
          
          {/* Phim theo thể loại */}
          {/* {genres && genres[1]?.length > 0 && (
            <MovieSlider 
              title="Phim hành động" 
              movies={genres[1]}
              size="md"
            />
          )}
          
          {genres && genres[3]?.length > 0 && (
            <MovieSlider 
              title="Phim tình cảm" 
              movies={genres[3]}
              size="md"
            />
          )} */}
        </section>
        
        {/* Genre list section */}
        {/* <section className="py-8 mt-8">
          <GenreList />
        </section> */}
      </div>
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommentsAndRankings />
      </div> */}

      <FeaturedContentSwitcher
        items={featured}
        title="Phim nổi bật"
        variant="dark"
        aspectRatio="video"
        isLoading={isLoading}
      />
    </div>
  );
}
