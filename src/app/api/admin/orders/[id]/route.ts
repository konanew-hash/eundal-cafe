import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';
import { dispatchStaffNotifications } from '@/lib/notify';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ['pending', 'confirmed', 'accepted', 'brewing', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `유효하지 않은 주문 상태입니다: ${status}` }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  try {
    const { data: updatedOrder, error } = await supabase
      .from('eundal_orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, items:eundal_order_items(*)')
      .single();

    if (error || !updatedOrder) {
      console.error('Update order status error:', error);
      return NextResponse.json({ error: '주문 상태 변경에 실패했습니다.' }, { status: 500 });
    }

    // 알림 기록
    try {
      await dispatchStaffNotifications({
        order: updatedOrder,
        type: 'STATUS_CHANGE',
      });
    } catch (notifyErr) {
      console.error('[Notification error]', notifyErr);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 관리자 주문 품목 및 금액 수정 (요구사항: 관리자가 주문 내역 메뉴 일부 수정 가능)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const { items, delivery_fee, order_memo, customer_name, customer_phone, delivery_address } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '최소 1개 이상의 품목이 있어야 합니다.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  try {
    // 상품 합계 계산
    let itemsTotal = 0;
    const formattedItems = items.map((it: { menu_id?: string; menu_name: string; price: number; quantity: number; set_details?: unknown }) => {
      const qty = Math.max(1, parseInt(String(it.quantity), 10) || 1);
      const price = parseInt(String(it.price), 10) || 0;
      const subtotal = price * qty;
      itemsTotal += subtotal;
      return {
        order_id: id,
        menu_id: it.menu_id || null,
        menu_name: it.menu_name,
        price,
        quantity: qty,
        subtotal,
        set_details: it.set_details || null,
      };
    });

    const parsedDeliveryFee = parseInt(String(delivery_fee), 10) || 0;
    const totalAmount = itemsTotal + parsedDeliveryFee;

    // 1. 기존 eundal_order_items 삭제 후 새 항목 삽입
    await supabase.from('eundal_order_items').delete().eq('order_id', id);
    await supabase.from('eundal_order_items').insert(formattedItems);

    // 2. eundal_orders 업데이트
    const updatePayload: Record<string, unknown> = {
      items_total: itemsTotal,
      delivery_fee: parsedDeliveryFee,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    };
    if (order_memo !== undefined) updatePayload.order_memo = order_memo;
    if (customer_name) updatePayload.customer_name = customer_name;
    if (customer_phone) updatePayload.customer_phone = customer_phone;
    if (delivery_address) updatePayload.delivery_address = delivery_address;

    const { data: updatedOrder, error } = await supabase
      .from('eundal_orders')
      .update(updatePayload)
      .eq('id', id)
      .select('*, items:eundal_order_items(*)')
      .single();

    if (error || !updatedOrder) throw error;

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Failed to update order items:', error);
    return NextResponse.json({ error: '주문 내역 수정에 실패했습니다.' }, { status: 500 });
  }
}

// 주문 삭제 (테스트 내역 정리 및 잘못된 접수 주문 삭제)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();

  try {
    // 1. 주문 상세 품목 삭제
    await supabase.from('eundal_order_items').delete().eq('order_id', id);

    // 2. 주문 본체 삭제
    const { error } = await supabase.from('eundal_orders').delete().eq('id', id);

    if (error) {
      console.error('Delete order error:', error);
      return NextResponse.json({ error: '주문 삭제에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '주문 내역이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('Failed to delete order:', error);
    return NextResponse.json({ error: '서버 오류로 주문 삭제에 실패했습니다.' }, { status: 500 });
  }
}

