import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  poweredByHeader: false, // remove X-Powered-By header for security
  compress: true, // enable gzip compression
  
  // env vars accessible to browser (NEXT_PUBLIC_ prefix auto-exposed)
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  },
  
  // image optimization config
  images: {
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'], // keep error and warn logs
    } : false,
  },
  
  // experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'axios', 'framer-motion'],
    scrollRestoration: true,
  },
  
  turbopack: {},
};

export default nextConfig;
