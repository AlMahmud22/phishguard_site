/** @type {import('next').NextConfig} */

// Derive hostname from NEXT_PUBLIC_SITE_URL for dynamic image patterns
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
let siteHostname = null;
if (siteUrl) {
  try {
    siteHostname = new URL(siteUrl).hostname;
  } catch (_) {
    // ignore invalid URL
  }
}

// Build image remote patterns — always include known hostnames plus the
// runtime production domain so Next.js image optimisation works on any host.
const imageRemotePatterns = [
  { protocol: 'https', hostname: 'phish.equators.site', port: '', pathname: '/**' },
  { protocol: 'https', hostname: 'phish.equators.tech', port: '', pathname: '/**' },
  { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
  { protocol: 'https', hostname: 'avatars.githubusercontent.com', port: '', pathname: '/**' },
];

if (siteHostname && !imageRemotePatterns.some((p) => p.hostname === siteHostname)) {
  imageRemotePatterns.push({ protocol: 'https', hostname: siteHostname, port: '', pathname: '/**' });
}

const nextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,
  compress: true,

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://accounts.google.com https://www.virustotal.com https://urlscan.io",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Explicitly surface NEXT_PUBLIC_ vars and server-side OAuth client IDs.
  // NEXT_PUBLIC_ vars are already forwarded to the browser automatically;
  // listing them here ensures they're available during SSG/ISR as well.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  },

  // Image optimisation
  images: {
    remotePatterns: imageRemotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Strip console.log in production builds; preserve error/warn output
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // Experimental features supported by Next.js 14
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'axios', 'framer-motion'],
    instrumentationHook: true,
  },
};

export default nextConfig;
