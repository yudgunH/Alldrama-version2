'use client'

import Hero from '@/components/ui/Hero';
import MovieSlider from '@/components/features/movie/MovieSlider';
import TopMoviesSection from '@/components/features/movie/TopMoviesSection';
import GenreList from '@/components/features/genre/GenreList';
import CommentsAndRankings from "@/components/features/movie/CommentsAndRankings"
import FeaturedContentSwitcher from '@/components/features/movie/FeaturedContentSwitcher';
import MovieDetailCard from '@/components/features/movie/MovieDetailCard';
import { useHomepageData, DEFAULT_SECTIONS } from '@/hooks/api/useHomepageData';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { Movie } from '@/types';

export default function Home() {
  // Track visible sections for lazy loading
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['newest']));
  
  // Use custom hook to get all homepage data
  const { 
    sections,
    isLoading, 
    error 
  } = useHomepageData(DEFAULT_SECTIONS);

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
      <Hero 
        movies={sections.featured} 
        isLoading={isLoading}
      />
      {/* Top 10 Movies Section with trapezoid cards */}
      <TopMoviesSection 
        movies={sections.trending} 
        isLoading={isLoading}
        title="Top 10 Phim Đang Hot"
        limit={10}
      />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Movie Detail Cards Section */}
        <section className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.featured?.slice(0, 3).map((movie: Movie) => (
              <MovieDetailCard
                key={movie.id}
                movie={movie}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
        <FeaturedContentSwitcher
          items={sections.featured}
          title="Phim nổi bật"
          variant="dark"
          aspectRatio="video"
          isLoading={isLoading}
        />
        {/* Section for featured movie sliders */}
        <section className="py-4 space-y-12">
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
        <section className="py-8 mt-8">
          <GenreList />
        </section>
      </div>
    </div>
  );
}
