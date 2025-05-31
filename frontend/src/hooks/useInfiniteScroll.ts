import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  setIsFetching: (fetching: boolean) => void;
  lastElementRef: (node: HTMLElement | null) => void;
}

export const useInfiniteScroll = (
  fetchMore: () => Promise<void> | void,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn => {
  const {
    threshold = 100,
    rootMargin = '0px',
    enabled = true,
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const fetchingRef = useRef(false);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (!enabled || !hasMore || fetchingRef.current) return;
      
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !fetchingRef.current) {
            fetchingRef.current = true;
            setIsFetching(true);
            
            Promise.resolve(fetchMore())
              .then(() => {
                setIsFetching(false);
                fetchingRef.current = false;
              })
              .catch((error) => {
                console.error('Error fetching more data:', error);
                setIsFetching(false);
                fetchingRef.current = false;
              });
          }
        },
        {
          rootMargin,
          threshold: 0.1,
        }
      );
      
      if (node) observer.current.observe(node);
    },
    [fetchMore, hasMore, enabled, rootMargin]
  );

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    isFetching,
    setIsFetching,
    lastElementRef,
  };
};

// Alternative scroll-based infinite scroll
export const useScrollInfiniteScroll = (
  fetchMore: () => Promise<void> | void,
  hasMore: boolean,
  threshold: number = 100
) => {
  const [isFetching, setIsFetching] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || fetchingRef.current) return;

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        fetchingRef.current = true;
        setIsFetching(true);
        
        Promise.resolve(fetchMore())
          .then(() => {
            setIsFetching(false);
            fetchingRef.current = false;
          })
          .catch((error) => {
            console.error('Error fetching more data:', error);
            setIsFetching(false);
            fetchingRef.current = false;
          });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchMore, hasMore, threshold]);

  return {
    isFetching,
    setIsFetching,
  };
}; 