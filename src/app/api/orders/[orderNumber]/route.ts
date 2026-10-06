import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const supabase = getSupabaseServer();

  try {
    const { data: order, error } = await supabase
      .from('eundal_orders')
      .select('*, items:eundal_order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: '해당 주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Failed to get order:', error);
    return NextResponse.json({ error: '주문 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
