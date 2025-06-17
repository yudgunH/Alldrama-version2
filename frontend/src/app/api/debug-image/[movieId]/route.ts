import { NextRequest, NextResponse } from 'next/server'
import { getPosterUrlsWithFallback, getBackdropUrlsWithFallback } from '@/utils/image.server'

/**
 * Check if image URL exists and return response info
 */
async function checkImageWithDetails(url: string) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    return {
      url,
      exists: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
    };
  } catch (error) {
    return {
      url,
      exists: false,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    const movieId = params.movieId;
    
    if (!movieId || isNaN(Number(movieId))) {
      return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
    }

    // Get all possible URLs to test
    const posterUrls = getPosterUrlsWithFallback(null, movieId);
    const backdropUrls = getBackdropUrlsWithFallback(null, null, movieId);
    
    // Test all poster URLs
    console.log(`🔍 Testing poster images for movie ${movieId}...`);
    const posterResults = await Promise.all(
      posterUrls.map(url => checkImageWithDetails(url))
    );
    
    // Test all backdrop URLs
    console.log(`🔍 Testing backdrop images for movie ${movieId}...`);
    const backdropResults = await Promise.all(
      backdropUrls.map(url => checkImageWithDetails(url))
    );
    
    // Find working images
    const workingPosters = posterResults.filter(result => result.exists);
    const workingBackdrops = backdropResults.filter(result => result.exists);
    
    // Summary
    const summary = {
      movieId,
      poster: {
        workingCount: workingPosters.length,
        totalTested: posterResults.length,
        workingFormats: workingPosters.map(p => {
          const ext = p.url.split('.').pop();
          return ext;
        }),
        firstWorking: workingPosters[0]?.url || null,
      },
      backdrop: {
        workingCount: workingBackdrops.length,
        totalTested: backdropResults.length,
        workingFormats: workingBackdrops.map(b => {
          const ext = b.url.split('.').pop();
          return ext;
        }),
        firstWorking: workingBackdrops[0]?.url || null,
      }
    };

    const response = {
      summary,
      details: {
        posters: posterResults,
        backdrops: backdropResults,
      },
      recommendations: {
        bestPosterUrl: workingPosters[0]?.url || null,
        bestBackdropUrl: workingBackdrops[0]?.url || null,
        hasWorkingPNG: workingPosters.some(p => p.url.includes('.png')) || workingBackdrops.some(b => b.url.includes('.png')),
        hasWorkingJPG: workingPosters.some(p => p.url.includes('.jpg')) || workingBackdrops.some(b => b.url.includes('.jpg')),
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in debug-image API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 