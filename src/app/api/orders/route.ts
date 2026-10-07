import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { dispatchStaffNotifications } from '@/lib/notify';
import { DistanceRule } from '@/lib/types';
import { resolveDetailedKoreanLocation } from '@/lib/location';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer();

  try {
    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      delivery_date,
      delivery_time, // 예: "12:00", "14:30"
      delivery_address,
      delivery_address_detail,
      selected_distance_label,
      order_memo,
      items, // [{ menu_id, quantity }]
      privacy_agreed,
    } = body;

    // 1. 필수 검증
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: '주문자 성함을 입력해주세요.' }, { status: 400 });
    }
    if (!customer_phone || !customer_phone.trim()) {
      return NextResponse.json({ error: '주문자 연락처를 입력해주세요.' }, { status: 400 });
    }
    if (!delivery_date) {
      return NextResponse.json({ error: '배달 희망 날짜를 선택해주세요.' }, { status: 400 });
    }

    // 2. 24시간제 & 30분 단위 검증 (예: "12:00" 또는 "14:30")
    if (!delivery_time || !/^([01]\d|2[0-3]):(00|30)$/.test(delivery_time)) {
      return NextResponse.json(
        { error: '배달 시간은 24시간제 기준이며, 분은 00분 또는 30분이어야 합니다. (예: 12:00, 14:30)' },
        { status: 400 }
      );
    }

    // 3. 배달 장소 검증
    if (!delivery_address || !delivery_address.trim()) {
      return NextResponse.json({ error: '배달 장소(주소)를 입력해주세요.' }, { status: 400 });
    }

    // 4. 개인정보보호법 동의 검증
    if (!privacy_agreed) {
      return NextResponse.json({ error: '개인정보 수집 및 이용에 동의하셔야 주문이 가능합니다.' }, { status: 400 });
    }

    // 5. 주문 품목 검증
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: '주문할 메뉴를 1개 이상 담아주세요.' }, { status: 400 });
    }

    // 6. DB에서 메뉴 목록과 배달비 정책 로드하여 안전하게 금액 계산
    const menuIds = items.map((i: { menu_id: string }) => i.menu_id);
    const { data: dbMenus, error: menuErr } = await supabase
      .from('eundal_menus')
      .select('id, name, price, is_sold_out, is_active')
      .in('id', menuIds);

    if (menuErr || !dbMenus) {
      return NextResponse.json({ error: '메뉴 정보를 조회할 수 없습니다.' }, { status: 500 });
    }

    const { data: policy, error: policyErr } = await supabase
      .from('eundal_delivery_policies')
      .select('*')
      .limit(1)
      .single();

    if (policyErr || !policy) {
      return NextResponse.json({ error: '배달비 정책을 조회할 수 없습니다.' }, { status: 500 });
    }

    // 품절 검사 및 상품 소계 계산
    let itemsTotal = 0;
    const orderItemsToInsert: Array<{
      menu_id: string;
      menu_name: string;
      price: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const found = dbMenus.find((m) => m.id === item.menu_id);
      if (!found || !found.is_active) {
        return NextResponse.json({ error: `주문 불가능한 메뉴가 포함되어 있습니다.` }, { status: 400 });
      }
      if (found.is_sold_out) {
        return NextResponse.json({ error: `[${found.name}] 메뉴는 현재 품절입니다.` }, { status: 400 });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const subtotal = found.price * qty;
      itemsTotal += subtotal;

      orderItemsToInsert.push({
        menu_id: found.id,
        menu_name: found.name,
        price: found.price,
        quantity: qty,
        subtotal,
      });
    }

    // 최소 주문 금액 검사
    if (itemsTotal < policy.min_order_amount) {
      return NextResponse.json(
        { error: `최소 주문 금액은 ${policy.min_order_amount.toLocaleString()}원입니다.` },
        { status: 400 }
      );
    }

    // 배달비 정책 연동 계산
    let deliveryFee = policy.base_fee;
    // 무료 배달 기준 충족 시 기본 배달비 0원
    if (itemsTotal >= policy.free_threshold) {
      deliveryFee = 0;
    }

    // 거리 구간별 할증 계산
    const distanceRules: DistanceRule[] = policy.distance_rules || [];
    const matchedRule = distanceRules.find((r) => r.label === selected_distance_label) || distanceRules[0];
    const extraFee = matchedRule ? matchedRule.extra_fee : 0;
    deliveryFee += extraFee;

    const totalAmount = itemsTotal + deliveryFee;

    // 고유 주문번호 생성 (EUN-YYYYMMDD-랜덤4자리)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `EUN-${dateStr}-${randomSuffix}`;

    // 클라이언트 IP 추출 및 상세 한글 접속 위치 조회
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : realIp || '';
    const clientIp = rawIp.replace(/^::ffff:/, '');

    const clientLocation = await resolveDetailedKoreanLocation({
      clientIp,
      vercelCity: req.headers.get('x-vercel-ip-city') || '',
      vercelRegion: req.headers.get('x-vercel-ip-country-region') || '',
      vercelCountry: req.headers.get('x-vercel-ip-country') || '',
    });

    // 7. eundal_orders INSERT
    const { data: createdOrder, error: orderInsertErr } = await supabase
      .from('eundal_orders')
      .insert({
        order_number: orderNumber,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        delivery_date,
        delivery_time,
        delivery_address: delivery_address.trim(),
        delivery_address_detail: (delivery_address_detail || '').trim(),
        selected_distance_label: matchedRule ? matchedRule.label : '기본',
        order_memo: (order_memo || '').trim(),
        items_total: itemsTotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        privacy_agreed: true,
        privacy_agreed_at: new Date().toISOString(),
        status: 'pending',
        client_ip: clientIp || '확인불가',
        client_location: clientLocation,
      })
      .select('*')
      .single();

    if (orderInsertErr || !createdOrder) {
      console.error('Order insert error:', orderInsertErr);
      return NextResponse.json({ error: '주문 접수 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 8. eundal_order_items INSERT
    const itemsData = orderItemsToInsert.map((it) => ({
      ...it,
      order_id: createdOrder.id,
    }));
    await supabase.from('eundal_order_items').insert(itemsData);

    // 9. 관리자 및 매니저 알림 디스패치
    try {
      await dispatchStaffNotifications({
        order: {
          ...createdOrder,
          items: itemsData,
        },
        type: 'NEW_ORDER',
      });
    } catch (err) {
      console.error('Notification dispatch failed:', err);
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
      items: itemsData,
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
