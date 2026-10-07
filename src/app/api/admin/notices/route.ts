import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// 전달사항 목록 조회
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  try {
    const { data: notices, error } = await supabase
      .from('eundal_manager_notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      notices: notices || [],
      currentAdmin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Fetch notices error:', error);
    return NextResponse.json({ error: '전달사항 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

// 신규 전달사항 작성
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();

  try {
    const body = await req.json();
    const { store_name, store_id, content, photo_urls, is_important } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '전달 내역을 입력해주세요.' }, { status: 400 });
    }

    if (!store_name || !store_name.trim()) {
      return NextResponse.json({ error: '점포명을 선택해주세요.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const authorId = admin.username;
    const authorName = admin.name || admin.username;

    // 작성자는 자동으로 읽은 사람 플래그에 등록
    const initialReadBy = [
      {
        admin_id: authorId,
        name: authorName,
        read_at: now,
      },
    ];

    const { data: inserted, error } = await supabase
      .from('eundal_manager_notices')
      .insert({
        created_at: now,
        author_id: authorId,
        author_name: authorName,
        store_id: store_id || null,
        store_name: store_name.trim(),
        content: content.trim(),
        photo_urls: Array.isArray(photo_urls) ? photo_urls : [],
        read_by: initialReadBy,
        is_important: !!is_important,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, notice: inserted });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ error: '전달사항 등록에 실패했습니다.' }, { status: 500 });
  }
}
