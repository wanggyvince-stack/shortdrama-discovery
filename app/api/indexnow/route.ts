import { NextRequest, NextResponse } from 'next/server';
import { getAllDramas, getAllTags } from '@/lib/data';

// IndexNow API - Submit URLs for indexing
// Key: ceb3aee347b27d9223fef21098b9837b
// Docs: https://www.indexnow.org/documentation

const INDEXNOW_KEY = 'ceb3aee347b27d9223fef21098b9837b';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function GET() {
  return NextResponse.json({
    key: INDEXNOW_KEY,
    status: 'ready',
    endpoints: [
      'POST /api/indexnow/submit - Submit all URLs',
      'POST /api/indexnow/submit?url=https://... - Submit single URL',
    ],
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const singleUrl = searchParams.get('url');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dramadisco.com';

  let urls: string[];

  if (singleUrl) {
    urls = [singleUrl];
  } else {
    // Submit all URLs
    const dramas = getAllDramas();
    const tags = getAllTags();

    urls = [
      baseUrl,
      `${baseUrl}/genres`,
      `${baseUrl}/platforms`,
      ...dramas.map(d => `${baseUrl}/drama/${d.slug}`),
      ...tags.map(t => `${baseUrl}/tag/${t.slug}`),
    ];
  }

  try {
    // IndexNow accepts max 10,000 URLs per request
    const batchSize = 10000;
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    let totalSubmitted = 0;
    for (const batch of batches) {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: new URL(baseUrl).hostname,
          key: INDEXNOW_KEY,
          keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`,
          urlList: batch,
        }),
      });

      if (response.ok || response.status === 200 || response.status === 202) {
        totalSubmitted += batch.length;
      } else {
        console.error(`[IndexNow] Batch failed: ${response.status} ${response.statusText}`);
      }
    }

    return NextResponse.json({
      success: true,
      submitted: totalSubmitted,
      total: urls.length,
    });
  } catch (error) {
    console.error('[IndexNow] Error:', error);
    return NextResponse.json({ error: 'Failed to submit URLs' }, { status: 500 });
  }
}
