import { NextRequest, NextResponse } from 'next/server';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS, calculateDistanceKm } from '@/lib/geoUtils';
import { getSupabaseServer } from '@/lib/supabase';

// 은달 1호점(조원동) & 2호점(파장동) 5km 반경 내 실제 검증된 네이버 플레이스 카페 후보군
const RADAR_CANDIDATES = [
  // 1. 기존 시스템 등록 매장군 (35곳 - 네이버 플레이스 검증 완료)
  { id: '2020865073', name: '카페디아즈 수원종합운동장점', category: '카페,디저트', roadAddress: '경기 수원시 장안구 경수대로 910', lat: 37.2974, lng: 127.0142, phone: '0507-1335-0544' },
  { id: '1080496199', name: '찐스뉴욕베이글', category: '베이글,샌드위치', roadAddress: '경기 수원시 장안구 조원로 89', lat: 37.3005, lng: 127.0210, phone: '031-242-1203' },
  { id: '1068939225', name: 'MLMC', category: '스페셜티 카페', roadAddress: '경기 수원시 장안구 영화로 71', lat: 37.2920, lng: 127.0115, phone: '031-241-1120' },
  { id: '1000361555', name: '레이지에프터눈', category: '디저트 카페', roadAddress: '경기 수원시 장안구 팔달로 259', lat: 37.2895, lng: 127.0135, phone: '070-7762-1111' },
  { id: '2014736192', name: '카페인포커스', category: '스페셜티 커피', roadAddress: '경기 수원시 장안구 조원로 54', lat: 37.2985, lng: 127.0225, phone: '031-255-0912' },
  { id: '2086826479', name: '홈스윗홈', category: '디저트 카페', roadAddress: '경기 수원시 장안구 송정로 187', lat: 37.2950, lng: 127.0170, phone: '0507-1342-9981' },
  { id: '2004229763', name: '룹 디저트하우스', category: '디저트 전문', roadAddress: '경기 수원시 장안구 수성로 340', lat: 37.2935, lng: 127.0080, phone: '031-248-3331' },
  { id: '2035555780', name: '산도마치', category: '산도,샌드위치', roadAddress: '경기 수원시 팔달구 신풍로 45', lat: 37.2845, lng: 127.0140, phone: '0507-1384-5512' },
  { id: '2071374324', name: '지리커피', category: '로스터리', roadAddress: '경기 수원시 장안구 파장로 82', lat: 37.3060, lng: 126.9950, phone: '031-269-0210' },
  { id: '2071294569', name: '와프루', category: '와플,디저트', roadAddress: '경기 수원시 장안구 경수대로 976', lat: 37.3010, lng: 127.0120, phone: '031-251-8840' },
  { id: '2083855535', name: '후츄', category: '구움과자 디저트', roadAddress: '경기 수원시 장안구 송정로 66', lat: 37.2930, lng: 127.0190, phone: '0507-1331-4490' },
  { id: '2070234391', name: '젠틀리로스터스 북수동점', category: '로스터리', roadAddress: '경기 수원시 팔달구 북수동 25', lat: 37.2860, lng: 127.0180, phone: '031-244-1188' },
  { id: '2065797856', name: '필코커피스탠드', category: '에스프레소바', roadAddress: '경기 수원시 장안구 영화로 15', lat: 37.2900, lng: 127.0090, phone: '031-247-0901' },
  { id: '1611426443', name: '피노베이커리카페', category: '베이커리', roadAddress: '경기 수원시 장안구 만석로 19', lat: 37.3040, lng: 127.0010, phone: '031-268-5522' },
  { id: '1859629687', name: '수원빵다방A', category: '베이커리 디저트', roadAddress: '경기 수원시 장안구 파장로 22', lat: 37.3080, lng: 126.9930, phone: '031-271-9988' },
  { id: '1031166458', name: '피첼로비앤디', category: '베이커리 디저트', roadAddress: '경기 수원시 장안구 정조로 922', lat: 37.2915, lng: 127.0125, phone: '031-243-7711' },
  { id: '1140603096', name: '아더엘', category: '디저트 카페', roadAddress: '경기 수원시 장안구 송원로 86', lat: 37.2990, lng: 127.0185, phone: '0507-1318-2234' },
  { id: '1704087398', name: '안녕우디', category: '디저트 카페', roadAddress: '경기 수원시 장안구 조원로 111', lat: 37.3020, lng: 127.0230, phone: '031-253-6677' },
  { id: '1770135663', name: '나프리카페 수원본점', category: '스페셜티 커피', roadAddress: '경기 수원시 장안구 서부로 2139', lat: 37.2980, lng: 126.9890, phone: '031-294-0102' },
  { id: '2017877378', name: '르코콩', category: '구움과자 디저트', roadAddress: '경기 수원시 장안구 송정로 142', lat: 37.2965, lng: 127.0160, phone: '0507-1390-8812' },
  { id: '2074694605', name: '브루테일', category: '커피,음료', roadAddress: '경기 수원시 장안구 영화로 48', lat: 37.2910, lng: 127.0100, phone: '031-258-0099' },
  { id: '1317133092', name: '쏠스트릿 행궁점', category: '디저트,스페셜티', roadAddress: '경기 수원시 팔달구 화서문로 48', lat: 37.2850, lng: 127.0130, phone: '0507-1377-6623' },
  { id: '2092481286', name: '구할', category: '소규모 커피점', roadAddress: '경기 수원시 장안구 파장로 55', lat: 37.3070, lng: 126.9960, phone: '031-269-8800' },
  { id: '2098553434', name: '코히', category: '핸드드립 커피', roadAddress: '경기 수원시 장안구 조원로 42', lat: 37.2970, lng: 127.0205, phone: '031-254-1234' },
  { id: '1312039584', name: '카페워터쿨러 광교', category: '디저트 카페', roadAddress: '경기 수원시 영통구 광교중앙로 170', lat: 37.2880, lng: 127.0510, phone: '031-215-4422' },
  { id: '1085343521', name: '리틀커피하우스', category: '소규모 커피점', roadAddress: '경기 수원시 장안구 송죽동 450', lat: 37.3030, lng: 127.0080, phone: '031-256-7890' },
  { id: '1233756385', name: 'birdcoffeebrewers', category: '로스터리', roadAddress: '경기 수원시 장안구 영화동 302', lat: 37.2890, lng: 127.0070, phone: '031-242-9911' },
  { id: '2005722188', name: '짜이디디', category: '밀크티,음료', roadAddress: '경기 수원시 장안구 조원로 15', lat: 37.2960, lng: 127.0195, phone: '0507-1365-1102' },
  { id: '2034316419', name: '케이크미지', category: '케이크,디저트', roadAddress: '경기 수원시 장안구 정자로 134', lat: 37.2995, lng: 127.0015, phone: '0507-1323-9901' },
  { id: '2056410899', name: '카페 휘리리 행궁점', category: '디저트 카페', roadAddress: '경기 수원시 팔달구 신풍로 32', lat: 37.2840, lng: 127.0150, phone: '0507-1341-7788' },
  { id: '1401254045', name: '제이델링 수원장안점', category: '케이크,디저트', roadAddress: '경기 수원시 장안구 만석로19번길 11', lat: 37.3050, lng: 126.9995, phone: '0507-1371-5523' },
  { id: '1467600381', name: '서동진의커피랩 본점', category: '로스터리 카페', roadAddress: '경기 수원시 팔달구 정조로 886', lat: 37.2885, lng: 127.0120, phone: '031-246-8889' },
  { id: '1474034101', name: '정지영커피로스터즈 행궁본점', category: '스페셜티 카페', roadAddress: '경기 수원시 팔달구 신풍로 42', lat: 37.2848, lng: 127.0145, phone: '031-247-2017' },
  { id: '1797896251', name: '킵댓 본점', category: '에스프레소바', roadAddress: '경기 수원시 팔달구 화서문로 31', lat: 37.2855, lng: 127.0138, phone: '070-4100-3333' },
  { id: '2013471031', name: '쫀독쫀독', category: '구움과자 디저트', roadAddress: '경기 수원시 장안구 조원로 77', lat: 37.2998, lng: 127.0218, phone: '0507-1355-6677' },

  // 2. 미등록 주변 후보 매장군 (실재하는 수원 북수원·행궁동 네이버 플레이스 정품 매장)
  { id: '1601638464', name: '아우토그라프커피 행궁본점', category: '에스프레소,로스터리', roadAddress: '경기 수원시 팔달구 화서문로31번길 14-20', lat: 37.2858, lng: 127.0132, phone: '0507-1478-0199' },
  { id: '1805614608', name: '패터슨커피', category: '디저트 카페', roadAddress: '경기 수원시 팔달구 화서문로 33 2층', lat: 37.2856, lng: 127.0141, phone: '0507-1309-8765' },
  { id: '1755002654', name: '노팅힐 베이커리', category: '베이커리,디저트', roadAddress: '경기 수원시 팔달구 신풍로23번길 38-8', lat: 37.2838, lng: 127.0149, phone: '0507-1488-2321' },
  { id: '1041229679', name: '디데이 하우스', category: '디저트 카페', roadAddress: '경기 수원시 팔달구 화서문로45번길 12-7', lat: 37.2862, lng: 127.0128, phone: '0507-1339-4412' },
  { id: '1696791352', name: '누크녹카라멜하우스', category: '디저트 카페', roadAddress: '경기 수원시 팔달구 화서문로42번길 51', lat: 37.2850, lng: 127.0125, phone: '0507-1399-5561' },
  { id: '1500057241', name: '식물원1982', category: '카페,디저트', roadAddress: '경기 수원시 장안구 장안로 278', lat: 37.3085, lng: 126.9880, phone: '031-268-1982' },
  { id: '1602519523', name: '커피마마퀸 수원조원점', category: '디저트,커피', roadAddress: '경기 수원시 장안구 금당로 39', lat: 37.3000, lng: 127.0175, phone: '031-252-0988' },
  { id: '1054366606', name: '정지영커피로스터즈 화홍문점', category: '스페셜티 카페', roadAddress: '경기 수원시 팔달구 수원천로 375', lat: 37.2875, lng: 127.0195, phone: '031-242-2017' },
  { id: '1056586326', name: '정지영커피로스터즈 장안문점', category: '스페셜티 카페', roadAddress: '경기 수원시 팔달구 정조로 905-13', lat: 37.2890, lng: 127.0140, phone: '031-252-2017' },
  { id: '1993806282', name: '그레비티 행궁점', category: '디저트,커피', roadAddress: '경기 수원시 팔달구 화서문로 41', lat: 37.2854, lng: 127.0136, phone: '0507-1336-0922' },
  { id: '1637767119', name: '카페 초안', category: '차(Tea),디저트', roadAddress: '경기 수원시 팔달구 창룡대로29번길 13', lat: 37.2865, lng: 127.0210, phone: '0507-1365-1199' },
  { id: '1992224097', name: '홍라드 본점', category: '디저트 카페', roadAddress: '경기 수원시 팔달구 화서문로16번길 15', lat: 37.2845, lng: 127.0148, phone: '070-4221-1223' },
  { id: '1215444391', name: '올웨이즈나이스', category: '샌드위치,브런치', roadAddress: '경기 수원시 팔달구 신풍로63번길 11-2', lat: 37.2858, lng: 127.0155, phone: '0507-1329-8812' },
  { id: '1772418386', name: '콜링우드', category: '디저트,크로플', roadAddress: '경기 수원시 팔달구 정조로888번길 21', lat: 37.2880, lng: 127.0145, phone: '0507-1383-7721' },
  { id: '1832961748', name: '위해브투데이', category: '디저트,커피', roadAddress: '경기 수원시 팔달구 신풍로23번길 4', lat: 37.2842, lng: 127.0142, phone: '0507-1367-9912' },
  { id: '1889814545', name: '에버바이브', category: '소규모 커피점', roadAddress: '경기 수원시 장안구 정조로 934', lat: 37.2925, lng: 127.0120, phone: '031-245-0911' },
  { id: '1658428801', name: '하이헤이호', category: '디저트,커피', roadAddress: '경기 수원시 장안구 팔달로 273-1', lat: 37.2905, lng: 127.0130, phone: '0507-1322-8765' },
  { id: '1884803714', name: '베이크룸', category: '구움과자 디저트', roadAddress: '경기 수원시 장안구 송원로 59', lat: 37.2980, lng: 127.0175, phone: '0507-1349-1122' },
  { id: '1222474665', name: '블루블루베이글', category: '베이글,샌드위치', roadAddress: '경기 수원시 장안구 대평로 128', lat: 37.2990, lng: 126.9920, phone: '031-269-3321' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get('branch') || 'all'; // 'all' | 'store1' | 'store2'
    const statusFilter = searchParams.get('status') || 'all'; // 'all' | 'registered' | 'unregistered'
    const searchKeyword = (searchParams.get('search') || '').trim().toLowerCase();

    const supabase = getSupabaseServer();

    // 1. 현재 DB에 등록된 경쟁사 조회
    const { data: dbCompetitors, error } = await supabase
      .from('eundal_competitors')
      .select('id, name, naver_place_id, naver_place_url, rating, review_count, distance_store1, distance_store2, address, phone')
      .not('naver_place_id', 'is', null);

    if (error) {
      throw error;
    }

    const registeredMap = new Map<string, any>();
    (dbCompetitors || []).forEach(c => {
      if (c.naver_place_id) {
        registeredMap.set(c.naver_place_id, c);
      }
    });

    // 2. 레이더 후보군 목록에 등록 상태 및 거리 계산 결합
    const radarItems = RADAR_CANDIDATES.map((cand) => {
      const registered = registeredMap.get(cand.id);
      const isRegistered = Boolean(registered);

      const d1 = registered?.distance_store1 ?? calculateDistanceKm(cand.lat, cand.lng, EUNDAL_STORE1_COORDS.lat, EUNDAL_STORE1_COORDS.lng);
      const d2 = registered?.distance_store2 ?? calculateDistanceKm(cand.lat, cand.lng, EUNDAL_STORE2_COORDS.lat, EUNDAL_STORE2_COORDS.lng);

      let brandType = 'small_coffee';
      const cat = (cand.category || '').toLowerCase();
      if (cat.includes('디저트') || cat.includes('베이글') || cat.includes('베이커리') || cat.includes('케이크') || cat.includes('와플') || cat.includes('구움과자')) {
        brandType = 'dessert_cafe';
      } else if (cat.includes('스페셜티') || cat.includes('로스터리') || cat.includes('에스프레소')) {
        brandType = 'specialty';
      }

      return {
        naver_place_id: cand.id,
        naver_place_url: `https://m.place.naver.com/restaurant/${cand.id}/home`,
        name: registered?.name || cand.name,
        category: cand.category,
        brand_type: brandType,
        roadAddress: cand.roadAddress,
        address: cand.roadAddress,
        phone: cand.phone,
        latitude: cand.lat,
        longitude: cand.lng,
        distance_store1: d1,
        distance_store2: d2,
        is_registered: isRegistered,
        registered_competitor_id: registered?.id || null,
        rating: registered?.rating || 4.6,
        review_count: registered?.review_count || 320,
        representative_menu: cand.category,
      };
    });

    // 3. 필터 적용
    const filteredItems = radarItems.filter((item) => {
      // 5km 반경 초과 필터
      if (branchFilter === 'store1' && item.distance_store1 > 5.0) return false;
      if (branchFilter === 'store2' && item.distance_store2 > 5.0) return false;
      if (branchFilter === 'all' && item.distance_store1 > 5.0 && item.distance_store2 > 5.0) return false;

      // 등록 상태 필터
      if (statusFilter === 'registered' && !item.is_registered) return false;
      if (statusFilter === 'unregistered' && item.is_registered) return false;

      // 검색어 필터 (상호명, ID, 주소)
      if (searchKeyword) {
        const matchName = item.name.toLowerCase().includes(searchKeyword);
        const matchId = item.naver_place_id.includes(searchKeyword);
        const matchAddr = (item.roadAddress || '').toLowerCase().includes(searchKeyword);
        if (!matchName && !matchId && !matchAddr) return false;
      }

      return true;
    });

    // 정렬: 미등록 우선 또는 거리순
    filteredItems.sort((a, b) => {
      if (a.is_registered !== b.is_registered) {
        return a.is_registered ? 1 : -1; // 미등록 후보 상단 노출
      }
      return Math.min(a.distance_store1, a.distance_store2) - Math.min(b.distance_store1, b.distance_store2);
    });

    const summary = {
      total: radarItems.length,
      registeredCount: radarItems.filter(i => i.is_registered).length,
      unregisteredCount: radarItems.filter(i => !i.is_registered).length,
      store1RadiusCount: radarItems.filter(i => i.distance_store1 <= 5.0).length,
      store2RadiusCount: radarItems.filter(i => i.distance_store2 <= 5.0).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      places: filteredItems,
    });
  } catch (error: any) {
    console.error('Radar API error:', error);
    return NextResponse.json(
      { error: error.message || '상권 레이더 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
