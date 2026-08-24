import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// CPS Click Tracking API
// Dual mode: Upstash REST API (Vercel KV compatible) or in-memory fallback
// Uses raw HTTP calls - zero npm dependencies needed
// =============================================================================

interface ClickRecord {
  dramaId: string;
  dramaSlug: string;
  platform: string;
  timestamp: string;
  referer?: string;
  userAgent?: string;
}

// --- Upstash REST API client (works with Vercel KV env vars) ---
const UPSTASH_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REST_API_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REST_API_TOKEN;

async function upstashCmd(...args: string[]): Promise<any> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(UPSTASH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return data.result;
  } catch (e) {
    console.error('[CPS] Upstash error:', e);
    return null;
  }
}

function isKVAvailable(): boolean {
  return !!(UPSTASH_URL && UPSTASH_TOKEN);
}

// --- In-memory fallback ---
let clickRecords: ClickRecord[] = [];
const MAX_RECORDS = 5000;

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

    if (isKVAvailable()) {
      // --- Persistent mode: Upstash REST API ---
      const key = todayKey();

      // Append record to daily list (LPUSH + LTRIM to keep last 2000)
      await upstashCmd('LPUSH', key, JSON.stringify(record));
      await upstashCmd('LTRIM', key, '0', '1999');
      await upstashCmd('EXPIRE', key, String(86400 * 30)); // 30 day TTL

      // Increment aggregate counter
      const counterKey = `clicks:count:${record.platform}:${record.dramaId}`;
      await upstashCmd('INCR', counterKey);
      await upstashCmd('EXPIRE', counterKey, String(86400 * 90)); // 90 day TTL

      console.log(`[CPS-KV] click: drama=${record.dramaSlug} platform=${record.platform}`);
      return NextResponse.json({ success: true, mode: 'kv' });
    } else {
      // --- Fallback mode: in-memory ---
      clickRecords.push(record);
      if (clickRecords.length > MAX_RECORDS) {
        clickRecords = clickRecords.slice(-MAX_RECORDS);
      }
      console.log(`[CPS-MEM] click: drama=${record.dramaSlug} platform=${record.platform} (total: ${clickRecords.length})`);
      return NextResponse.json({ success: true, mode: 'memory' });
    }
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

    if (isKVAvailable()) {
      // --- KV mode ---
      if (platform && dramaId) {
        const count = await upstashCmd('GET', `clicks:count:${platform}:${dramaId}`);
        return NextResponse.json({
          mode: 'kv',
          date,
          platform,
          dramaId,
          clicks: count ? Number(count) : 0,
        });
      }

      // Get all records for a date (LRANGE)
      const raw = await upstashCmd('LRANGE', `clicks:${date}`, '0', '-1');
      const records: ClickRecord[] = (raw || []).map((r: string) => JSON.parse(r));

      let filtered = records;
      if (platform) filtered = records.filter((r: ClickRecord) => r.platform === platform);
      if (dramaId) filtered = records.filter((r: ClickRecord) => r.dramaId === dramaId);

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
        note: 'In-memory mode. Data lost on cold start. Set up Vercel KV for persistence.',
      });
    }
  } catch (error) {
    console.error('[CPS] Error querying clicks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
