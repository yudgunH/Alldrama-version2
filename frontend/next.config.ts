import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['localhost', '127.0.0.1','via.placeholder.com', 'image.tmdb.org'],
  },
  
  // Cấu hình API proxy để chuyển hướng các yêu cầu từ /api/* sang backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
