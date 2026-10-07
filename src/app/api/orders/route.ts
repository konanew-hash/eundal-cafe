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
      order_type = 'delivery', // 'delivery' | 'pickup'
      pickup_store_id,
      pickup_store_name,
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
      gps_lat,
      gps_lng,
      gps_address,
      packaging_fee,
      packaging_box,
      packaging_options,
    } = body;

    const parsedPackagingFee = typeof packaging_fee === 'number' ? Math.max(0, packaging_fee) : 0;
    const isPickup = order_type === 'pickup';

    // 1. 필수 검증
    if (!customer_name || !customer_name.trim()) {
      return NextResponse.json({ error: '주문자 성함을 입력해주세요.' }, { status: 400 });
    }
    if (!customer_phone || !customer_phone.trim()) {
      return NextResponse.json({ error: '주문자 연락처를 입력해주세요.' }, { status: 400 });
    }
    if (!delivery_date) {
      return NextResponse.json({ error: '수령 희망 날짜를 선택해주세요.' }, { status: 400 });
    }

    // 2. 24시간제 & 30분 단위 검증 (예: "12:00" 또는 "14:30")
    if (!delivery_time || !/^([01]\d|2[0-3]):(00|30)$/.test(delivery_time)) {
      return NextResponse.json(
        { error: '시간은 30분 단위(00분 또는 30분)로 선택해주세요. (예: 12:00, 14:30)' },
        { status: 400 }
      );
    }

    // 3. 배달 장소 / 픽업 매장 검증
    let finalAddress = (delivery_address || '').trim();
    if (isPickup) {
      if (!pickup_store_name && !pickup_store_id) {
        return NextResponse.json({ error: '픽업하실 매장을 선택해주세요.' }, { status: 400 });
      }
      finalAddress = finalAddress || `[매장 픽업] ${pickup_store_name || '은달 매장'}`;
    } else {
      if (!finalAddress) {
        return NextResponse.json({ error: '배달 장소(주소)를 입력해주세요.' }, { status: 400 });
      }
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
    // 세트메뉴에 포함된 단품들의 id 및 일반 단품의 id 모두 수집
    const regularMenuIds = items
      .filter((i: any) => !i.set_details && i.menu_id)
      .map((i: any) => i.menu_id);

    const setComponentMenuIds = items
      .filter((i: any) => i.set_details && Array.isArray(i.set_details.components))
      .flatMap((i: any) => i.set_details.components.map((c: any) => c.menu_id));

    const allNeededMenuIds = Array.from(new Set([...regularMenuIds, ...setComponentMenuIds]));

    const { data: dbMenus, error: menuErr } = await supabase
      .from('eundal_menus')
      .select('id, name, price, is_sold_out, is_active')
      .in('id', allNeededMenuIds.length > 0 ? allNeededMenuIds : ['00000000-0000-0000-0000-000000000000']);

    if (menuErr) {
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
      menu_id: string | null;
      menu_name: string;
      price: number;
      quantity: number;
      subtotal: number;
      set_details: any | null;
    }> = [];

    const menuMap = new Map((dbMenus || []).map((m) => [m.id, m]));

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (item.set_details) {
        // [세트메뉴 처리]
        const setDetails = item.set_details;
        // 세트 내 부속 품목들의 품절 검사
        if (Array.isArray(setDetails.components)) {
          for (const comp of setDetails.components) {
            const found = menuMap.get(comp.menu_id);
            if (found && found.is_sold_out) {
              return NextResponse.json(
                { error: `세트메뉴에 포함된 [${found.name}] 메뉴가 현재 품절입니다.` },
                { status: 400 }
              );
            }
          }
        }

        const unitPrice = parseInt(setDetails.unit_price, 10) || parseInt(item.price, 10) || 0;
        const subtotal = unitPrice * qty;
        itemsTotal += subtotal;

        orderItemsToInsert.push({
          menu_id: null,
          menu_name: `[세트] ${setDetails.set_name || '은달 맞춤 세트메뉴'}`,
          price: unitPrice,
          quantity: qty,
          subtotal,
          set_details: setDetails,
        });
      } else {
        // [일반 단품 메뉴 처리]
        const found = menuMap.get(item.menu_id);
        if (!found || !found.is_active) {
          return NextResponse.json({ error: `주문 불가능한 메뉴가 포함되어 있습니다.` }, { status: 400 });
        }
        if (found.is_sold_out) {
          return NextResponse.json({ error: `[${found.name}] 메뉴는 현재 품절입니다.` }, { status: 400 });
        }
        const subtotal = found.price * qty;
        itemsTotal += subtotal;

        orderItemsToInsert.push({
          menu_id: found.id,
          menu_name: found.name,
          price: found.price,
          quantity: qty,
          subtotal,
          set_details: null,
        });
      }
    }

    // 배달비 정책 연동 계산 (픽업은 배달비 0원)
    let deliveryFee = 0;
    const distanceRules: DistanceRule[] = policy.distance_rules || [];
    const matchedRule = distanceRules.find((r) => r.label === selected_distance_label) || distanceRules[0];

    if (!isPickup) {
      // 배달 주문인 경우에만 최소 주문 금액 검사
      if (itemsTotal < policy.min_order_amount) {
        return NextResponse.json(
          { error: `배달 최소 주문 금액은 ${policy.min_order_amount.toLocaleString()}원입니다.` },
          { status: 400 }
        );
      }

      deliveryFee = policy.base_fee;
      if (itemsTotal >= policy.free_threshold) {
        deliveryFee = 0;
      }
      const extraFee = matchedRule ? matchedRule.extra_fee : 0;
      deliveryFee += extraFee;
    }

    const totalAmount = itemsTotal + deliveryFee + parsedPackagingFee;

    // 고유 주문번호 생성 (EUN-YYYYMMDD-랜덤4자리)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `EUN-${dateStr}-${randomSuffix}`;

    // 클라이언트 IP 추출
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : realIp || '';
    const clientIp = rawIp.replace(/^::ffff:/, '');

    // 위치 정보: GPS 우선 수집, 없을 경우 IP Geolocation fallback
    let clientLocation = '위치 확인 불가';
    if (gps_lat && gps_lng) {
      const latNum = parseFloat(String(gps_lat));
      const lngNum = parseFloat(String(gps_lng));
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        clientLocation = gps_address
          ? `GPS: ${gps_address}`
          : `GPS(${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`;
      }
    } else {
      // GPS 미허용/미전송 시 IP 기반 보조 위치 조회
      clientLocation = await resolveDetailedKoreanLocation({
        clientIp,
        vercelCity: req.headers.get('x-vercel-ip-city') || '',
        vercelRegion: req.headers.get('x-vercel-ip-country-region') || '',
        vercelCountry: req.headers.get('x-vercel-ip-country') || '',
      });
    }

    // 7. eundal_orders INSERT
    const { data: createdOrder, error: orderInsertErr } = await supabase
      .from('eundal_orders')
      .insert({
        order_number: orderNumber,
        order_type,
        pickup_store_id: isPickup ? pickup_store_id || null : null,
        pickup_store_name: isPickup ? pickup_store_name || null : null,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        delivery_date,
        delivery_time,
        delivery_address: finalAddress,
        delivery_address_detail: (delivery_address_detail || '').trim(),
        selected_distance_label: isPickup ? '매장 픽업' : (matchedRule ? matchedRule.label : '기본'),
        order_memo: (order_memo || '').trim(),
        items_total: itemsTotal,
        delivery_fee: deliveryFee,
        packaging_fee: parsedPackagingFee,
        packaging_box: packaging_box || null,
        packaging_options: Array.isArray(packaging_options) ? packaging_options : [],
        total_amount: totalAmount,
        privacy_agreed: true,
        privacy_agreed_at: new Date().toISOString(),
        status: 'pending',
        client_ip: clientIp || '확인불가',
        client_location: clientLocation,
        gps_lat: gps_lat ? parseFloat(String(gps_lat)) : null,
        gps_lng: gps_lng ? parseFloat(String(gps_lng)) : null,
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
