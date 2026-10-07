import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { verifyPassword, createAdminToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password, rememberMe } = await req.json();

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

    // JWT 생성 (로그인 유지 여부에 따라 30일 vs 24시간)
    const token = await createAdminToken({
      id: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
    }, Boolean(rememberMe));

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

    // HttpOnly 쿠키 설정 (로그인 유지 시 30일, 기본 24시간)
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
