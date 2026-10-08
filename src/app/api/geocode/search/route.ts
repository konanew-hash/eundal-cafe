import { NextRequest, NextResponse } from 'next/server';

// 주요 지역 중심 좌표 사전 (수원 및 수도권 주요 권역)
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  // 수원시 4대 구
  '수원시 장안구': { lat: 37.3037639, lng: 127.0105254 },
  '수원시 영통구': { lat: 37.2593000, lng: 127.0466000 },
  '수원시 팔달구': { lat: 37.2749941, lng: 127.0161418 },
  '수원시 권선구': { lat: 37.2567361, lng: 126.9719715 },
  // 장안구 주요 동
  '조원동': { lat: 37.2966787, lng: 127.0215096 },
  '파장동': { lat: 37.3075666, lng: 126.9978752 },
  '정자동': { lat: 37.2991000, lng: 126.9880000 },
  '송죽동': { lat: 37.3005000, lng: 127.0090000 },
  '율전동': { lat: 37.3015000, lng: 126.9710000 },
  '천천동': { lat: 37.2930000, lng: 126.9810000 },
  '영화동': { lat: 37.2900000, lng: 127.0110000 },
  '연무동': { lat: 37.2950000, lng: 127.0270000 },
  '이목동': { lat: 37.3160000, lng: 126.9850000 },
  '상광교동': { lat: 37.3300000, lng: 127.0200000 },
  '하광교동': { lat: 37.3100000, lng: 127.0250000 },
  // 영통구 주요 동
  '이의동': { lat: 37.2920000, lng: 127.0500000 },
  '하동': { lat: 37.2840000, lng: 127.0680000 },
  '원천동': { lat: 37.2720000, lng: 127.0570000 },
  '매탄동': { lat: 37.2620000, lng: 127.0420000 },
  '영통동': { lat: 37.2500000, lng: 127.0720000 },
  '망포동': { lat: 37.2420000, lng: 127.0500000 },
  '신동': { lat: 37.2510000, lng: 127.0440000 },
  // 팔달구 주요 동
  '인계동': { lat: 37.2630000, lng: 127.0290000 },
  '행궁동': { lat: 37.2840000, lng: 127.0170000 },
  '화서동': { lat: 37.2840000, lng: 126.9940000 },
  '지동': { lat: 37.2790000, lng: 127.0240000 },
  '우만동': { lat: 37.2830000, lng: 127.0340000 },
  '고등동': { lat: 37.2750000, lng: 127.0040000 },
  '매산동': { lat: 37.2670000, lng: 127.0020000 },
  // 권선구 주요 동
  '권선동': { lat: 37.2570000, lng: 127.0240000 },
  '세류동': { lat: 37.2540000, lng: 127.0120000 },
  '곡반정동': { lat: 37.2390000, lng: 127.0270000 },
  '호매실동': { lat: 37.2690000, lng: 126.9530000 },
  '금곡동': { lat: 37.2720000, lng: 126.9480000 },
  '구운동': { lat: 37.2810000, lng: 126.9720000 },
  '서둔동': { lat: 37.2710000, lng: 126.9830000 },
  '탑동': { lat: 37.2710000, lng: 126.9690000 },
  '평동': { lat: 37.2580000, lng: 126.9930000 },
  '고색동': { lat: 37.2450000, lng: 126.9820000 },
  '오목천동': { lat: 37.2390000, lng: 126.9650000 },
  '당수동': { lat: 37.2980000, lng: 126.9400000 },
  '입북동': { lat: 37.3050000, lng: 126.9500000 },
  // 인접 시/군
  '의왕시': { lat: 37.3448, lng: 126.9682 },
  '안양시 동안구': { lat: 37.3943, lng: 126.9568 },
  '안양시 만안구': { lat: 37.4003, lng: 126.9238 },
  '용인시 수지구': { lat: 37.3222, lng: 127.0975 },
  '용인시 기흥구': { lat: 37.2804, lng: 127.1147 },
  '화성시 동탄': { lat: 37.2005, lng: 127.0718 },
  '성남시 분당구': { lat: 37.3827, lng: 127.1189 },
};

async function queryNominatim(q: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=ko`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EundalCafeOrderSystem/1.0 (cafe.eundal.app@gmail.com)',
        'Accept-Language': 'ko,en;q=0.9',
      },
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, displayName: data[0].display_name };
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawAddress = searchParams.get('address');

    if (!rawAddress || !rawAddress.trim()) {
      return NextResponse.json({ error: 'Address query parameter is required' }, { status: 400 });
    }

    // 주소 전처리: (우:xxxxx), 괄호 안 내용, 상세 호수 등 제거
    let clean = rawAddress
      .replace(/\(우:[^)]+\)/g, '')
      .replace(/\([^)]+\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 1단계: 전체 주소로 Nominatim 검색
    let result = await queryNominatim(clean);
    if (result) {
      return NextResponse.json({
        lat: result.lat,
        lng: result.lng,
        confidence: 'high',
        source: 'nominatim_full',
        query: clean,
        displayName: result.displayName,
      });
    }

    // 2단계: 도로명 추출 검색 (예: 수원시 영통구 광교중앙로 170 -> 수원시 영통구 광교중앙로)
    const roadMatch = clean.match(/([가-힣]+(?:시|군|구)?\s+[가-힣]+(?:구)?\s+[가-힣0-9]+(?:로|길))/);
    if (roadMatch && roadMatch[1]) {
      result = await queryNominatim(roadMatch[1]);
      if (result) {
        return NextResponse.json({
          lat: result.lat,
          lng: result.lng,
          confidence: 'high',
          source: 'nominatim_road',
          query: roadMatch[1],
          displayName: result.displayName,
        });
      }
    }

    // 3단계: 동/읍/면 추출 검색 (예: 수원시 장안구 조원동)
    const dongMatch = clean.match(/([가-힣]+(?:시|군)?\s+[가-힣]+(?:구)?\s+[가-힣0-9]+(?:동|읍|면))/);
    if (dongMatch && dongMatch[1]) {
      result = await queryNominatim(dongMatch[1]);
      if (result) {
        return NextResponse.json({
          lat: result.lat,
          lng: result.lng,
          confidence: 'medium',
          source: 'nominatim_dong',
          query: dongMatch[1],
          displayName: result.displayName,
        });
      }
    }

    // 4단계: 구/시 추출 검색 (예: 수원시 장안구)
    const guMatch = clean.match(/([가-힣]+시\s+[가-힣]+구)/);
    if (guMatch && guMatch[1]) {
      result = await queryNominatim(guMatch[1]);
      if (result) {
        return NextResponse.json({
          lat: result.lat,
          lng: result.lng,
          confidence: 'medium',
          source: 'nominatim_district',
          query: guMatch[1],
          displayName: result.displayName,
        });
      }
    }

    // 5단계: 사전 매핑된 수원 및 수도권 주요 동/구 검색
    for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
      if (clean.includes(key)) {
        return NextResponse.json({
          lat: coords.lat,
          lng: coords.lng,
          confidence: 'medium',
          source: 'district_dictionary',
          query: key,
          displayName: `${key} 중심`,
        });
      }
    }

    // 최종 기본값: 은달 본점 중심 (수원 장안구)
    return NextResponse.json({
      lat: 37.2966787,
      lng: 127.0215096,
      confidence: 'fallback',
      source: 'default_fallback',
      query: clean,
      displayName: '수원시 장안구 (기본)',
    });
  } catch (error: any) {
    console.error('Geocode search error:', error);
    return NextResponse.json(
      { error: 'Failed to search geocode', message: error?.message },
      { status: 500 }
    );
  }
}
