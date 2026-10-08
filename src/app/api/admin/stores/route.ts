import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  try {
    const { data: stores, error } = await supabase
      .from('eundal_stores')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ stores: stores || [] });
  } catch (err) {
    console.error('Failed to get stores:', err);
    return NextResponse.json({ error: '매장 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      branch_name,
      address,
      address_detail,
      postal_code,
      naver_place_url,
      phone,
      operating_hours,
      description,
      is_active = true,
      sort_order = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '매장명을 입력해주세요.' }, { status: 400 });
    }
    if (!address || !address.trim()) {
      return NextResponse.json({ error: '매장 도로명 주소를 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: created, error } = await supabase
      .from('eundal_stores')
      .insert({
        name: name.trim(),
        branch_name: branch_name ? branch_name.trim() : null,
        address: address.trim(),
        address_detail: address_detail ? address_detail.trim() : null,
        postal_code: postal_code ? postal_code.trim() : null,
        naver_place_url: naver_place_url ? naver_place_url.trim() : null,
        phone: phone ? phone.trim() : null,
        operating_hours: operating_hours ? operating_hours.trim() : '09:00 ~ 21:00',
        description: description ? description.trim() : null,
        is_active,
        sort_order: parseInt(String(sort_order), 10) || 0,
      })
      .select('*')
      .single();

    if (error || !created) throw error;

    return NextResponse.json({ success: true, store: created });
  } catch (err) {
    console.error('Failed to create store:', err);
    return NextResponse.json({ error: '매장 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
