'use client'
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Movie } from '@/types';
import { generateMovieUrl } from '@/utils/url';
import { getImageInfo } from '@/utils/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Film, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

interface HeroProps {
  movies?: Movie[];
  isLoading?: boolean;
}

const Hero = ({ movies = [], isLoading = false }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showTrailer, setShowTrailer] = useState(false);

  // Get featured movies (top 5)
  const featuredMovies = movies.slice(0, 5);
  const currentMovie = featuredMovies[currentIndex];

  // Auto-rotate through featured movies every 10 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1 || showTrailer) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 10000); // 10 seconds per slide

    return () => clearInterval(interval);
  }, [featuredMovies.length, showTrailer]);

  const handleImageError = useCallback((url: string) => {
    setFailedImages(prev => new Set(prev).add(url));
  }, []);

  const handleSlideChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  const handleTrailerClick = useCallback(() => {
    setShowTrailer(true);
  }, []);

  const handleCloseTrailer = useCallback(() => {
    setShowTrailer(false);
  }, []);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (isLoading || !currentMovie) {
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

  // Get backdrop image info
  const backdropInfo = getImageInfo(
    currentMovie.backdropUrl || currentMovie.posterUrl, 
    currentMovie.id, 
    'backdrop'
  );
  const shouldShowSkeleton = backdropInfo.shouldShowSkeleton || failedImages.has(backdropInfo.url);

  return (
    <>
      <style jsx global>{heroStyles}</style>
      <section className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[85vh] overflow-hidden">
        {/* Background Images with Smooth Transitions */}
        <div className="absolute inset-0 w-full h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`bg-${currentMovie.id}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing
              }}
              className="absolute inset-0 w-full h-full"
            >
              {shouldShowSkeleton ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <Image
                  src={backdropInfo.url}
                  alt={currentMovie.title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center"
                  quality={90}
                  onError={() => {
                    console.log('Hero - Background image load error for movie:', currentMovie.id);
                    handleImageError(backdropInfo.url);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Gradient overlay chính */}
          <div className="absolute inset-0 hero-gradient-overlay" />
          
          {/* Thêm hiệu ứng overlay màu nhẹ */}
          <div className="absolute inset-0 bg-amber-900/10 mix-blend-overlay" />
          
          {/* Thêm hiệu ứng nền noise texture */}
          <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        </div>

        {/* Content with Smooth Animations */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`content-${currentMovie.id}`}
              initial={{ opacity: 0, x: -50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, y: -20 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.1
              }}
              className="max-w-xl md:max-w-2xl space-y-5 sm:space-y-6 pt-16 sm:pt-0"
            >
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight hero-text-shadow"
              >
                {currentMovie.title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-white hero-description sm:text-lg line-clamp-3 md:line-clamp-4 leading-relaxed"
              >
                {currentMovie.summary || 'Một bộ phim đáng xem với nội dung hấp dẫn và diễn xuất tuyệt vời.'}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-2 sm:gap-3 items-center text-sm sm:text-base text-white hero-tag"
              >
                <span className="font-medium">{currentMovie.releaseYear || 'N/A'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <div className="flex items-center">
                  <span className="text-amber-400 mr-1.5">★</span>
                  <span className="font-medium">
                    {currentMovie.rating 
                      ? (typeof currentMovie.rating === 'number' 
                          ? currentMovie.rating.toFixed(1) 
                          : currentMovie.rating)
                      : '8.5'}
                  </span>
                  <span className="text-white/90 ml-1">/10</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{new Intl.NumberFormat('vi-VN').format(currentMovie.views || 0)} lượt xem</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap items-center gap-2 pt-1"
              >
                {currentMovie.genres?.slice(0, 3).map((genre, index) => {
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
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap gap-3 sm:gap-4 pt-4 sm:pt-6"
              >
                <Link
                  href={generateMovieUrl(currentMovie.id, currentMovie.title)}
                  className="group px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-full transition-all duration-300 inline-flex items-center shadow-lg shadow-amber-900/30 hover:shadow-xl hover:shadow-amber-900/40 hover:translate-y-[-2px]"
                >
                  <div className="relative mr-2 w-5 h-5">
                    <div className="absolute inset-0 bg-white rounded-full opacity-20 group-hover:animate-ping"></div>
                    <Play className="relative z-10 h-5 w-5" fill="white" />
                  </div>
                  <span>Xem ngay</span>
                </Link>
                {currentMovie.trailerUrl && (
                  <button
                    onClick={handleTrailerClick}
                    className="group px-6 py-3 bg-black/50 hover:bg-black/70 text-white font-medium rounded-full transition-all duration-300 inline-flex items-center shadow-lg shadow-black/40 backdrop-blur-sm hover:shadow-xl hover:translate-y-[-2px] border border-white/10"
                  >
                    <Film className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                    <span>Xem trailer</span>
                  </button>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Movie Indicators with Progress */}
        {featuredMovies.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="flex gap-3 items-center">
              {featuredMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  className={cn(
                    "relative h-2 rounded-full transition-all duration-300",
                    index === currentIndex 
                      ? "bg-amber-500 w-12" 
                      : "bg-white/30 hover:bg-white/50 w-2"
                  )}
                >
                  {/* Progress bar for current slide */}
                  {index === currentIndex && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 10, ease: "linear" }}
                      className="absolute top-0 left-0 h-full bg-amber-300 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Hiệu ứng overlay gradient phía dưới */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && currentMovie.trailerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseTrailer}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseTrailer}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>

              {/* YouTube Embed */}
              {(() => {
                const videoId = getYouTubeVideoId(currentMovie.trailerUrl);
                if (videoId) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                      title={`${currentMovie.title} - Trailer`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                } else {
                  // Fallback for non-YouTube URLs
                  return (
                    <video
                      src={currentMovie.trailerUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    >
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                  );
                }
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Hero; 