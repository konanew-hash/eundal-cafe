import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  try {
    const { data: policy, error } = await supabase
      .from('eundal_delivery_policies')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return NextResponse.json({ policy });
  } catch (error) {
    console.error('Fetch delivery policy error:', error);
    return NextResponse.json({ error: '배달비 정책을 가져오지 못했습니다.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  try {
    const body = await req.json();
    const { base_fee, free_threshold, min_order_amount, distance_rules } = body;

    const { data: updated, error } = await supabase
      .from('eundal_delivery_policies')
      .update({
        base_fee: parseInt(base_fee, 10),
        free_threshold: parseInt(free_threshold, 10),
        min_order_amount: parseInt(min_order_amount, 10),
        distance_rules,
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 단일 정책 row 대상
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, policy: updated });
  } catch (error) {
    console.error('Update delivery policy error:', error);
    return NextResponse.json({ error: '배달비 정책 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
