'use client'

import Link from 'next/link';
import { useGenres } from '@/hooks/api/useGenres';
import { Skeleton } from '@/components/ui/skeleton';

const GenreList = () => {
  const { genres, loading, error } = useGenres();
  
  // Loading state
  if (loading) {
    return (
      <div className="py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="py-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Thể loại phim</h2>
        <div className="bg-red-900/30 border border-red-700 rounded-md p-4">
          <p className="text-red-300">Không thể tải danh sách thể loại</p>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!genres || genres.length === 0) {
    return null;
  }

  return (
    <div className="py-6">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Thể loại phim</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={`/movies?genre=${genre.id}`}
            className="bg-gray-800 hover:bg-indigo-600 text-center p-3 rounded-lg transition-colors"
          >
            <span className="text-white font-medium">{genre.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GenreList;