'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';

interface SocialMetaDebugProps {
  movieId: number;
  movieTitle: string;
  movieSlug: string;
}

export default function SocialMetaDebug({ movieId, movieTitle, movieSlug }: SocialMetaDebugProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDebugData = async () => {
    setIsLoading(true);
    try {
      // Fetch OG data from our API
      const response = await fetch(`/api/og/movie/${movieId}`);
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error fetching debug data:', error);
      setDebugData({ error: 'Failed to fetch debug data' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    if (!isVisible && !debugData) {
      fetchDebugData();
    }
  };

  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/movie/${movieSlug}`;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={toggleVisibility}
          size="sm"
          variant="outline"
          className="bg-gray-800/90 border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          <Eye className="h-4 w-4 mr-1" />
          Debug SEO
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-gray-900/95 border-gray-700 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">SEO Debug</CardTitle>
            <Button 
              onClick={toggleVisibility}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-1">Current URL</h4>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-800 px-2 py-1 rounded text-green-400 flex-1 truncate">
                {currentUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => window.open(currentUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-400 mb-1">Movie Info</h4>
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">ID: {movieId}</Badge>
              <p className="text-xs text-gray-300 truncate">{movieTitle}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Loading...</p>
            </div>
          ) : debugData ? (
            <div>
              <h4 className="text-xs font-medium text-gray-400 mb-1">OG Data</h4>
              {debugData.error ? (
                <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                  {debugData.error}
                </div>
              ) : (
                <div className="space-y-2">
                  {debugData.image && (
                    <div>
                      <p className="text-xs text-gray-500">Image:</p>
                      <div className="bg-gray-800 p-2 rounded">
                        <img 
                          src={debugData.image} 
                          alt="OG Preview" 
                          className="w-full h-20 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.textContent = 'Image failed to load';
                          }}
                        />
                        <p className="text-xs text-red-400 mt-1 hidden">Image failed to load</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Title:</p>
                    <p className="text-xs text-gray-300">{debugData.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Description:</p>
                    <p className="text-xs text-gray-300 line-clamp-2">{debugData.description}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button 
              onClick={fetchDebugData}
              size="sm"
              className="w-full"
              variant="outline"
            >
              Load Debug Data
            </Button>
          )}

          <div className="pt-2 border-t border-gray-700">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Test Links</h4>
            <div className="space-y-1">
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-6"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank')}
              >
                Test Facebook Share
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-6"
                onClick={() => window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(currentUrl)}`, '_blank')}
              >
                Facebook Debugger
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-xs h-6"
                onClick={() => window.open(`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(currentUrl)}`, '_blank')}
              >
                Twitter Card Validator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 