// =============================================================================
// CPS Tracking Links
// - RS Boost: per-drama resource promotion links (App deep links)
// - DramaCPS: platform-level fallback links
// =============================================================================

import { RS_BOOST_PER_DRAMA } from './rs-boost-links';

// Platform-level fallback links (DramaCPS)
const PLATFORM_CPS: Record<string, string> = {
  'ReelShort': 'https://r.reelsgo.tv/gRr7kwZiYEah',
  'GoodShort': 'https://r.reelsgo.tv/9KPVm9pTsmrQ',
  'ShortMax': 'https://r.reelsgo.tv/zWPvLq1tQX1X',
  'DramaBox': 'https://r.reelsgo.tv/qtdKvsmcaZAz',
};

/**
 * Get CPS tracking URL for a specific drama.
 * Priority: RS Boost per-drama link > platform-level DramaCPS link > null
 * @param platform - Platform name (e.g. 'ReelShort')
 * @param dramaTitle - Drama title for per-drama lookup
 */
export function getCpsUrl(platform: string, dramaTitle?: string): string | null {
  // Try RS Boost per-drama link first
  if (dramaTitle && RS_BOOST_PER_DRAMA[dramaTitle]) {
    return RS_BOOST_PER_DRAMA[dramaTitle];
  }
  // Fall back to platform-level link
  return PLATFORM_CPS[platform] || null;
}

/** Check if a platform has CPS tracking link */
export function hasCps(platform: string): boolean {
  return platform in PLATFORM_CPS || Object.keys(RS_BOOST_PER_DRAMA).length > 0;
}

/** Check if a specific drama has a per-drama RS Boost link */
export function hasPerDramaCps(dramaTitle: string): boolean {
  return dramaTitle in RS_BOOST_PER_DRAMA;
}
