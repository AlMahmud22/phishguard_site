import { MetadataRoute } from "next";

/// generate robots.txt for search engine crawler control
/// allows indexing of public pages while protecting authenticated areas
export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://phish.tnpx.tech";

  return {
    rules: [
      {
        /// rules for all search engine crawlers
        userAgent: "*",
        allow: [
          "/",           /// allow homepage
          "/login",      /// allow login page (for discoverability)
          "/register",   /// allow register page (for discoverability)
        ],
        disallow: [
          "/dashboard/*",   /// disallow all dashboard routes (require authentication)
          "/api/*",         /// disallow API routes
          "/maintenance",   /// disallow maintenance page
        ],
      },
      {
        /// special rules for Google's crawlers
        userAgent: "Googlebot",
        allow: [
          "/",
          "/login",
          "/register",
        ],
        disallow: [
          "/dashboard/*",
          "/api/*",
        ],
      },
    ],
    /// reference to sitemap for better crawling
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
