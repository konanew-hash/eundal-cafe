import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: '포트폴리오 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      title,
      client_name,
      event_date,
      event_time,
      event_scale,
      item_summary,
      content,
      photos,
      video_urls,
      tags,
      order_id,
      is_featured,
      is_active,
      sort_order,
    } = body;

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (client_name !== undefined) updateData.client_name = client_name.trim();
    if (event_date !== undefined) updateData.event_date = event_date;
    if (event_time !== undefined) updateData.event_time = event_time ? event_time.trim() : null;
    if (event_scale !== undefined) updateData.event_scale = event_scale.trim();
    if (item_summary !== undefined) updateData.item_summary = item_summary ? item_summary.trim() : null;
    if (content !== undefined) updateData.content = content ? content.trim() : null;
    if (photos !== undefined) updateData.photos = Array.isArray(photos) ? photos : [];
    if (video_urls !== undefined) updateData.video_urls = Array.isArray(video_urls) ? video_urls : [];
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (order_id !== undefined) updateData.order_id = order_id || null;
    if (is_featured !== undefined) updateData.is_featured = Boolean(is_featured);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (sort_order !== undefined) updateData.sort_order = Number(sort_order);

    const supabase = getSupabaseServer();
    const { data: updated, error } = await supabase
      .from('eundal_portfolios')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ portfolio: updated, success: true });
  } catch (err: any) {
    console.error('Failed to update portfolio:', err);
    return NextResponse.json({ error: '포트폴리오 수정에 실패했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: '포트폴리오 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('eundal_portfolios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete portfolio:', err);
    return NextResponse.json({ error: '포트폴리오 삭제에 실패했습니다.' }, { status: 500 });
  }
}
