import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  lastElementRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll(
  loadMore: () => Promise<void> | void,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    threshold = 200,
    rootMargin = '0px',
    enabled = true,
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetching || !enabled || !hasMore) return;
      
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        async (entries) => {
          if (entries[0].isIntersecting && hasMore && enabled) {
            setIsFetching(true);
            try {
              await loadMore();
            } catch (error) {
              console.error('Error loading more items:', error);
            } finally {
              setIsFetching(false);
            }
          }
        },
        {
          rootMargin,
          threshold: 0.1,
        }
      );
      
      if (node) observer.current.observe(node);
    },
    [isFetching, hasMore, enabled, loadMore, rootMargin]
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
    lastElementRef,
  };
}

// Alternative scroll-based implementation
export function useScrollInfiniteScroll(
  loadMore: () => Promise<void> | void,
  hasMore: boolean,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    threshold = 200,
    enabled = true,
  } = options;

  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!enabled || !hasMore) return;

    const handleScroll = async () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + threshold >=
        document.documentElement.offsetHeight
      ) {
        if (!isFetching) {
          setIsFetching(true);
          try {
            await loadMore();
          } catch (error) {
            console.error('Error loading more items:', error);
          } finally {
            setIsFetching(false);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, enabled, threshold, isFetching]);

  return {
    isFetching,
    lastElementRef: () => {}, // Not used in scroll-based implementation
  };
} 