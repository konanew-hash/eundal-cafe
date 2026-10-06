import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '파일이 전송되지 않았습니다.' }, { status: 400 });
    }

    // 파일 확장자 및 고유 파일명 생성
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseServer();

    // Supabase Storage 버킷에 업로드
    const { data, error } = await supabase.storage
      .from('eundal-assets')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload failed, fallback to base64:', error);
      // 만약 스토리지 정책 이슈 등이 있으면 Base64 Data URL로 안전하게 반환
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ url: base64, success: true });
    }

    // 업로드된 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('eundal-assets')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrlData.publicUrl, success: true });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
