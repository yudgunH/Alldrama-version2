'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { movieService } from '@/lib/api/services/movieService';
import { Movie } from '@/types';

export default function DebugMetadataPage() {
  const params = useParams();
  const movieId = params?.movieId as string;
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [ogData, setOgData] = useState<any>(null);
  const [metaTags, setMetaTags] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!movieId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch movie data
      const movieData = await movieService.getMovieById(Number(movieId));
      setMovie(movieData);
      
      // Try to fetch OG data from our API, but don't fail if it's not available
      try {
        const response = await fetch(`/api/og/movie/${movieId}`);
        if (response.ok) {
          const ogResponse = await response.json();
          setOgData(ogResponse);
        } else {
          // Generate OG data manually if API is not available
          const posterUrl = movieData.posterUrl && movieData.posterUrl.trim() !== '' && !movieData.posterUrl.includes('placeholder')
            ? movieData.posterUrl
            : `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
          
          setOgData({
            title: movieData.title,
            description: movieData.summary || `Xem phim ${movieData.title} trực tuyến tại AllDrama`,
            image: posterUrl.startsWith('http') ? posterUrl : `https://alldrama.net${posterUrl}`,
            type: 'video.movie',
            site_name: 'AllDrama',
            rating: movieData.rating,
            release_year: movieData.releaseYear,
            api_note: 'Generated from movie data (API not available)'
          });
        }
      } catch (apiError) {
        console.warn('OG API not available, generating manually:', apiError);
        // Generate OG data manually
        const posterUrl = movieData.posterUrl && movieData.posterUrl.trim() !== '' && !movieData.posterUrl.includes('placeholder')
          ? movieData.posterUrl
          : `https://media.alldrama.tech/movies/${movieId}/poster.jpg`;
        
        setOgData({
          title: movieData.title,
          description: movieData.summary || `Xem phim ${movieData.title} trực tuyến tại AllDrama`,
          image: posterUrl.startsWith('http') ? posterUrl : `https://alldrama.net${posterUrl}`,
          type: 'video.movie',
          site_name: 'AllDrama',
          rating: movieData.rating,
          release_year: movieData.releaseYear,
          api_note: 'Generated from movie data (API not available)'
        });
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [movieId]);

  // Extract meta tags from current page
  useEffect(() => {
    const extractMetaTags = () => {
      const meta = document.querySelectorAll('meta[property^="og:"], meta[name="twitter:"], meta[name="description"], title');
      const tags: any = {};
      
      meta.forEach((tag) => {
        if (tag.tagName === 'TITLE') {
          tags.title = tag.textContent;
        } else {
          const property = tag.getAttribute('property') || tag.getAttribute('name');
          const content = tag.getAttribute('content');
          if (property && content) {
            tags[property] = content;
          }
        }
      });
      
      setMetaTags(tags);
    };

    // Extract meta tags after a short delay to ensure they're loaded
    const timer = setTimeout(extractMetaTags, 1000);
    return () => clearTimeout(timer);
  }, []);

  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/movie/${movieId}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading debug data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">SEO Metadata Debug</h1>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Movie Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Movie Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {movie ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge variant="outline">ID: {movie.id}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">Year: {movie.releaseYear}</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
                  <p className="text-gray-300 text-sm mt-2">
                    {movie.summary ? movie.summary.slice(0, 200) + '...' : 'No summary available'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Poster URL (Primary for sharing):</p>
                    <code className="text-xs bg-gray-900 p-2 rounded block text-green-400 break-all">
                      {movie.posterUrl || 'N/A'}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Generated Media Server URL:</p>
                    <code className="text-xs bg-gray-900 p-2 rounded block text-blue-400 break-all">
                      https://media.alldrama.tech/movies/{movieId}/poster.jpg
                    </code>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-400">No movie data loaded</p>
            )}
          </CardContent>
        </Card>

        {/* URL Info */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">URL Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Current Movie URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-900 px-3 py-2 rounded text-green-400 flex-1 break-all">
                  {currentUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(currentUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-yellow-400 mt-1">
                ⚠️ Visit actual movie page to see metadata generated by layout
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">OG API Endpoint:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-900 px-3 py-2 rounded text-green-400 flex-1 break-all">
                  {`${process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'}/api/og/movie/${movieId}`}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/api/og/movie/${movieId}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OG Data */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Open Graph Data</CardTitle>
          </CardHeader>
          <CardContent>
            {ogData ? (
              <div className="space-y-4">
                {ogData.error ? (
                  <div className="text-red-400 bg-red-900/20 p-4 rounded">
                    <p className="font-semibold">API Error:</p>
                    <p>{ogData.error}</p>
                  </div>
                ) : (
                  <>
                    {ogData.api_note && (
                      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded">
                        <p className="text-blue-300 text-sm">
                          ℹ️ {ogData.api_note}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Title:</p>
                          <p className="text-white">{ogData.title}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">Description:</p>
                          <p className="text-gray-300 text-sm">{ogData.description}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">Type:</p>
                          <p className="text-white">{ogData.type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">Site Name:</p>
                          <p className="text-white">{ogData.site_name}</p>
                        </div>
                        {ogData.rating && (
                          <div>
                            <p className="text-sm font-medium text-gray-400">Rating:</p>
                            <p className="text-white">{ogData.rating}/10</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-2">Social Image:</p>
                        {ogData.image ? (
                          <div className="space-y-2">
                            <code className="text-xs bg-gray-900 p-2 rounded block text-green-400 break-all">
                              {ogData.image}
                            </code>
                            <div className="border border-gray-600 rounded overflow-hidden">
                              <img 
                                src={ogData.image} 
                                alt="Social Preview" 
                                className="w-full h-40 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.textContent = '❌ Image failed to load';
                                }}
                              />
                              <p className="text-red-400 p-4 text-center hidden">❌ Image failed to load</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-yellow-400">No image URL provided</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No OG data loaded</p>
            )}
          </CardContent>
        </Card>

        {/* Actual Meta Tags */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Actual Page Meta Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {metaTags ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Page Title:</p>
                    <p className="text-white text-sm">{metaTags.title || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">og:image:</p>
                    <p className="text-green-400 text-xs break-all">{metaTags['og:image'] || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">og:title:</p>
                    <p className="text-white text-sm">{metaTags['og:title'] || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">og:description:</p>
                    <p className="text-gray-300 text-xs">{metaTags['og:description'] || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">og:url:</p>
                    <p className="text-blue-400 text-xs break-all">{metaTags['og:url'] || 'Not found'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">og:type:</p>
                    <p className="text-white text-sm">{metaTags['og:type'] || 'Not found'}</p>
                  </div>
                </div>
                
                {metaTags['og:image'] && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-400 mb-2">Meta Image Preview:</p>
                    <div className="border border-gray-600 rounded overflow-hidden bg-gray-900">
                      <img 
                        src={metaTags['og:image']} 
                        alt="Meta Image" 
                        className="w-full h-32 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.textContent = '❌ Meta image failed to load';
                        }}
                      />
                      <p className="text-red-400 p-4 text-center hidden">❌ Meta image failed to load</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Extracting meta tags...</p>
            )}
          </CardContent>
        </Card>

        {/* Test Links */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Social Media Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank')}
              >
                Test Facebook Share
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(currentUrl)}`, '_blank')}
              >
                Facebook Debugger
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(currentUrl)}`, '_blank')}
              >
                Twitter Card Validator
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 