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
    const { data: portfolios, error } = await supabase
      .from('eundal_portfolios')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ portfolios: portfolios || [] });
  } catch (err: any) {
    console.error('Failed to get portfolios:', err);
    return NextResponse.json({ error: '포트폴리오 목록을 불러오지 못했습니다.' }, { status: 500 });
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
      title,
      client_name,
      event_date,
      event_time = '',
      event_scale,
      item_summary = '',
      content = '',
      photos = [],
      video_urls = [],
      tags = [],
      order_id = null,
      is_featured = false,
      is_active = true,
      sort_order = 0,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '행사 납품 제목을 입력해주세요.' }, { status: 400 });
    }
    if (!client_name || !client_name.trim()) {
      return NextResponse.json({ error: '주문 기관 혹은 단체명을 입력해주세요.' }, { status: 400 });
    }
    if (!event_date) {
      return NextResponse.json({ error: '행사일을 입력해주세요.' }, { status: 400 });
    }
    if (!event_scale || !event_scale.trim()) {
      return NextResponse.json({ error: '행사 규모를 입력해주세요. (예: 120인분)' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: created, error } = await supabase
      .from('eundal_portfolios')
      .insert({
        title: title.trim(),
        client_name: client_name.trim(),
        event_date,
        event_time: event_time ? event_time.trim() : null,
        event_scale: event_scale.trim(),
        item_summary: item_summary ? item_summary.trim() : null,
        content: content ? content.trim() : null,
        photos: Array.isArray(photos) ? photos : [],
        video_urls: Array.isArray(video_urls) ? video_urls : [],
        tags: Array.isArray(tags) ? tags : [],
        order_id: order_id || null,
        is_featured: Boolean(is_featured),
        is_active: Boolean(is_active),
        sort_order: Number(sort_order) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ portfolio: created, success: true });
  } catch (err: any) {
    console.error('Failed to create portfolio:', err);
    return NextResponse.json({ error: '포트폴리오 등록에 실패했습니다.' }, { status: 500 });
  }
}
