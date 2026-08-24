import { NextRequest, NextResponse } from 'next/server';

// In-memory click store (per serverless instance)
// For Phase 0 validation, this is sufficient
// Phase 1: Replace with Vercel KV / Turso / Supabase
interface ClickRecord {
  dramaId: string;
  dramaSlug: string;
  platform: string;
  timestamp: string;
  referer: string;
  userAgent: string;
}

// Simple in-memory store (resets on cold start)
let clickStore: ClickRecord[] = [];
const MAX_STORE_SIZE = 10000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dramaId, dramaSlug, platform } = body;

    if (!dramaId || !platform) {
      return NextResponse.json(
        { error: 'dramaId and platform are required' },
        { status: 400 }
      );
    }

    const record: ClickRecord = {
      dramaId,
      dramaSlug: dramaSlug || '',
      platform,
      timestamp: new Date().toISOString(),
      referer: req.headers.get('referer') || '',
      userAgent: req.headers.get('user-agent') || '',
    };

    // Store click
    clickStore.push(record);
    
    // Trim if too large
    if (clickStore.length > MAX_STORE_SIZE) {
      clickStore = clickStore.slice(-MAX_STORE_SIZE);
    }

    // Log for Vercel analytics
    console.log(`[CPS Click] ${platform} | ${dramaSlug || dramaId} | ${record.referer || 'direct'}`);

    return NextResponse.json({
      success: true,
      message: 'Click tracked',
      clickId: `click_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });
  } catch (error) {
    console.error('[CPS Click Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for click stats (Phase 0 demo)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dramaId = searchParams.get('dramaId');
  const platform = searchParams.get('platform');

  let filtered = clickStore;
  if (dramaId) {
    filtered = filtered.filter(c => c.dramaId === dramaId);
  }
  if (platform) {
    filtered = filtered.filter(c => c.platform === platform);
  }

  return NextResponse.json({
    total: filtered.length,
    clicks: filtered.slice(-100), // Last 100 clicks
  });
}
