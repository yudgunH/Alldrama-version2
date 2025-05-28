import { useCallback, useMemo } from 'react';
import { Movie } from '@/types';
import { useMovies } from '@/hooks/api/useMovies';
import useSWR, { mutate as globalMutate } from 'swr';

// Define section types for better type safety and reusability
export type SectionType = 'newest' | 'popular' | 'featured' | 'trending' | 'action' | 'drama';

export interface SectionConfig {
  type: SectionType;
  title: string;
  limit?: number;
  sortFn?: (a: Movie, b: Movie) => number;
  filterFn?: (movie: Movie) => boolean;
}

// Default sections configuration
export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    type: 'newest',
    title: 'Phim mới nhất',
    limit: 10,
    sortFn: (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  },
  {
    type: 'popular',
    title: 'Phim xem nhiều',
    limit: 10,
    sortFn: (a, b) => (b.views || 0) - (a.views || 0)
  },
  {
    type: 'featured',
    title: 'Phim đánh giá cao',
    limit: 10,
    sortFn: (a, b) => (b.rating || 0) - (a.rating || 0)
  },
  {
    type: 'trending',
    title: 'Phim đang hot',
    limit: 10,
    sortFn: (a, b) => ((b.views || 0) * (b.rating || 0)) - ((a.views || 0) * (a.rating || 0))
  },
  {
    type: 'action',
    title: 'Phim hành động',
    limit: 10,
    filterFn: (movie) => movie.genres?.some(genre => genre.id === 1)
  },
  {
    type: 'drama',
    title: 'Phim tình cảm',
    limit: 10,
    filterFn: (movie) => movie.genres?.some(genre => genre.id === 3)
  }
];

interface HomepageData {
  sections: {
    [key in SectionType]: Movie[];
  };
}

// SWR cache key for homepage data
const SWR_CACHE_KEY = 'homepage_data';

// Static method to clear homepage cache from anywhere
export const clearHomepageCache = () => {
  globalMutate(SWR_CACHE_KEY, undefined, { revalidate: false });
};

export const useHomepageData = (sections: SectionConfig[] = DEFAULT_SECTIONS) => {
  const { getAllMovies } = useMovies();

  // Data fetcher for SWR - fetches all movies at once
  const fetchHomepageData = useCallback(async () => {
    try {
      const allMovies = await getAllMovies();
      
      if (!allMovies) {
        throw new Error('Failed to fetch movies');
      }

      // Process each section
      const sectionsData = sections.reduce((acc, section) => {
        let movies = [...allMovies];

        // Apply filter if exists
        if (section.filterFn) {
          movies = movies.filter(section.filterFn);
        }

        // Apply sort if exists
        if (section.sortFn) {
          movies.sort(section.sortFn);
        }

        // Apply limit
        if (section.limit) {
          movies = movies.slice(0, section.limit);
        }

        acc[section.type] = movies;
        return acc;
      }, {} as HomepageData['sections']);

      return { sections: sectionsData };
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      throw err;
    }
  }, [getAllMovies, sections]);

  // Use SWR for data fetching and caching
  const { 
    data, 
    error: swrError, 
    isLoading: swrIsLoading, 
    isValidating, 
    mutate 
  } = useSWR<HomepageData>(
    SWR_CACHE_KEY, 
    fetchHomepageData, 
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: true,
      dedupingInterval: 5000
    }
  );

  // Memoize sections data to prevent unnecessary re-renders
  const sectionsData = useMemo(() => {
    if (!data?.sections) {
      return sections.reduce((acc, section) => {
        acc[section.type] = [];
        return acc;
      }, {} as HomepageData['sections']);
    }
    return data.sections;
  }, [data?.sections, sections]);

  return {
    sections: sectionsData,
    isLoading: swrIsLoading,
    error: swrError,
    isRefreshing: isValidating && !swrIsLoading,
    refreshData: mutate
  };
};
