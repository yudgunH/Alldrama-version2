import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["d2lhiv6mrfblvj.cloudfront.net", "localhost", "127.0.0.1","example.com", "alldrama.tech", "media.alldrama.tech"],
  },
  eslint: {
    // Bỏ qua mọi lỗi ESLint khi build (production)
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
