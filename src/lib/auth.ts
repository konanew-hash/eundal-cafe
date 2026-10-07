import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'eundal-cafe-secret-session-token-key-2026-very-secure'
);

export const COOKIE_NAME = 'eundal_admin_token';

export interface AdminPayload {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'manager';
  phone: string;
}

// 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 비밀번호 비교
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT 생성 (로그인 유지 옵션 지원)
export async function createAdminToken(payload: AdminPayload, rememberMe = false): Promise<string> {
  const exp = rememberMe ? '30d' : '24h';
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(SECRET_KEY);
}

// JWT 검증
export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

// 현재 요청의 관리자 세션 가져오기
export async function getCurrentAdmin(): Promise<AdminPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
