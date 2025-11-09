import type { NextConfig } from "next";

/// next.js configuration for PhishGuard web dashboard
const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  /// environment variables accessible to the browser
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
};

export default nextConfig;
