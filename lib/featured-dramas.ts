// =============================================================================
// S-tier featured dramas — manually curated based on real GSC/GA4 traffic
// + confirmed per-drama CPS links. Used for homepage weighting and as a
// tie-breaker in related-drama ranking.
//
// Maintenance: slugs must exist in lib/dramas-data.json AND have a per-drama
// link in lib/rs-boost-links.ts or lib/dramacps-links.ts. getFeaturedDramas()
// filters out any slug that fails either check, so stale entries degrade
// gracefully — but please keep this list clean.
// =============================================================================

export const FEATURED_DRAMA_SLUGS: string[] = [
  'he-saved-a-boy-who-returns-a-billion-01609851',        // GoodShort · 4 clicks / 5 views / 46 impr · DramaCPS deep link
  'hidden-ace-makes-cocky-captain-beg-for-mercy-01641559', // GoodShort · 4 clicks / 5 views / 33 impr · DramaCPS deep link
  'more-than-a-trainer-the-secret-matriarch-zl8nmz2m',    // FlexTV  · 3 clicks / 3 views / 12 impr · DramaCPS deep link
  'cursed-i-married-the-don-in-my-sisters-place-27431',   // ShortMax · 11 views / 15 impr · DramaCPS deep link
];
