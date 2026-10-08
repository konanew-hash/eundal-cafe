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

    // 은달 카페 자체 메뉴 정보 조회 (비교용)
    const { data: eundalMenus } = await supabase
      .from('eundal_menus')
      .select('id, name, price, is_sold_out, category_id')
      .eq('is_active', true);

    // 은달 아메리카노 & 라떼 가격 추출
    const eundalAmericano = (eundalMenus || []).find(m => m.name.includes('아메리카노'))?.price || 2500;
    const eundalLatte = (eundalMenus || []).find(m => m.name.includes('카페라떼') || m.name.includes('라떼'))?.price || 3500;

    // 메뉴를 각 경쟁사 객체에 조인
    const menuMap = new Map<string, any[]>();
    for (const m of (menus || [])) {
      if (!menuMap.has(m.competitor_id)) {
        menuMap.set(m.competitor_id, []);
      }
      menuMap.get(m.competitor_id)!.push(m);
    }

    const mergedCompetitors = (competitors || []).map(c => ({
      ...c,
      menus: menuMap.get(c.id) || [],
    }));

    return NextResponse.json({
      competitors: mergedCompetitors,
      eundalBenchmark: {
        americanoPrice: eundalAmericano,
        lattePrice: eundalLatte,
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
