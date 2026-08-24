import rawData from './dramas-data.json';

// Type definitions
interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
  dramaCount: number;
  avgScore: number | null;
  totalReads: number;
}

interface Platform {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
  dramaCount: number;
  cpsEnabled: number;
}

interface Drama {
  id: string;
  source: string;
  title: string;
  slug: string;
  synopsis: string;
  coverUrl: string;
  score: number | null;
  readCount: number | null;
  collectCount: number | null;
  chapterCount: number;
  duration: string | null;
  releaseDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sourceUrl: string;
  tags: Array<{ name: string; slug: string; category: string }>;
  platforms: string[];
}

interface Data {
  generatedAt: string;
  stats: {
    totalDramas: number;
    totalTags: number;
    totalPlatforms: number;
  };
  platforms: Platform[];
  tags: Tag[];
  dramas: Drama[];
}

const data = rawData as Data;

// Get all dramas sorted by chapterCount desc
export function getAllDramas(): Drama[] {
  return [...data.dramas].sort((a, b) => b.chapterCount - a.chapterCount);
}

// Get single drama by slug
export function getDramaBySlug(slug: string): Drama | null {
  return data.dramas.find(d => d.slug === slug) || null;
}

// Get all tags sorted by dramaCount desc
export function getAllTags(): Tag[] {
  return [...data.tags].sort((a, b) => b.dramaCount - a.dramaCount);
}

// Get tag by slug with its dramas
export function getTagBySlug(slug: string): { tag: Tag; dramas: Drama[] } | null {
  const tag = data.tags.find(t => t.slug === slug);
  if (!tag) return null;

  const dramas = data.dramas
    .filter(d => d.tags.some(t => t.slug === slug))
    .sort((a, b) => b.chapterCount - a.chapterCount);

  return { tag, dramas };
}

// Get platforms
export function getPlatforms(): Platform[] {
  return data.platforms;
}

// Get related dramas by shared tags
export function getRelatedDramas(dramaId: string, tagNames: string[], limit: number = 6): Drama[] {
  const related = data.dramas
    .filter(d => {
      if (d.id === dramaId) return false;
      return d.tags.some(t => tagNames.includes(t.name));
    })
    .slice(0, limit);

  return related;
}

// Get popular dramas
export function getPopularDramas(limit: number = 24): Drama[] {
  return [...data.dramas]
    .sort((a, b) => b.chapterCount - a.chapterCount)
    .slice(0, limit);
}

// Get all drama slugs for static generation
export function getAllDramaSlugs(): string[] {
  return data.dramas.map(d => d.slug);
}

// Get all tag slugs for static generation
export function getAllTagSlugs(): string[] {
  return data.tags.map(t => t.slug);
}
