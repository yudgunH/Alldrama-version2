'use client';

import { useState, useEffect } from 'react';
import { cacheManager } from '@/lib/cache/cacheManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw } from 'lucide-react';

export default function CacheDebug() {
  const [stats, setStats] = useState(cacheManager.getCacheStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getCacheStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="bg-gray-900 border-gray-700 text-gray-300"
        >
          Cache Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-gray-900 border-gray-700 text-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Cache Stats</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStats(cacheManager.getCacheStats())}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  cacheManager.clearAllCache();
                  setStats(cacheManager.getCacheStats());
                }}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Movies:</span>
            <Badge variant="secondary" className="text-xs">
              {stats.movies}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Movie Details:</span>
            <Badge variant="secondary" className="text-xs">
              {stats.movieDetails}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Episodes:</span>
            <Badge variant="secondary" className="text-xs">
              {stats.episodes}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Genres:</span>
            <Badge variant="secondary" className="text-xs">
              {stats.genres}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Stats:</span>
            <Badge variant="secondary" className="text-xs">
              {stats.stats}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 