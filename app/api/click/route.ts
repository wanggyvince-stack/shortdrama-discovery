import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dramaId } = body;

    if (!dramaId) {
      return NextResponse.json({ error: 'dramaId is required' }, { status: 400 });
    }

    // Click tracking acknowledged - will be implemented in Phase 1
    return NextResponse.json({ success: true, message: 'Click tracking acknowledged' });
  } catch (error) {
    console.error('Click tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
