'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MetaTag {
  property?: string;
  name?: string;
  content?: string;
}

interface ValidatorResult {
  tag: string;
  status: 'valid' | 'invalid' | 'missing';
  content?: string;
  message?: string;
}

export default function MetaTagsValidator() {
  const [results, setResults] = useState<ValidatorResult[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const validateMetaTags = () => {
      const metaTags = document.querySelectorAll('meta[property^="og:"], meta[name="twitter:"], meta[name="description"]');
      const titleTag = document.querySelector('title');
      
      const validators: ValidatorResult[] = [];

      // Check title
      if (titleTag?.textContent) {
        validators.push({
          tag: 'title',
          status: 'valid',
          content: titleTag.textContent,
          message: `Length: ${titleTag.textContent.length} chars`
        });
      } else {
        validators.push({
          tag: 'title',
          status: 'missing',
          message: 'Title tag not found'
        });
      }

      // Check essential OG tags
      const requiredOgTags = [
        'og:title',
        'og:description', 
        'og:image',
        'og:url',
        'og:type',
        'og:site_name'
      ];

      const foundTags = new Set<string>();
      metaTags.forEach((meta) => {
        const tag = meta as HTMLMetaElement;
        const property = tag.getAttribute('property') || tag.getAttribute('name');
        const content = tag.getAttribute('content');
        
        if (property && content) {
          foundTags.add(property);
          
          if (requiredOgTags.includes(property)) {
            validators.push({
              tag: property,
              status: 'valid',
              content: content,
              message: content.length > 100 ? `${content.substring(0, 100)}...` : content
            });
          }
        }
      });

      // Check for missing required tags
      requiredOgTags.forEach(tag => {
        if (!foundTags.has(tag)) {
          validators.push({
            tag,
            status: 'missing',
            message: 'Required meta tag not found'
          });
        }
      });

      // Check og:image specifically
      const ogImage = Array.from(metaTags).find(meta => 
        meta.getAttribute('property') === 'og:image'
      ) as HTMLMetaElement;

      if (ogImage) {
        const imageUrl = ogImage.getAttribute('content');
        if (imageUrl) {
          // Test if image is accessible
          const img = new Image();
          img.onload = () => {
            setResults(prev => prev.map(result => 
              result.tag === 'og:image' 
                ? { ...result, status: 'valid' as const, message: `Image loaded successfully (${imageUrl})` }
                : result
            ));
          };
          img.onerror = () => {
            setResults(prev => prev.map(result => 
              result.tag === 'og:image' 
                ? { ...result, status: 'invalid' as const, message: `Image failed to load (${imageUrl})` }
                : result
            ));
          };
          img.src = imageUrl;
        }
      }

      setResults(validators);
    };

    // Run validation after a short delay to ensure meta tags are loaded
    const timer = setTimeout(validateMetaTags, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || results.length === 0) {
    return null;
  }

  const validCount = results.filter(r => r.status === 'valid').length;
  const invalidCount = results.filter(r => r.status === 'invalid').length;
  const missingCount = results.filter(r => r.status === 'missing').length;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Badge 
          variant="outline" 
          className="cursor-pointer bg-gray-800/90 border-gray-700 text-gray-300 hover:bg-gray-700"
          onClick={() => setIsVisible(true)}
        >
          Meta Tags: {validCount}✓ {invalidCount}✗ {missingCount}❌
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <Card className="bg-gray-900/95 border-gray-700 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Meta Tags Status</CardTitle>
            <Badge 
              variant="ghost" 
              className="cursor-pointer text-xs h-6"
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Badge>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400">
              {validCount} Valid
            </Badge>
            {invalidCount > 0 && (
              <Badge variant="outline" className="text-red-400 border-red-400">
                {invalidCount} Invalid
              </Badge>
            )}
            {missingCount > 0 && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                {missingCount} Missing
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <div className="mt-0.5">
                {result.status === 'valid' && <CheckCircle className="h-3 w-3 text-green-400" />}
                {result.status === 'invalid' && <XCircle className="h-3 w-3 text-red-400" />}
                {result.status === 'missing' && <AlertCircle className="h-3 w-3 text-yellow-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-blue-300">{result.tag}</div>
                <div className="text-gray-400 break-words">
                  {result.message || result.content}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
} 