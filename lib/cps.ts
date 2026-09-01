// =============================================================================
// CPS Tracking Links
// - RS Boost: per-drama resource promotion links (ReelShort deep links)
// - DramaCPS: per-drama links across 14 platforms + platform-level fallback
// =============================================================================

import { RS_BOOST_PER_DRAMA } from './rs-boost-links';
import { DRAMACPS_PER_DRAMA } from './dramacps-links';

// Platform-level fallback links (DramaCPS)
const PLATFORM_CPS: Record<string, string> = {
  'ReelShort': 'https://r.reelsgo.tv/gRr7kwZiYEah',
  'GoodShort': 'https://r.reelsgo.tv/9KPVm9pTsmrQ',
  'ShortMax': 'https://r.reelsgo.tv/zWPvLq1tQX1X',
  'DramaBox': 'https://r.reelsgo.tv/qtdKvsmcaZAz',
  'FlareFlow': 'https://r.reelsgo.tv/Kb7csvrF53wO',
  'KalosTV': 'https://r.reelsgo.tv/iUg5tJlEBfNv',
  'StardustTV': 'https://r.reelsgo.tv/IFWzbY31abfs',
  'Sereal+': 'https://r.reelsgo.tv/JigEokxxYib6',
  'YourChannel': 'https://r.reelsgo.tv/5XY148Wi9Yxo',
  'FlickReels': 'https://r.reelsgo.tv/PgodfgKzTJXB',
  'TouchShort': 'https://r.reelsgo.tv/MkXqiPnbsGBf',
  'Playlet': 'https://r.reelsgo.tv/__GF7RBLwQvt',
  'TopShort': 'https://r.reelsgo.tv/CH9l_h5ZH-DM',
  'StarShort': 'https://r.reelsgo.tv/2x293Jr1j6ny',
};

/**
 * Get CPS tracking URL for a specific drama.
 * Priority: RS Boost per-drama > DramaCPS per-drama > platform-level fallback > null
 * @param platform - Platform name (e.g. 'ReelShort')
 * @param dramaTitle - Drama title for per-drama lookup
 */
export function getCpsUrl(platform: string, dramaTitle?: string): string | null {
  // 1. Try RS Boost per-drama link (ReelShort-specific)
  if (dramaTitle && RS_BOOST_PER_DRAMA[dramaTitle]) {
    return RS_BOOST_PER_DRAMA[dramaTitle];
  }
  // 2. Try DramaCPS per-drama link (multi-platform)
  if (dramaTitle && DRAMACPS_PER_DRAMA[dramaTitle]) {
    return DRAMACPS_PER_DRAMA[dramaTitle].link;
  }
  // 3. Fall back to platform-level link
  return PLATFORM_CPS[platform] || null;
}

/** Get the DramaCPS platform for a specific drama (if mapped) */
export function getDramaCpsPlatform(dramaTitle: string): string | null {
  if (dramaTitle && DRAMACPS_PER_DRAMA[dramaTitle]) {
    return DRAMACPS_PER_DRAMA[dramaTitle].platform;
  }
  return null;
}

/** Check if a platform has CPS tracking link */
export function hasCps(platform: string): boolean {
  return platform in PLATFORM_CPS || Object.keys(RS_BOOST_PER_DRAMA).length > 0;
}

/** Check if a specific drama has any per-drama link (RS Boost or DramaCPS) */
export function hasPerDramaCps(dramaTitle: string): boolean {
  return dramaTitle in RS_BOOST_PER_DRAMA || dramaTitle in DRAMACPS_PER_DRAMA;
}
