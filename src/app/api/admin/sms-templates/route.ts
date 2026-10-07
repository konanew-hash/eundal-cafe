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
    const { data, error } = await supabase
      .from('eundal_sms_templates')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ templates: data || [] });
  } catch (err) {
    console.error('Fetch sms templates error:', err);
    return NextResponse.json({ error: '문자 템플릿을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  try {
    const body = await req.json();
    const { title, content, sort_order } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '템플릿 제목과 본문은 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('eundal_sms_templates')
      .insert({
        title,
        content,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, template: data });
  } catch (err) {
    console.error('Create sms template error:', err);
    return NextResponse.json({ error: '템플릿 생성 중 오류가 발생했습니다.' }, { status: 500 });
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
    const { id, title, content, sort_order } = body;

    if (!id || !title || !content) {
      return NextResponse.json({ error: '수정할 템플릿 정보가 올바르지 않습니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('eundal_sms_templates')
      .update({
        title,
        content,
        sort_order: sort_order || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, template: data });
  } catch (err) {
    console.error('Update sms template error:', err);
    return NextResponse.json({ error: '템플릿 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: '삭제할 템플릿 ID가 필요합니다.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  try {
    const { error } = await supabase
      .from('eundal_sms_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete sms template error:', err);
    return NextResponse.json({ error: '템플릿 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
