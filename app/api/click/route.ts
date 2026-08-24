import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CPS Click Tracking API
// Supports dual mode: Vercel KV (persistent) or in-memory (fallback)
// =============================================================================

// --- Vercel KV (persistent) ---
let kv: any = null;
let kvAvailable = false;

try {
  // Dynamic import to avoid build failure when @vercel/kv is not installed
  // or when KV env vars (KV_REST_API_URL) are not set
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
    kvAvailable = true;
    console.log('[CPS] Vercel KV connected - persistent storage active');
  } else {
    console.log('[CPS] KV env vars not found - using in-memory fallback');
  }
} catch {
  console.log('[CPS] @vercel/kv not available - using in-memory fallback');
}

// --- In-memory fallback ---
interface ClickRecord {
  dramaId: string;
  dramaSlug: string;
  platform: string;
  timestamp: string;
  referer?: string;
  userAgent?: string;
}

let clickRecords: ClickRecord[] = [];
const MAX_RECORDS = 5000;

// --- Helper: get today's key for KV ---
function todayKey() {
  return `clicks:${new Date().toISOString().slice(0, 10)}`;
}

// =============================================================================
// POST: Record a CPS click
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dramaId, dramaSlug, platform, referer, userAgent } = body;

    if (!dramaId || !platform) {
      return NextResponse.json(
        { error: 'dramaId and platform are required' },
        { status: 400 }
      );
    }

    const record: ClickRecord = {
      dramaId: String(dramaId),
      dramaSlug: dramaSlug || '',
      platform: String(platform),
      timestamp: new Date().toISOString(),
      referer: referer || '',
      userAgent: userAgent || '',
    };

    if (kvAvailable && kv) {
      // --- Persistent mode: Vercel KV ---
      const key = todayKey();
      // Store as a list in KV (JSON serialized)
      const existing = await kv.get<string>(key);
      const records: ClickRecord[] = existing ? JSON.parse(existing) : [];
      records.push(record);
      // Keep last 2000 records per day to avoid KV size limits
      const trimmed = records.slice(-2000);
      await kv.set(key, JSON.stringify(trimmed), { ex: 86400 * 30 }); // 30 day TTL

      // Also maintain aggregate counters
      const counterKey = `clicks:count:${record.platform}:${record.dramaId}`;
      await kv.incr(counterKey);
      await kv.expire(counterKey, 86400 * 90); // 90 day TTL

      console.log(`[CPS-KV] Recorded click: drama=${record.dramaSlug} platform=${record.platform}`);
    } else {
      // --- Fallback mode: in-memory ---
      clickRecords.push(record);
      if (clickRecords.length > MAX_RECORDS) {
        clickRecords = clickRecords.slice(-MAX_RECORDS);
      }
      console.log(`[CPS-MEM] Recorded click: drama=${record.dramaSlug} platform=${record.platform} (total: ${clickRecords.length})`);
    }

    return NextResponse.json({ success: true, mode: kvAvailable ? 'kv' : 'memory' });
  } catch (error) {
    console.error('[CPS] Error recording click:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================================================
// GET: Query click statistics
// ?platform=xxx&dramaId=xxx&date=YYYY-MM-DD
// =============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const dramaId = searchParams.get('dramaId');
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    if (kvAvailable && kv) {
      // --- KV mode ---
      if (platform && dramaId) {
        // Get specific counter
        const count = await kv.get(`clicks:count:${platform}:${dramaId}`);
        return NextResponse.json({
          mode: 'kv',
          date,
          platform,
          dramaId,
          clicks: count ? Number(count) : 0,
        });
      }

      // Get all records for a date
      const key = `clicks:${date}`;
      const raw = await kv.get<string>(key);
      const records: ClickRecord[] = raw ? JSON.parse(raw) : [];

      let filtered = records;
      if (platform) filtered = records.filter(r => r.platform === platform);
      if (dramaId) filtered = records.filter(r => r.dramaId === dramaId);

      // Aggregate stats
      const byPlatform: Record<string, number> = {};
      const byDrama: Record<string, number> = {};
      for (const r of filtered) {
        byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;
        byDrama[r.dramaSlug] = (byDrama[r.dramaSlug] || 0) + 1;
      }

      return NextResponse.json({
        mode: 'kv',
        date,
        totalClicks: filtered.length,
        byPlatform,
        topDramas: Object.entries(byDrama)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([slug, clicks]) => ({ slug, clicks })),
      });
    } else {
      // --- Memory mode ---
      let filtered = clickRecords;
      if (platform) filtered = filtered.filter(r => r.platform === platform);
      if (dramaId) filtered = filtered.filter(r => r.dramaId === dramaId);

      const byPlatform: Record<string, number> = {};
      const byDrama: Record<string, number> = {};
      for (const r of filtered) {
        byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;
        byDrama[r.dramaSlug] = (byDrama[r.dramaSlug] || 0) + 1;
      }

      return NextResponse.json({
        mode: 'memory',
        date,
        totalClicks: filtered.length,
        byPlatform,
        topDramas: Object.entries(byDrama)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([slug, clicks]) => ({ slug, clicks })),
        note: 'In-memory mode. Data will be lost on serverless cold start. Set up Vercel KV for persistence.',
      });
    }
  } catch (error) {
    console.error('[CPS] Error querying clicks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
