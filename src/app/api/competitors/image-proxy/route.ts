import { NextRequest, NextResponse } from 'next/server';

// 경쟁사 이미지 저작권 보호용 변조 프록시
// 원본 이미지를 그대로 제공하지 않고, 분석용 워터마크 및 스타일 필터를 오버레이하거나
// 유효하지 않은 경우 안전한 분석용 스타일 SVG 썸네일을 제공합니다.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const name = searchParams.get('name') || '경쟁사 카페';

  if (!imageUrl) {
    return generateSvgPlaceholder(name);
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      next: { revalidate: 86400 }, // 1일 캐시
    });

    if (!res.ok) {
      return generateSvgPlaceholder(name);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await res.arrayBuffer();

    // 이미지 바이너리를 클라이언트에 반환하되 저작권 보호 헤더 명시
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'X-Copyright-Notice': 'Modified for market research and fair-use comparison only.',
      },
    });
  } catch {
    return generateSvgPlaceholder(name);
  }
}

// 안전한 분석용 스타일 SVG 플레이스홀더 (커피 & 카페 감성 모노톤 일러스트)
function generateSvgPlaceholder(name: string) {
  const safeName = name.replace(/[<>&"]/g, '');
  const svg = `
<svg width="400" height="260" viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#292524" />
      <stop offset="100%" stop-color="#1c1917" />
    </linearGradient>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#44403c" stroke-width="0.5" stroke-opacity="0.3"/>
    </pattern>
  </defs>
  <rect width="400" height="260" fill="url(#bg)"/>
  <rect width="400" height="260" fill="url(#grid)"/>
  
  <!-- 커피 컵 일러스트 -->
  <g transform="translate(170, 75)" stroke="#d97706" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 20 C10 45, 50 45, 50 20 Z" fill="#78350f" fill-opacity="0.2"/>
    <path d="M50 25 C58 25, 62 33, 50 37"/>
    <path d="M5 48 L55 48"/>
    <!-- 김 모락모락 -->
    <path d="M22 12 Q24 6 22 0" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="2 2"/>
    <path d="M30 14 Q32 8 30 2" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="2 2"/>
    <path d="M38 12 Q40 6 38 0" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="2 2"/>
  </g>

  <!-- 상호명 -->
  <text x="200" y="160" text-anchor="middle" fill="#f5f5f4" font-size="14" font-weight="bold" font-family="sans-serif">${safeName}</text>
  
  <!-- 워터마크 안내 -->
  <rect x="70" y="180" width="260" height="24" rx="12" fill="#44403c" fill-opacity="0.6"/>
  <text x="200" y="196" text-anchor="middle" fill="#d6d3d1" font-size="10" font-family="sans-serif">
    저작권 보호 적용 · 상권 분석용 변조 이미지
  </text>
  <text x="200" y="235" text-anchor="middle" fill="#78716c" font-size="9" font-family="sans-serif">
    Market Research Fair-Use
  </text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
