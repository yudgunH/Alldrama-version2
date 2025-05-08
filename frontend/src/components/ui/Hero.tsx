'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/types';
import { generateMovieUrl } from '@/utils/url';
import { motion } from 'framer-motion';
import { Play, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

// CSS cho hiệu ứng và style
const heroStyles = `
  .bg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
    background-repeat: repeat;
  }
  
  .hero-text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  }
  
  .hero-description {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }
  
  .hero-tag {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
  
  .hover-scale {
    transition: transform 0.3s ease;
  }
  
  .hover-scale:hover {
    transform: scale(1.05);
  }
  
  .hero-gradient-overlay {
    background: linear-gradient(to right, 
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.85) 30%,
      rgba(0, 0, 0, 0.65) 60%,
      rgba(0, 0, 0, 0.2) 100%
    );
  }
  
  @media (max-width: 768px) {
    .hero-gradient-overlay {
      background: linear-gradient(to right,
        rgba(0, 0, 0, 0.95) 0%,
        rgba(0, 0, 0, 0.85) 40%,
        rgba(0, 0, 0, 0.7) 100%
      );
    }
  }
`;

const Hero = () => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tạo hiệu ứng loading
    const timer = setTimeout(() => {
      // setFeaturedMovie(mockMovies[0]);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !featuredMovie) {
    return (
      <div className="h-[70vh] sm:h-[80vh] bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <div className="animate-pulse space-y-8">
            <div className="h-12 sm:h-16 bg-gray-800 rounded-lg max-w-[70%]"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-800 rounded max-w-[90%]"></div>
              <div className="h-4 bg-gray-800 rounded max-w-[80%]"></div>
              <div className="h-4 bg-gray-800 rounded max-w-[60%]"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 bg-amber-800/50 rounded-full"></div>
              <div className="h-10 w-32 bg-gray-800/80 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{heroStyles}</style>
      <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[85vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={featuredMovie.posterUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top sm:object-center"
            quality={90}
          />
          
          {/* Gradient overlay chính */}
          <div className="absolute inset-0 hero-gradient-overlay" />
          
          {/* Thêm hiệu ứng overlay màu nhẹ */}
          <div className="absolute inset-0 bg-amber-900/10 mix-blend-overlay" />
          
          {/* Thêm hiệu ứng nền noise texture */}
          <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        </div>

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-xl md:max-w-2xl space-y-5 sm:space-y-6 pt-16 sm:pt-0"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight hero-text-shadow">
              {featuredMovie.title}
            </h1>
            
            <p className="text-white hero-description sm:text-lg line-clamp-3 md:line-clamp-4 leading-relaxed">
              {featuredMovie.summary}
            </p>
            
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center text-sm sm:text-base text-white hero-tag">
              <span className="font-medium">{featuredMovie.releaseYear}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <div className="flex items-center">
                <span className="text-amber-400 mr-1.5">★</span>
                <span className="font-medium">{featuredMovie.rating || 0}</span>
                <span className="text-white/90 ml-1">/10</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{new Intl.NumberFormat('vi-VN').format(featuredMovie.views || 0)} lượt xem</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {featuredMovie.genres.slice(0, 3).map((genre, index) => {
                const genreId = typeof genre === 'string' ? genre : genre.id;
                const genreName = typeof genre === 'string' ? genre : genre.name;
                
                return (
                  <Link 
                    key={`${genreId}-${index}`} 
                    href={`/movie?genre=${encodeURIComponent(genreName)}`} 
                    className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600 backdrop-blur-sm rounded-full text-white text-sm transition-all hover-scale border border-amber-500/30"
                  >
                    {genreName}
                  </Link>
                );
              })}
            </div>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Link
                href={generateMovieUrl(featuredMovie.id, featuredMovie.title)}
                className="group px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-full transition-all duration-300 inline-flex items-center shadow-lg shadow-amber-900/30 hover:shadow-xl hover:shadow-amber-900/40 hover:translate-y-[-2px]"
              >
                <div className="relative mr-2 w-5 h-5">
                  <div className="absolute inset-0 bg-white rounded-full opacity-20 group-hover:animate-ping"></div>
                  <Play className="relative z-10 h-5 w-5" fill="white" />
                </div>
                <span>Xem ngay</span>
              </Link>
              <Link
                href={featuredMovie.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group px-6 py-3 bg-black/50 hover:bg-black/70 text-white font-medium rounded-full transition-all duration-300 inline-flex items-center shadow-lg shadow-black/40 backdrop-blur-sm hover:shadow-xl hover:translate-y-[-2px] border border-white/10"
              >
                <Film className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                <span>Xem trailer</span>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Hiệu ứng overlay gradient phía dưới */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
      </section>
    </>
  );
};

export default Hero; 