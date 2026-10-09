import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS, calculateDistanceKm } from '@/lib/geoUtils';
import { categorizeMenuDetailed } from '@/lib/competitorUtils';

const CHAIN_KEYWORDS = [
  '스타벅스', 'STARBUCKS', '투썸플레이스', '투썸', 'TWOSOME',
  '메가커피', '메가MGC', '컴포즈커피', '컴포즈', '빽다방',
  '이디야', 'EDIYA', '할리스', 'HOLLYS', '파스쿠찌',
  '엔제리너스', '탐앤탐스', '폴바셋', '블루보틀', '커피빈',
  '더벤티', '하삼동', '매머드커피', '매머드익스프레스',
  '텐퍼센트커피', '감성커피', '카페봄봄', '더리터', '디저트39',
  '파리바게뜨', '뚜레쥬르', '던킨', '배스킨라빈스'
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let placeId = (body.naver_place_id || body.placeId || '').toString().trim();

    // URL 형태일 경우 ID 추출
    const urlMatch = placeId.match(/(?:restaurant|place)\/(\d+)/);
    if (urlMatch) {
      placeId = urlMatch[1];
    }

    if (!placeId || !/^\d{6,12}$/.test(placeId)) {
      return NextResponse.json(
        { error: '유효한 네이버 플레이스 ID(숫자)를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    // 1. 이미 등록된 매장인지 중복 확인
    const { data: existing } = await supabase
      .from('eundal_competitors')
      .select('id, name, naver_place_id')
      .eq('naver_place_id', placeId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: `'${existing.name}'(은)는 이미 비교 분석에 등록되어 있는 매장입니다.`,
        already_registered: true,
        competitor_id: existing.id,
      });
    }

    // 2. 네이버 플레이스 모바일 상세 페이지에서 실시간 정품 데이터 직접 크롤링
    const detailUrl = `https://m.place.naver.com/restaurant/${placeId}/home`;
    const res = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: '네이버 플레이스 정보를 불러오지 못했습니다. ID를 확인해주세요.' },
        { status: 404 }
      );
    }

    const html = await res.text();
    const match = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{.*?\});/s);
    if (!match) {
      return NextResponse.json(
        { error: '네이버 플레이스 상태 데이터를 파싱할 수 없습니다.' },
        { status: 500 }
      );
    }

    const apollo = JSON.parse(match[1]);
    const base = apollo[`PlaceDetailBase:${placeId}`];
    if (!base || !base.name) {
      return NextResponse.json(
        { error: '매장 기본 정보가 확인되지 않습니다.' },
        { status: 404 }
      );
    }

    // 3. 체인점 및 은달 본점 제외 검증
    const placeName = base.name.trim();
    if (placeId === '1245444726' || placeId === '1869537461' || placeName.includes('은달')) {
      return NextResponse.json(
        { error: '은달 1호점 및 2호점 매장은 경쟁사로 추가할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (CHAIN_KEYWORDS.some(k => placeName.includes(k))) {
      return NextResponse.json(
        { error: `'${placeName}'(은)는 대형 프랜차이즈 체인점으로 로컬 경쟁사 비교 대상에서 제외됩니다.` },
        { status: 400 }
      );
    }

    // 4. 좌표 및 은달 1·2호점 거리 계산
    const lat = parseFloat(base.coordinate?.y) || 0;
    const lng = parseFloat(base.coordinate?.x) || 0;

    const dist1 = calculateDistanceKm(lat, lng, EUNDAL_STORE1_COORDS.lat, EUNDAL_STORE1_COORDS.lng);
    const dist2 = calculateDistanceKm(lat, lng, EUNDAL_STORE2_COORDS.lat, EUNDAL_STORE2_COORDS.lng);

    if (Math.min(dist1, dist2) > 5.0) {
      return NextResponse.json(
        { error: `은달 1호점(${dist1}km), 2호점(${dist2}km)에서 5km를 초과하여 상권 비교 대상이 아닙니다.` },
        { status: 400 }
      );
    }

    // 5. 실제 판매 메뉴 파싱 및 6대 세부분류 정밀 태깅
    const rawMenus = Object.keys(apollo)
      .filter(k => k.startsWith('PlaceMenuItem:'))
      .map(k => apollo[k]);

    const parsedMenus = rawMenus
      .map((m: any) => {
        const priceText = m.price?.displayText || '';
        const basePart = priceText.split('~')[0].split('-')[0];
        let priceNum = parseInt(basePart.replace(/[^0-9]/g, ''), 10) || 0;
        if (priceNum > 2000000) priceNum = Math.min(priceNum, 200000);

        const { mainCategory, subcategory } = categorizeMenuDetailed(m.name, m.description);

        return {
          name: m.name.trim(),
          price: priceNum,
          category: mainCategory,
          subcategory,
          description: m.description || '',
          imageUrl: m.thumbnailUrl || m.images?.[0]?.url || '',
          is_signature: m.badges?.includes('repr') || false,
        };
      })
      .filter((m: any) => m.name && m.price > 0);

    // 카테고리별 분할 (최대 20개씩)
    const drinkMenus = parsedMenus.filter(m => m.category === 'drink').slice(0, 20);
    const dessertMenus = parsedMenus.filter(m => m.category === 'dessert').slice(0, 20);
    const setMenus = parsedMenus.filter(m => m.category === 'set').slice(0, 20);

    // 세부 카테고리별 평균 가격 산출
    const coffeeMenus = parsedMenus.filter(m => m.subcategory === 'coffee');
    const juiceMenus = parsedMenus.filter(m => m.subcategory === 'juice');
    const teaMenus = parsedMenus.filter(m => m.subcategory === 'tea');
    const bakeryMenus = parsedMenus.filter(m => m.subcategory === 'dessert');
    const sandwichMenus = parsedMenus.filter(m => m.subcategory === 'sandwich');
    const setList = parsedMenus.filter(m => m.subcategory === 'set');

    const avgDrink = drinkMenus.length > 0 ? Math.round(drinkMenus.reduce((s, m) => s + m.price, 0) / drinkMenus.length) : 4000;
    const avgDessert = dessertMenus.length > 0 ? Math.round(dessertMenus.reduce((s, m) => s + m.price, 0) / dessertMenus.length) : 4500;
    const avgSet = setMenus.length > 0 ? Math.round(setMenus.reduce((s, m) => s + m.price, 0) / setMenus.length) : 8000;

    const americano = coffeeMenus.find(m => m.name.includes('아메리카노'));
    const avgCoffee = americano ? americano.price : (coffeeMenus.length > 0 ? Math.round(coffeeMenus.reduce((s, m) => s + m.price, 0) / coffeeMenus.length) : avgDrink);
    const avgJuice = juiceMenus.length > 0 ? Math.round(juiceMenus.reduce((s, m) => s + m.price, 0) / juiceMenus.length) : 5000;
    const avgTea = teaMenus.length > 0 ? Math.round(teaMenus.reduce((s, m) => s + m.price, 0) / teaMenus.length) : 4500;
    const avgSandwich = sandwichMenus.length > 0 ? Math.round(sandwichMenus.reduce((s, m) => s + m.price, 0) / sandwichMenus.length) : 6500;

    // 브랜드 유형 자동 판별
    let brandType = 'small_coffee';
    if (base.category?.includes('디저트') || base.category?.includes('베이커리') || base.category?.includes('케이크') || dessertMenus.length > drinkMenus.length) {
      brandType = 'dessert_cafe';
    } else if (placeName.includes('로스터리') || placeName.includes('스탠드') || avgCoffee >= 4500) {
      brandType = 'specialty';
    }

    const rating = parseFloat(base.visitorReviewsScore) || 4.6;
    const reviewCount = parseInt(base.visitorReviewsTotal, 10) || 0;
    const blogReviewCount = parseInt(base.cafeBlogReviewsTotal, 10) || 0;

    // 인지도 점수
    const popularityScore = Math.min(
      99.9,
      Math.round(((rating * 12) + Math.log10(reviewCount + 1) * 12) * 10) / 10
    );

    // 6. DB eundal_competitors 테이블에 Insert
    const competitorPayload = {
      name: placeName,
      brand_type: brandType,
      target_branch: dist1 < dist2 ? 'store1' : 'store2',
      distance_store1: dist1,
      distance_store2: dist2,
      address: base.roadAddress || base.address || '',
      address_detail: '',
      phone: base.phone || '',
      latitude: lat,
      longitude: lng,
      naver_place_id: placeId,
      naver_place_url: detailUrl,
      rating,
      review_count: reviewCount,
      blog_review_count: blogReviewCount,
      popularity_score: popularityScore,
      image_url: parsedMenus[0]?.imageUrl || '',
      description: base.description || '',
      representative_menu: parsedMenus.find(m => m.is_signature)?.name || parsedMenus[0]?.name || '',
      avg_coffee_price: avgCoffee,
      avg_drink_price: avgDrink,
      avg_dessert_price: avgDessert,
      avg_set_price: avgSet,
      avg_juice_price: avgJuice,
      avg_tea_price: avgTea,
      avg_sandwich_price: avgSandwich,
      is_active: true,
      sort_order: 99,
    };

    const { data: newComp, error: insertError } = await supabase
      .from('eundal_competitors')
      .insert(competitorPayload)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 7. eundal_competitor_menus 테이블에 메뉴 일괄 Insert
    const menusToInsert = [...drinkMenus, ...dessertMenus, ...setMenus].map((m, idx) => ({
      competitor_id: newComp.id,
      name: m.name,
      category: m.category,
      price: m.price,
      is_signature: m.is_signature,
      sort_order: idx + 1,
    }));

    if (menusToInsert.length > 0) {
      const { error: menuInsertError } = await supabase
        .from('eundal_competitor_menus')
        .insert(menusToInsert);

      if (menuInsertError) {
        console.error('Menu insert error:', menuInsertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `'${placeName}'(이)가 원터치로 비교 분석에 성공적으로 추가되었습니다.`,
      competitor: newComp,
      menus_count: menusToInsert.length,
    });
  } catch (error: any) {
    console.error('Quick add competitor error:', error);
    return NextResponse.json(
      { error: error.message || '원터치 추가 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
