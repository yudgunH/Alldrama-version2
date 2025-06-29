'use client'

import Hero from '@/components/ui/Hero';
import MovieSlider from '@/components/features/movie/MovieSlider';
import TopMoviesSection from '@/components/features/movie/TopMoviesSection';
import GenreList from '@/components/features/genre/GenreList';
import CommentsAndRankings from "@/components/features/movie/CommentsAndRankings"
import FeaturedContentSwitcher from '@/components/features/movie/FeaturedContentSwitcher';
import MovieDetailCard from '@/components/features/movie/MovieDetailCard';
import HomepageSEOContent from '@/components/seo/HomepageSEOContent';
import { useHomepageData, DEFAULT_SECTIONS } from '@/hooks/api/useHomepageData';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { Movie } from '@/types';
import NativeBanner from '@/components/ui/NativeBanner';

export default function Home() {
  // Track visible sections for lazy loading
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['newest']));
  // State to store random featured movies (only calculated once)
  const [randomFeaturedMovies, setRandomFeaturedMovies] = useState<Movie[]>([]);
  
  // Use custom hook to get all homepage data
  const { 
    sections,
    isLoading, 
    error 
  } = useHomepageData(DEFAULT_SECTIONS);

  // Effect to set random featured movies only once when featured data is available
  useEffect(() => {
    if (sections.trending && sections.trending.length > 0 && randomFeaturedMovies.length === 0) {
      const shuffled = [...sections.trending].sort(() => Math.random() - 0.5);
      setRandomFeaturedMovies(shuffled.slice(0, 3));
    }
  }, [sections.trending, randomFeaturedMovies.length]);

  // Create refs for each section
  const sectionRefs = DEFAULT_SECTIONS.reduce((acc, section) => {
    acc[section.type] = useInView({
      triggerOnce: true,
      threshold: 0.1,
      onChange: (inView: boolean) => {
        if (inView) {
          setVisibleSections(prev => new Set([...prev, section.type]));
        }
      }
    });
    return acc;
  }, {} as Record<string, ReturnType<typeof useInView>>);

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
      {/* SEO Content & Structured Data */}
      <HomepageSEOContent />
      
      {/* Main Content */}
      <main>
        <Hero />
        
        {/* Native Banner sau Hero */}
        <section className="py-4">
          <NativeBanner style="full" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
        </section>
        
        {/* Top 10 Movies Section with trapezoid cards */}
        <section aria-label="Phim đang hot">
          <TopMoviesSection 
            movies={sections.trending} 
            isLoading={isLoading}
            title="Top 10 Phim Đang Hot"
            limit={10}
          />
        </section>

        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Movie Detail Cards Section */}
          <section className="py-8" aria-label="Phim nổi bật">
            <h2 className="text-2xl font-bold text-white mb-6">Phim Nổi Bật Hôm Nay</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {randomFeaturedMovies.map((movie: Movie) => (
                <MovieDetailCard
                  key={movie.id}
                  movie={movie}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </section>
          
          <section aria-label="Phim được giới thiệu">
            <FeaturedContentSwitcher
              items={sections.featured}
              title="Phim nổi bật"
              variant="dark"
              aspectRatio="video"
              isLoading={isLoading}
            />
          </section>

          {/* Native Banner giữa featured và movie sliders */}
          <section className="py-6">
            <NativeBanner style="compact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
          </section>
          
          {/* Section for featured movie sliders */}
          <section className="py-4 space-y-12" aria-label="Danh sách phim theo danh mục">
            {DEFAULT_SECTIONS.map((section) => (
              <div 
                key={section.type}
                ref={sectionRefs[section.type].ref}
                className={visibleSections.has(section.type) ? 'block' : 'h-96'}
              >
                {visibleSections.has(section.type) && (
                  <MovieSlider 
                    title={section.title}
                    movies={sections[section.type]}
                    size="md"
                    variant={section.type === 'newest' ? 'new' : 
                            section.type === 'popular' ? 'popular' :
                            section.type === 'featured' ? 'top' :
                            section.type === 'trending' ? 'trending' : 'default'}
                  />
                )}
              </div>
            ))}
          </section>
          
          {/* Genre list section */}
          <section className="py-8 mt-8" aria-label="Thể loại phim">
            <h2 className="text-2xl font-bold text-white mb-6">Khám Phá Theo Thể Loại</h2>
            <GenreList />
          </section>

          {/* Native Banner cuối trang */}
          <section className="py-8">
            <NativeBanner style="full" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
          </section>
          
          {/* Additional SEO Content Section */}
          <section className="py-12 mt-16 bg-gray-900/50 rounded-lg px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Tại Sao Chọn AllDrama Để Xem Phim?
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                <strong>All Drama</strong> là nền tảng xem phim trực tuyến miễn phí hàng đầu tại Việt Nam, 
                chuyên cung cấp <strong>drama châu Á</strong> chất lượng cao. Từ <strong>K-Drama Hàn Quốc</strong> 
                lãng mạn đến <strong>phim Trung Quốc</strong> đầy kịch tính, từ <strong>phim Thái Lan</strong> 
                ngọt ngào đến <strong>phim Nhật Bản</strong> tinh tế - tất cả đều có <strong>phụ đề tiếng Việt</strong> 
                chất lượng HD.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500 mb-2">10,000+</div>
                  <div className="text-gray-400">Bộ phim và series</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500 mb-2">100%</div>
                  <div className="text-gray-400">Miễn phí</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500 mb-2">HD</div>
                  <div className="text-gray-400">Chất lượng cao</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-500 mb-2">24/7</div>
                  <div className="text-gray-400">Cập nhật liên tục</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
