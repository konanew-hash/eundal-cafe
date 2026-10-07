import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { dispatchStaffNotifications } from '@/lib/notify';

// 전화번호 포맷 정규화 (01012345678 -> 010-1234-5678)
function formatPhone(num: string): string {
  const clean = num.replace(/[^0-9]/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    if (clean.startsWith('02')) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return clean;
}

// 1. 주문번호 또는 전화번호로 주문/견적 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const rawQuery = decodeURIComponent(orderNumber).trim();
  const supabase = getSupabaseServer();

  try {
    const digitsOnly = rawQuery.replace(/[^0-9]/g, '');
    const isPhoneNumber = digitsOnly.length >= 8 && digitsOnly.length <= 12;

    let orders: unknown[] = [];

    if (isPhoneNumber) {
      // 전화번호로 검색 (하이픈 포맷 및 원본 번호 매칭)
      const formatted = formatPhone(digitsOnly);
      const { data, error } = await supabase
        .from('eundal_orders')
        .select('*, items:eundal_order_items(*)')
        .or(`customer_phone.eq.${digitsOnly},customer_phone.eq.${formatted},customer_phone.eq.${rawQuery}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      orders = data || [];
    } else {
      // 주문번호로 검색
      const { data, error } = await supabase
        .from('eundal_orders')
        .select('*, items:eundal_order_items(*)')
        .eq('order_number', rawQuery)
        .order('created_at', { ascending: false });

      if (error) throw error;
      orders = data || [];
    }

    if (orders.length === 0) {
      return NextResponse.json(
        { error: '해당 주문번호 또는 연락처로 접수된 견적 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: orders[0], // 가장 최근 주문
      orders,           // 검색된 전체 주문 목록 (복수 건 지원)
    });
  } catch (error) {
    console.error('Failed to get order:', error);
    return NextResponse.json({ error: '주문 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 2. 고객 확인 화면에서 직접 견적 취소 (요구사항: 확인 창에서 취소가 가능하도록 프로세스 변경)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const rawQuery = decodeURIComponent(orderNumber).trim();
  const supabase = getSupabaseServer();

  try {
    // 주문번호로 주문 단건 조회
    const { data: order, error: findErr } = await supabase
      .from('eundal_orders')
      .select('*, items:eundal_order_items(*)')
      .eq('order_number', rawQuery)
      .single();

    if (findErr || !order) {
      return NextResponse.json({ error: '해당 주문번호의 견적을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: '이미 취소 처리된 견적입니다.' }, { status: 400 });
    }
    if (order.status === 'completed') {
      return NextResponse.json(
        { error: '거래완료된 주문은 홈페이지에서 취소할 수 없습니다. 카페로 유선 문의 바랍니다.' },
        { status: 400 }
      );
    }

    // 상태를 'cancelled'로 변경
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('eundal_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('*, items:eundal_order_items(*)')
      .single();

    if (updateErr || !updatedOrder) {
      throw updateErr;
    }

    // 관리자 및 매니저 알림 발송
    try {
      await dispatchStaffNotifications({
        order: updatedOrder,
        type: 'STATUS_CHANGE',
      });
    } catch (notifyErr) {
      console.error('[Notification error]', notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: '견적 요청이 성공적으로 취소되었습니다.',
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Failed to cancel order:', err);
    return NextResponse.json({ error: '견적 취소 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
