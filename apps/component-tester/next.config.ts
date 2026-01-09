import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Compress assets in production
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Production optimizations
  swcMinify: true,

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Optimize output
  output: 'standalone',
};

export default nextConfig;
