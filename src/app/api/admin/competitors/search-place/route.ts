import { NextRequest, NextResponse } from 'next/server';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS, calculateDistanceKm } from '@/lib/geoUtils';
import { getSupabaseServer } from '@/lib/supabase';

const CHAIN_KEYWORDS = [
  '스타벅스', 'STARBUCKS', '투썸플레이스', '투썸', 'TWOSOME',
  '메가커피', '메가MGC', '컴포즈커피', '컴포즈', '빽다방',
  '이디야', 'EDIYA', '할리스', 'HOLLYS', '파스쿠찌',
  '엔제리너스', '탐앤탐스', '폴바셋', '블루보틀', '커피빈',
  '더벤티', '하삼동', '매머드커피', '매머드익스프레스',
  '텐퍼센트커피', '감성커피', '카페봄봄', '더리터', '디저트39',
  '파리바게뜨', '뚜레쥬르', '던킨', '배스킨라빈스'
];

function categorizeMenu(name: string, desc?: string): 'drink' | 'dessert' | 'set' {
  const text = (name + ' ' + (desc || '')).toLowerCase();
  
  if (text.includes('세트') || text.includes('set') || text.includes('플래터') || text.includes('패키지')) {
    return 'set';
  }
  
  const dessertKeywords = [
    '케이크', '케익', '베이글', '쿠키', '휘낭시에', '마들렌', '스콘', '타르트', '소금빵',
    '빵', '샌드위치', '크루아상', '크로와상', '크로플', '파니니', '와플', '판나코타', '브라우니',
    '티라미수', '초콜릿', '마카롱', '롤케이크', '다쿠아즈', '오란다', '까눌레', '파이', '디저트',
    '산도', '토스트', '도넛', '약과', '푸딩', '빙수'
  ];
  if (dessertKeywords.some(k => text.includes(k))) {
    return 'dessert';
  }
  
  return 'drink';
}

// 100% 네이버 플레이스 정품 데이터 추출기
async function fetchVerifiedNaverPlace(placeId: string) {
  const url = `https://m.place.naver.com/restaurant/${placeId}/home`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    },
    signal: AbortSignal.timeout(7000),
  });

  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{.*?\});/s);
  if (!match) return null;

  const apollo = JSON.parse(match[1]);
  const base = apollo[`PlaceDetailBase:${placeId}`];
  if (!base || !base.name) return null;

  const rawMenus = Object.keys(apollo)
    .filter(k => k.startsWith('PlaceMenuItem:'))
    .map(k => apollo[k]);

  const parsedMenus = rawMenus
    .map((m: any) => {
      const priceText = m.price?.displayText || '';
      const basePart = priceText.split('~')[0].split('-')[0];
      let priceNum = parseInt(basePart.replace(/[^0-9]/g, ''), 10) || 0;
      if (priceNum > 2000000) priceNum = Math.min(priceNum, 200000);
      const category = categorizeMenu(m.name, m.description);
      return {
        name: m.name.trim(),
        price: priceNum,
        category,
        description: m.description || '',
        imageUrl: m.thumbnailUrl || m.images?.[0]?.url || '',
        is_signature: m.badges?.includes('repr') || false,
      };
    })
    .filter((m: any) => m.name && m.price > 0);

  const lat = parseFloat(base.coordinate?.y) || 0;
  const lng = parseFloat(base.coordinate?.x) || 0;

  return {
    placeId,
    name: base.name.trim(),
    category: base.category || '카페,디저트',
    roadAddress: base.roadAddress || base.address || '',
    address: base.address || '',
    phone: base.phone || '',
    rating: parseFloat(base.visitorReviewsScore) || 4.5,
    reviewCount: parseInt(base.visitorReviewsTotal, 10) || 0,
    blogReviewCount: parseInt(base.cafeBlogReviewsTotal, 10) || 0,
    latitude: lat,
    longitude: lng,
    menus: parsedMenus,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawInput = (searchParams.get('placeId') || searchParams.get('query') || '').trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: '네이버 플레이스 ID 또는 플레이스 주소 URL을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // 1. 입력값에서 네이버 플레이스 ID 추출 (URL이거나 직접 ID 입력된 경우)
    let extractedPlaceId = '';
    const urlMatch = rawInput.match(/(?:restaurant|place)\/(\d+)/);
    if (urlMatch) {
      extractedPlaceId = urlMatch[1];
    } else if (/^\d{6,12}$/.test(rawInput)) {
      extractedPlaceId = rawInput;
    }

    const candidateIds: string[] = [];

    if (extractedPlaceId) {
      candidateIds.push(extractedPlaceId);
    } else {
      // 상호명 검색 시 네이버 모바일 검색을 통해 실제 네이버 플레이스 ID 검색
      const searchUrl = `https://m.search.naver.com/search.naver?query=${encodeURIComponent(rawInput + ' 수원')}`;
      try {
        const searchRes = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          },
          signal: AbortSignal.timeout(6000),
        });
        if (searchRes.ok) {
          const searchHtml = await searchRes.text();
          const matches = [...searchHtml.matchAll(/\/restaurant\/(\d+)/g)].map(m => m[1]);
          const unique = [...new Set(matches)];
          candidateIds.push(...unique.slice(0, 5));
        }
      } catch (err) {
        console.warn('Naver search failed:', err);
      }
    }

    if (candidateIds.length === 0) {
      return NextResponse.json({
        places: [],
        message: '해당 입력값으로 확인된 네이버 플레이스 ID가 없습니다. 정확한 네이버 플레이스 ID 또는 주소 URL을 입력해주세요.'
      });
    }

    // 이미 등록된 경쟁사 플레이스 ID 목록 조회
    const { data: existingCompetitors } = await supabase
      .from('eundal_competitors')
      .select('naver_place_id, name')
      .not('naver_place_id', 'is', null);

    const existingIdMap = new Map<string, string>();
    (existingCompetitors || []).forEach(c => {
      if (c.naver_place_id) existingIdMap.set(c.naver_place_id, c.name);
    });

    const verifiedPlaces = [];

    for (const placeId of candidateIds) {
      const placeData = await fetchVerifiedNaverPlace(placeId);
      if (!placeData) continue;

      // 은달 매장 제외
      if (placeId === '1245444726' || placeId === '1869537461' || placeData.name.includes('은달')) {
        continue;
      }

      // 프랜차이즈 체인점 제외
      if (CHAIN_KEYWORDS.some(k => placeData.name.includes(k))) {
        continue;
      }

      const dist1 = calculateDistanceKm(placeData.latitude, placeData.longitude, EUNDAL_STORE1_COORDS.lat, EUNDAL_STORE1_COORDS.lng);
      const dist2 = calculateDistanceKm(placeData.latitude, placeData.longitude, EUNDAL_STORE2_COORDS.lat, EUNDAL_STORE2_COORDS.lng);

      // 반경 5km 초과 제외
      if (Math.min(dist1, dist2) > 5.0) {
        continue;
      }

      const drinkMenus = placeData.menus.filter((m: any) => m.category === 'drink').slice(0, 20);
      const dessertMenus = placeData.menus.filter((m: any) => m.category === 'dessert').slice(0, 20);
      const setMenus = placeData.menus.filter((m: any) => m.category === 'set').slice(0, 20);

      const avgDrink = drinkMenus.length > 0
        ? Math.round(drinkMenus.reduce((s: number, m: any) => s + m.price, 0) / drinkMenus.length)
        : 4000;
      const avgDessert = dessertMenus.length > 0
        ? Math.round(dessertMenus.reduce((s: number, m: any) => s + m.price, 0) / dessertMenus.length)
        : 4500;
      const avgSet = setMenus.length > 0
        ? Math.round(setMenus.reduce((s: number, m: any) => s + m.price, 0) / setMenus.length)
        : 8000;

      const americanoItem = drinkMenus.find((m: any) => m.name.includes('아메리카노'));
      const avgCoffee = americanoItem ? americanoItem.price : avgDrink;

      let brandType = 'small_coffee';
      if (placeData.category.includes('케이크') || placeData.category.includes('디저트') || placeData.category.includes('베이커리') || dessertMenus.length > drinkMenus.length) {
        brandType = 'dessert_cafe';
      } else if (placeData.name.includes('로스터리') || placeData.name.includes('스탠드') || avgCoffee >= 4500) {
        brandType = 'specialty';
      }

      const isRegistered = existingIdMap.has(placeId);

      verifiedPlaces.push({
        id: placeId,
        naver_place_id: placeId,
        naver_place_url: `https://m.place.naver.com/restaurant/${placeId}/home`,
        name: placeData.name,
        category: placeData.category,
        brand_type: brandType,
        roadAddress: placeData.roadAddress,
        address: placeData.address || placeData.roadAddress,
        phone: placeData.phone,
        rating: placeData.rating,
        review_count: placeData.reviewCount,
        blog_review_count: placeData.blogReviewCount,
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        distance_store1: dist1,
        distance_store2: dist2,
        target_branch: dist1 < dist2 ? 'store1' : 'store2',
        avg_coffee_price: avgCoffee,
        avg_drink_price: avgDrink,
        avg_dessert_price: avgDessert,
        avg_set_price: avgSet,
        representative_menu: placeData.menus.find((m: any) => m.is_signature)?.name || placeData.menus[0]?.name || '',
        image_url: placeData.menus[0]?.imageUrl || '',
        menus: [...drinkMenus, ...dessertMenus, ...setMenus],
        is_already_registered: isRegistered,
        already_registered_name: isRegistered ? existingIdMap.get(placeId) : null,
      });
    }

    return NextResponse.json({
      places: verifiedPlaces,
      totalFound: verifiedPlaces.length,
      searchedId: extractedPlaceId || null,
    });
  } catch (error: any) {
    console.error('Search place error:', error);
    return NextResponse.json(
      { error: error.message || '네이버 플레이스 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
