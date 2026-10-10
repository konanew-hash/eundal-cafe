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
      hero_images,
      logo_images,
      manager_kakao_id,
      manager_phone,
      telegram_bot_token,
      telegram_chat_id,
      sms_service_type,
      sms_api_key,
      sms_user_id,
      sms_sender_phone,
      sms_webhook_url,
      privacy_policy,
      // 1호점 & 2호점 구분 필드
      store1_name,
      store1_address,
      store1_business_hours,
      store1_phone,
      store2_name,
      store2_address,
      store2_business_hours,
      store2_phone,
    } = body;

    const finalHeroImages = Array.isArray(hero_images) ? hero_images : (hero_image_url ? [hero_image_url] : []);
    const finalLogoImages = Array.isArray(logo_images) ? logo_images : (logo_icon_url ? [logo_icon_url] : []);

    const { data: updated, error } = await supabase
      .from('eundal_cafes')
      .update({
        name,
        slogan,
        description,
        hero_image_url: finalHeroImages[0] || hero_image_url,
        logo_icon_url: finalLogoImages[0] || logo_icon_url,
        hero_images: finalHeroImages,
        logo_images: finalLogoImages,
        app_icon_url: app_icon_url !== undefined ? app_icon_url : undefined,
        phone,
        address,
        business_hours,
        quote_notice: quote_notice || '견적 내역을 카페에서 확인 후 문자 혹은 유선 연락드려, 견적에 대한 주문 확정을 확인합니다.',
        privacy_policy: privacy_policy !== undefined ? privacy_policy : null,
        instagram_url: instagram_url !== undefined ? instagram_url : null,
        youtube_url: youtube_url !== undefined ? youtube_url : null,
        naver_url: naver_url !== undefined ? naver_url : null,
        google_url: google_url !== undefined ? google_url : null,
        business_number: business_number !== undefined ? business_number : null,
        owner_name: owner_name !== undefined ? owner_name : null,
        privacy_officer: privacy_officer !== undefined ? privacy_officer : null,
        manager_kakao_id: manager_kakao_id !== undefined ? manager_kakao_id : null,
        manager_phone: manager_phone !== undefined ? manager_phone : null,
        telegram_bot_token: telegram_bot_token !== undefined ? telegram_bot_token : null,
        telegram_chat_id: telegram_chat_id !== undefined ? telegram_chat_id : null,
        sms_service_type: sms_service_type || 'webhook',
        sms_api_key: sms_api_key !== undefined ? sms_api_key : null,
        sms_user_id: sms_user_id !== undefined ? sms_user_id : null,
        sms_sender_phone: sms_sender_phone !== undefined ? sms_sender_phone : null,
        sms_webhook_url: sms_webhook_url !== undefined ? sms_webhook_url : null,
        store1_name: store1_name !== undefined ? store1_name : '은달 1호점(조원)',
        store1_address: store1_address !== undefined ? store1_address : address,
        store1_business_hours: store1_business_hours !== undefined ? store1_business_hours : business_hours,
        store1_phone: store1_phone !== undefined ? store1_phone : phone,
        store2_name: store2_name !== undefined ? store2_name : '은달 2호점(파장)',
        store2_address: store2_address !== undefined ? store2_address : '경기 수원시 장안구 경수대로1043번길 3 은달 파장2호점',
        store2_business_hours: store2_business_hours !== undefined ? store2_business_hours : business_hours,
        store2_phone: store2_phone !== undefined ? store2_phone : '031-255-0816',
        // 납품 포트폴리오 홍보 문구
        portfolio_title: body.portfolio_title !== undefined ? body.portfolio_title : null,
        portfolio_subtitle: body.portfolio_subtitle !== undefined ? body.portfolio_subtitle : null,
        // 견적서 공급자 서식 정보
        business_type: body.business_type !== undefined ? body.business_type : '음식점업',
        business_item: body.business_item !== undefined ? body.business_item : '커피, 디저트, 샌드위치',
        seal_image_url: body.seal_image_url !== undefined ? body.seal_image_url : null,
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
