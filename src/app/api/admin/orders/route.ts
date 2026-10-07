import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');

  try {
    // 요구사항: 배달 완료일 이후 14일이 지난 '거래완료' 내역은 DB에서 자동 삭제 조치
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const dateLimitStr = fourteenDaysAgo.toISOString().split('T')[0];

      await supabase
        .from('eundal_orders')
        .delete()
        .eq('status', 'completed')
        .lte('delivery_date', dateLimitStr);
    } catch (cleanErr) {
      console.warn('Auto cleanup 14 days completed orders failed:', cleanErr);
    }

    let query = supabase
      .from('eundal_orders')
      .select('*, items:eundal_order_items(*)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      if (status === 'confirmed') {
        query = query.in('status', ['confirmed', 'accepted', 'brewing', 'delivering']);
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: orders, error } = await query;
    if (error) {
      console.error('Fetch orders error:', error);
      return NextResponse.json({ error: '주문 목록을 가져오지 못했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Admin orders API error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
