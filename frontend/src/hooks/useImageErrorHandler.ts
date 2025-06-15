import { useState, useCallback } from 'react';
import { handleImageLoadError } from '@/utils/image';

export function useImageErrorHandler() {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [alternativeUrls, setAlternativeUrls] = useState<Map<string, string>>(new Map());

  const handleError = useCallback(async (originalUrl: string, baseUrl?: string) => {
    // Mark this URL as failed
    setFailedUrls(prev => new Set(prev).add(originalUrl));
    
    // Try to find alternative format
    const alternative = await handleImageLoadError(originalUrl, baseUrl);
    
    if (alternative && alternative !== originalUrl) {
      // Store the alternative URL
      setAlternativeUrls(prev => new Map(prev).set(originalUrl, alternative));
      
      return alternative;
    }
    
    return null;
  }, []);

  const getImageUrl = useCallback((originalUrl: string) => {
    // If we have an alternative URL, use it
    const alternative = alternativeUrls.get(originalUrl);
    if (alternative) {
      return alternative;
    }
    
    // If this URL has failed, we might want to show placeholder
    if (failedUrls.has(originalUrl)) {
      return '/placeholder.svg';
    }
    
    return originalUrl;
  }, [alternativeUrls, failedUrls]);

  const hasError = useCallback((url: string) => {
    return failedUrls.has(url);
  }, [failedUrls]);

  const clearErrors = useCallback(() => {
    setFailedUrls(new Set());
    setAlternativeUrls(new Map());
  }, []);

  return {
    handleError,
    getImageUrl,
    hasError,
    clearErrors,
    failedUrls,
    alternativeUrls
  };
} 