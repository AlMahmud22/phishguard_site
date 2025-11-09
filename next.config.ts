import type { NextConfig } from "next";

/// next.js configuration for PhishGuard web dashboard
const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  /// enable production optimizations
  poweredByHeader: false, /// remove X-Powered-By header for security
  compress: true, /// enable gzip compression for responses
  
  /// environment variables accessible to the browser
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
  
  /// image optimization configuration
  images: {
    /// allowed domains for external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phish.equators.site',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'phish.equators.tech',
        port: '',
        pathname: '/**',
      },
    ],
    /// image formats to support (modern formats for better performance)
    formats: ['image/avif', 'image/webp'],
    /// device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    /// image sizes for different viewport widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  /// compiler optimizations
  compiler: {
    /// remove console logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'], /// keep error and warn logs
    } : false,
  },
  
  /// experimental features for better performance
  experimental: {
    /// optimize CSS imports
    optimizeCss: true,
    /// optimize package imports to reduce bundle size
    optimizePackageImports: ['recharts', 'axios'],
  },
  
  /// turbopack configuration (Next.js 16+)
  /// empty config to acknowledge we're using Turbopack
  turbopack: {},
};

export default nextConfig;
