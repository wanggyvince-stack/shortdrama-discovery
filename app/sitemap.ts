import { MetadataRoute } from 'next';
import { getAllDramas, getAllTags } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dramadisco.com';

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/genres`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/platforms`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // Drama pages
  const dramas = getAllDramas();
  const dramaPages = dramas.map((drama) => ({
    url: `${baseUrl}/drama/${drama.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Tag pages — only include tags with 10+ dramas to avoid thin content signals
  const tags = getAllTags();
  const tagPages = tags
    .filter((tag) => tag.dramaCount >= 10)
    .map((tag) => ({
      url: `${baseUrl}/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  return [...staticPages, ...dramaPages, ...tagPages];
}
