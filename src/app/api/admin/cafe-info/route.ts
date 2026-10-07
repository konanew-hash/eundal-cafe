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
    const {
      name,
      slogan,
      description,
      hero_image_url,
      logo_icon_url,
      app_icon_url,
      phone,
      address,
      business_hours,
      quote_notice,
      instagram_url,
      youtube_url,
      naver_url,
      google_url,
      business_number,
      owner_name,
      privacy_officer,
    } = body;

    const { data: updated, error } = await supabase
      .from('eundal_cafes')
      .update({
        name,
        slogan,
        description,
        hero_image_url,
        logo_icon_url,
        app_icon_url: app_icon_url !== undefined ? app_icon_url : undefined,
        phone,
        address,
        business_hours,
        quote_notice: quote_notice || '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.',
        instagram_url: instagram_url !== undefined ? instagram_url : null,
        youtube_url: youtube_url !== undefined ? youtube_url : null,
        naver_url: naver_url !== undefined ? naver_url : null,
        google_url: google_url !== undefined ? google_url : null,
        business_number: business_number !== undefined ? business_number : null,
        owner_name: owner_name !== undefined ? owner_name : null,
        privacy_officer: privacy_officer !== undefined ? privacy_officer : null,
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
