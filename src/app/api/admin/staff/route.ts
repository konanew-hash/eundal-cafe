import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hashPassword } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  try {
    const { data: staffList, error } = await supabase
      .from('eundal_staff')
      .select('id, username, name, role, phone, notify_sms, notify_push, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ staffList: staffList || [] });
  } catch (error) {
    console.error('Fetch staff error:', error);
    return NextResponse.json({ error: '스태프 목록 조회 실패' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  // 매니저는 다른 스태프 추가 불가, 메인관리자만 가능하도록 하거나 요구사항에 맞춰 지원
  const supabase = getSupabaseServer();
  try {
    const { username, password, name, role, phone, notify_sms, notify_push } = await req.json();

    if (!username || !password || !name || !phone) {
      return NextResponse.json({ error: '아이디, 비밀번호, 이름, 연락처는 필수 항목입니다.' }, { status: 400 });
    }

    // 아이디 중복 확인
    const { data: existing } = await supabase
      .from('eundal_staff')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: '이미 존재하는 아이디입니다.' }, { status: 400 });
    }

    const password_hash = await hashPassword(password);

    const { data: newStaff, error } = await supabase
      .from('eundal_staff')
      .insert({
        username: username.trim(),
        password_hash,
        name: name.trim(),
        role: role === 'super_admin' ? 'super_admin' : 'manager',
        phone: phone.trim(),
        notify_sms: notify_sms ?? true,
        notify_push: notify_push ?? true,
        is_active: true,
      })
      .select('id, username, name, role, phone, notify_sms, notify_push, is_active, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: '스태프 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  try {
    const { id, name, role, phone, notify_sms, notify_push, is_active, newPassword } = await req.json();

    if (!id) return NextResponse.json({ error: '스태프 ID가 필요합니다.' }, { status: 400 });

    const updatePayload: Record<string, unknown> = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (role !== undefined) updatePayload.role = role;
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (notify_sms !== undefined) updatePayload.notify_sms = notify_sms;
    if (notify_push !== undefined) updatePayload.notify_push = notify_push;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    if (newPassword && newPassword.trim()) {
      updatePayload.password_hash = await hashPassword(newPassword.trim());
    }

    const { data: updated, error } = await supabase
      .from('eundal_staff')
      .update(updatePayload)
      .eq('id', id)
      .select('id, username, name, role, phone, notify_sms, notify_push, is_active, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, staff: updated });
  } catch (error) {
    console.error('Update staff error:', error);
    return NextResponse.json({ error: '스태프 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: '스태프 ID가 필요합니다.' }, { status: 400 });

  const supabase = getSupabaseServer();
  try {
    // 삭제 대상 확인
    const { data: target } = await supabase.from('eundal_staff').select('*').eq('id', id).single();
    if (!target) return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 });

    // 본인 삭제 불가
    if (target.id === admin.id) {
      return NextResponse.json({ error: '현재 로그인 중인 본인 계정은 삭제할 수 없습니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('eundal_staff').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: '스태프가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete staff error:', error);
    return NextResponse.json({ error: '스태프 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
