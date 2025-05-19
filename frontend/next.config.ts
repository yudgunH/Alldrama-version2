import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alldramaz.com';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'localhost', 
      '127.0.0.1', 
      'via.placeholder.com', 
      'image.tmdb.org', 
      'alldramaz.com',
      '0343230127aedb8187f76ba76d48332e.r2.cloudflarestorage.com',
      'media.alldrama.tech'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.alldrama.tech',
        pathname: '/movies/**',
      },
    ],
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          }
        ],
      }
    ]
  },

  // Cấu hình API proxy để chuyển hướng các yêu cầu từ /api/* sang backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },

  // Configuration for TypeScript errors
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // Configuration for ESLint errors
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
