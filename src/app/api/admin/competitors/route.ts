import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS, calculateDistanceKm } from '@/lib/geoUtils';

// 1. 경쟁사 전체 목록 & 은달 대표 메뉴 가격 통계 조회
export async function GET() {
  const supabase = getSupabaseServer();

  try {
    // 경쟁사 목록 조회
    const { data: competitors, error: compError } = await supabase
      .from('eundal_competitors')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (compError) {
      throw compError;
    }

    // 경쟁사별 메뉴 목록 조회
    const { data: menus, error: menuError } = await supabase
      .from('eundal_competitor_menus')
      .select('*')
      .order('sort_order', { ascending: true });

    if (menuError) {
      throw menuError;
    }

    // 은달 카페 자체 카테고리 & 메뉴 정보 조회 (정밀 비교용)
    const { data: eundalCategories } = await supabase
      .from('eundal_categories')
      .select('id, name')
      .eq('is_active', true);

    const { data: eundalMenus } = await supabase
      .from('eundal_menus')
      .select('id, name, price, is_sold_out, category_id, image_url')
      .eq('is_active', true);

    // 카테고리 맵 생성
    const catMap = new Map((eundalCategories || []).map(c => [c.id, c.name]));

    // 음료류 카테고리 (커피, 논커피, 음료, 은달 시그니처, 티, 에이드 등)
    const drinkKeywords = ['커피', '논커피', '음료', '시그니처', '에이드', '티', '라떼', '스무디', '주스'];
    const eundalDrinkMenus = (eundalMenus || []).filter(m => {
      const catName = catMap.get(m.category_id) || '';
      return drinkKeywords.some(k => catName.includes(k));
    });

    // 디저트류 카테고리 (수제 디저트, 수제 샌드위치 등)
    const dessertKeywords = ['디저트', '샌드위치', '베이커리', '빵', '쿠키', '타르트'];
    const eundalDessertMenus = (eundalMenus || []).filter(m => {
      const catName = catMap.get(m.category_id) || '';
      return dessertKeywords.some(k => catName.includes(k));
    });

    // 은달 실시간 음료류 평균가 (커피+논커피+음료+은달 시그니처 23종 모두 포함)
    const eundalAvgDrink = eundalDrinkMenus.length > 0
      ? Math.round(eundalDrinkMenus.reduce((sum, m) => sum + m.price, 0) / eundalDrinkMenus.length)
      : 5000;

    // 은달 실시간 디저트류 평균가 (수제디저트 14종 + 샌드위치 12종)
    const eundalAvgDessert = eundalDessertMenus.length > 0
      ? Math.round(eundalDessertMenus.reduce((sum, m) => sum + m.price, 0) / eundalDessertMenus.length)
      : 4400;

    // 은달 대표 커피 가격
    const eundalAmericano = (eundalMenus || []).find(m => m.name.includes('아메리카노'))?.price || 3000;
    const eundalLatte = (eundalMenus || []).find(m => m.name.includes('카페라떼') || m.name.includes('라떼'))?.price || 4000;

    // 은달 추천 세트 가격 정보도 조회
    const { data: eundalSets } = await supabase.from('eundal_preset_sets').select('price').eq('is_active', true);
    const eundalSetPrices = (eundalSets || []).map(s => s.price).filter(p => p > 0);
    const eundalAvgSet = eundalSetPrices.length > 0 ? Math.round(eundalSetPrices.reduce((a, b) => a + b, 0) / eundalSetPrices.length) : 7500;

    // 은달 메뉴에 카테고리 이름 부착
    const enrichedEundalMenus = (eundalMenus || []).map(m => ({
      ...m,
      category_name: catMap.get(m.category_id) || '기타',
      is_drink: drinkKeywords.some(k => (catMap.get(m.category_id) || '').includes(k)),
      is_dessert: dessertKeywords.some(k => (catMap.get(m.category_id) || '').includes(k)),
    }));

    // 메뉴를 각 경쟁사 객체에 조인하고 카테고리별 평균 가격 산출
    const menuMap = new Map<string, any[]>();
    for (const m of (menus || [])) {
      if (!menuMap.has(m.competitor_id)) {
        menuMap.set(m.competitor_id, []);
      }
      menuMap.get(m.competitor_id)!.push(m);
    }

    const mergedCompetitors = (competitors || []).map(c => {
      const cMenus = menuMap.get(c.id) || [];
      const drinkMenus = cMenus.filter(m => m.category === 'drink' || m.category === 'coffee' || m.category === 'beverage');
      const dessertMenus = cMenus.filter(m => m.category === 'dessert' || m.category === 'bakery');
      const setMenus = cMenus.filter(m => m.category === 'set');

      const avgDrink = drinkMenus.length > 0
        ? Math.round(drinkMenus.reduce((sum, m) => sum + (m.price || 0), 0) / drinkMenus.length)
        : (c.avg_drink_price || c.avg_coffee_price || 4200);

      const avgDessert = dessertMenus.length > 0
        ? Math.round(dessertMenus.reduce((sum, m) => sum + (m.price || 0), 0) / dessertMenus.length)
        : (c.avg_dessert_price || 3800);

      const avgSet = setMenus.length > 0
        ? Math.round(setMenus.reduce((sum, m) => sum + (m.price || 0), 0) / setMenus.length)
        : (c.avg_set_price || 8500);

      return {
        ...c,
        menus: cMenus,
        avg_drink_price: avgDrink,
        avg_dessert_price: avgDessert,
        avg_set_price: avgSet,
      };
    });

    return NextResponse.json({
      competitors: mergedCompetitors,
      eundalMenus: enrichedEundalMenus,
      eundalBenchmark: {
        americanoPrice: eundalAmericano,
        lattePrice: eundalLatte,
        avgDrinkPrice: eundalAvgDrink, // 은달 전체 음료 실제 평균 (커피+논커피+음료+은달 시그니처 23종 정밀 계산)
        avgDessertPrice: eundalAvgDessert, // 은달 수제 디저트+샌드위치 실제 평균
        avgSetPrice: eundalAvgSet, // 은달 세트 평균
        store1: EUNDAL_STORE1_COORDS,
        store2: EUNDAL_STORE2_COORDS,
      },
    });
  } catch (error: any) {
    console.error('Failed to get competitors:', error);
    return NextResponse.json({ error: error.message || '조회 실패' }, { status: 500 });
  }
}

// 2. 신규 경쟁사 등록 (메뉴 목록 동시 저장 지원)
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();

  try {
    const body = await request.json();
    const {
      name,
      brand_type = 'independent',
      target_branch = 'both',
      address,
      address_detail,
      phone,
      latitude,
      longitude,
      naver_place_id,
      naver_place_url,
      rating = 4.5,
      review_count = 0,
      blog_review_count = 0,
      image_url,
      description,
      representative_menu,
      avg_coffee_price = 4500,
      sort_order = 1,
      menus = [],
    } = body;

    if (!name || !address || !latitude || !longitude) {
      return NextResponse.json(
        { error: '상호명, 도로명 주소, 위경도 좌표는 필수입니다.' },
        { status: 400 }
      );
    }

    // 은달 1호점 및 2호점 거리 자동 계산
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const dist1 = calculateDistanceKm(latNum, lngNum, EUNDAL_STORE1_COORDS.lat, EUNDAL_STORE1_COORDS.lng);
    const dist2 = calculateDistanceKm(latNum, lngNum, EUNDAL_STORE2_COORDS.lat, EUNDAL_STORE2_COORDS.lng);

    // 인지도 점수 계산식 (평점*12 + 리뷰수 가중치)
    const popScore = Math.min(
      99.9,
      Math.round(((parseFloat(rating) || 4.5) * 12 + Math.log10((parseInt(review_count, 10) || 10) + 1) * 12) * 10) / 10
    );

    const { data: insertedComp, error: insertError } = await supabase
      .from('eundal_competitors')
      .insert({
        name,
        brand_type,
        target_branch,
        distance_store1: dist1,
        distance_store2: dist2,
        address,
        address_detail,
        phone,
        latitude: latNum,
        longitude: lngNum,
        naver_place_id: naver_place_id || null,
        naver_place_url: naver_place_url || null,
        rating: parseFloat(rating) || 4.5,
        review_count: parseInt(review_count, 10) || 0,
        blog_review_count: parseInt(blog_review_count, 10) || 0,
        popularity_score: popScore,
        image_url: image_url || null,
        description,
        representative_menu,
        avg_coffee_price: parseInt(avg_coffee_price, 10) || 4500,
        sort_order: parseInt(sort_order, 10) || 1,
        is_active: true,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // 메뉴 목록이 있으면 일괄 삽입
    if (Array.isArray(menus) && menus.length > 0) {
      const menuRows = menus.map((m: any, idx: number) => ({
        competitor_id: insertedComp.id,
        name: m.name,
        category: m.category || 'coffee',
        price: parseInt(m.price, 10) || 0,
        description: m.description || null,
        is_signature: Boolean(m.is_signature),
        sort_order: idx + 1,
      }));

      await supabase.from('eundal_competitor_menus').insert(menuRows);
    }

    return NextResponse.json({ success: true, competitor: insertedComp });
  } catch (error: any) {
    console.error('Failed to create competitor:', error);
    return NextResponse.json({ error: error.message || '등록 실패' }, { status: 500 });
  }
}
