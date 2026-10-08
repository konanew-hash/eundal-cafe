import { NextRequest, NextResponse } from 'next/server';

// 관리자 전용 즉시 일일 네이버 정보 동기화 트리거
export async function POST(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const cronUrl = `${origin}/api/cron/update-competitors`;

    const res = await fetch(cronUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-cron': '1',
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Competitor manual sync failed:', error);
    return NextResponse.json({ error: error.message || '동기화 실패' }, { status: 500 });
  }
}
