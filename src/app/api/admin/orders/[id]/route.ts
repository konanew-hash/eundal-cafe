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

  const validStatuses = ['pending', 'accepted', 'brewing', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: '유효하지 않은 주문 상태입니다.' }, { status: 400 });
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
