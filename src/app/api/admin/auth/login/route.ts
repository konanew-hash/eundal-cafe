import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyPassword, createAdminToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: '아이디와 비밀번호를 모두 입력해주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: staff, error } = await supabase
      .from('eundal_staff')
      .select('*')
      .eq('username', username.trim())
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, staff.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    // JWT 생성
    const token = await createAdminToken({
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
    });

    const response = NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        username: staff.username,
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
      },
    });

    // HttpOnly 쿠키 설정
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24시간
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
