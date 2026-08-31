import rawData from './dramas-data.json';
import { hasPerDramaCps, getCpsUrl } from './cps';
import { FEATURED_DRAMA_SLUGS } from './featured-dramas';

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

// ---------------------------------------------------------------------------
// CPS-aware ranking helpers (P0/P1 workorders 2026-09-01)
// ---------------------------------------------------------------------------

/** Monetization tier: 2 = per-drama deep link, 1 = platform-level link, 0 = none */
function cpsTier(d: Drama): 0 | 1 | 2 {
  if (hasPerDramaCps(d.title)) return 2;
  if (getCpsUrl(d.source || '', d.title) != null) return 1;
  return 0;
}

/** True if the drama earns commission through any link type */
export function hasAnyCps(d: Drama): boolean {
  return cpsTier(d) >= 1;
}

/** True if the drama is on the manually curated S-tier list */
export function isFeaturedDrama(slug: string): boolean {
  return FEATURED_DRAMA_SLUGS.includes(slug);
}

/**
 * Weighted relevance score for related-drama ranking.
 * Shared tags ×10, per-drama CPS +30 / platform link +15,
 * chapter depth up to +8 (log2), rating above 7 up to +6, featured +20.
 */
function relatedScore(d: Drama, tagSet: Set<string>): number {
  const shared = d.tags.filter(t => tagSet.has(t.name)).length;
  const tier = cpsTier(d);
  const chapterBoost = Math.min(Math.floor(Math.log2(Math.max(d.chapterCount, 1))), 8);
  const ratingBoost = Math.min(Math.max((d.score || 0) - 7, 0) * 2, 6);
  const featuredBoost = isFeaturedDrama(d.slug) ? 20 : 0;
  return (
    shared * 10 +
    (tier === 2 ? 30 : tier === 1 ? 15 : 0) +
    chapterBoost +
    ratingBoost +
    featuredBoost
  );
}

/** Sort by CPS tier first (monetizable always ahead), then weighted score */
function rankByCpsThenScore(list: Drama[], tagSet: Set<string>): Drama[] {
  return [...list].sort((a, b) => {
    const tierDiff = cpsTier(b) - cpsTier(a);
    if (tierDiff !== 0) return tierDiff;
    return relatedScore(b, tagSet) - relatedScore(a, tagSet);
  });
}

// Get related dramas — CPS-aware weighted ranking.
// requireCps=true (zero-CPS pages like NetShort): every returned slot must be
// monetizable; tag-matched CPS dramas first, site-wide CPS backfill if short.
export function getRelatedDramas(
  dramaId: string,
  tagNames: string[],
  limit: number = 6,
  requireCps: boolean = false,
): Drama[] {
  const tagSet = new Set(tagNames);

  let candidates = data.dramas.filter(
    d => d.id !== dramaId && d.tags.some(t => tagSet.has(t.name)),
  );
  candidates = rankByCpsThenScore(candidates, tagSet);
  if (requireCps) candidates = candidates.filter(d => cpsTier(d) >= 1);

  if (candidates.length >= limit) return candidates.slice(0, limit);

  // Backfill with site-wide monetizable dramas so the section stays full
  const have = new Set(candidates.map(d => d.id));
  const backfill = rankByCpsThenScore(
    data.dramas.filter(d => d.id !== dramaId && !have.has(d.id) && cpsTier(d) >= 1),
    tagSet,
  );
  return [...candidates, ...backfill].slice(0, limit);
}

/** S-tier curated dramas that exist in the catalog AND have per-drama CPS links */
export function getFeaturedDramas(limit?: number): Drama[] {
  const found = FEATURED_DRAMA_SLUGS.map(slug => data.dramas.find(d => d.slug === slug))
    .filter((d): d is Drama => Boolean(d) && hasPerDramaCps((d as Drama).title));
  return typeof limit === 'number' ? found.slice(0, limit) : found;
}

// Get popular dramas — S-tier featured first, then by chapterCount
export function getPopularDramas(limit: number = 24): Drama[] {
  const featured = getFeaturedDramas();
  const featuredIds = new Set(featured.map(d => d.id));
  const rest = data.dramas
    .filter(d => !featuredIds.has(d.id))
    .sort((a, b) => b.chapterCount - a.chapterCount);
  return [...featured, ...rest].slice(0, limit);
}

// Get all drama slugs for static generation
export function getAllDramaSlugs(): string[] {
  return data.dramas.map(d => d.slug);
}

// Get all tag slugs for static generation
export function getAllTagSlugs(): string[] {
  return data.tags.map(t => t.slug);
}
