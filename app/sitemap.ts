import { MetadataRoute } from "next";

/// generate dynamic sitemap for SEO
/// lists all public routes with priority and change frequency metadata
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://phish.equators.tech";
  const currentDate = new Date();

  return [
    /// homepage - highest priority, changes frequently with updates
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    /// authentication pages - high priority for new users
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    /// dashboard - medium priority (requires authentication, less relevant for public SEO)
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/dashboard/history`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dashboard/stats`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dashboard/settings`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
