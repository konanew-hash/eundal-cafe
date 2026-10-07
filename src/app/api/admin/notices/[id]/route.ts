import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

// 전달사항 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();

  try {
    const { error } = await supabase
      .from('eundal_manager_notices')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: '전달사항이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete notice error:', error);
    return NextResponse.json({ error: '전달사항 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 읽음 플래그 처리 (현재 로그인한 관리자를 read_by 배열에 추가)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseServer();

  try {
    // 1. 기존 전달사항 조회
    const { data: notice, error: fetchErr } = await supabase
      .from('eundal_manager_notices')
      .select('read_by')
      .eq('id', id)
      .single();

    if (fetchErr || !notice) {
      return NextResponse.json({ error: '전달사항을 찾을 수 없습니다.' }, { status: 404 });
    }

    const currentReadBy: Array<{ admin_id: string; name?: string; read_at: string }> =
      Array.isArray(notice.read_by) ? notice.read_by : [];

    const alreadyRead = currentReadBy.some((r) => r.admin_id === admin.username);

    if (!alreadyRead) {
      const updatedReadBy = [
        ...currentReadBy,
        {
          admin_id: admin.username,
          name: admin.name || admin.username,
          read_at: new Date().toISOString(),
        },
      ];

      const { data: updated, error: updateErr } = await supabase
        .from('eundal_manager_notices')
        .update({ read_by: updatedReadBy })
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true, notice: updated });
    }

    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error('Update notice read_by error:', error);
    return NextResponse.json({ error: '읽음 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
