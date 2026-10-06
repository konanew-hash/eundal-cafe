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
    const { data: cafe, error } = await supabase
      .from('eundal_cafes')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;
    return NextResponse.json({ cafe });
  } catch (error) {
    console.error('Fetch cafe info error:', error);
    return NextResponse.json({ error: '카페 정보를 가져오지 못했습니다.' }, { status: 500 });
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
    const { name, slogan, description, hero_image_url, logo_icon_url, phone, address, business_hours } = body;

    const { data: updated, error } = await supabase
      .from('eundal_cafes')
      .update({
        name,
        slogan,
        description,
        hero_image_url,
        logo_icon_url,
        phone,
        address,
        business_hours,
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, cafe: updated });
  } catch (error) {
    console.error('Update cafe info error:', error);
    return NextResponse.json({ error: '카페 정보 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
