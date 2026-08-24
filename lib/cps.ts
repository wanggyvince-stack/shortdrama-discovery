// =============================================================================
// CPS Tracking Links - DramaCPS
// These are App deep links. DramaCPS tracks conversions on their end.
// Platform-level links (all dramas on that platform use the same link).
// Future: replace with per-drama mapping when DramaCPS exports single-drama links.
// =============================================================================

export const CPS_TRACKING: Record<string, string> = {
  'ReelShort': 'https://r.reelsgo.tv/gRr7kwZiYEah',
  'GoodShort': 'https://r.reelsgo.tv/9KPVm9pTsmrQ',
  'ShortMax': 'https://r.reelsgo.tv/zWPvLq1tQX1X',
  'DramaBox': 'https://r.reelsgo.tv/qtdKvsmcaZAz',
};

/** Get CPS tracking URL for a platform. Returns null if not available. */
export function getCpsUrl(platform: string): string | null {
  return CPS_TRACKING[platform] || null;
}

/** Check if a platform has CPS tracking link */
export function hasCps(platform: string): boolean {
  return platform in CPS_TRACKING;
}
