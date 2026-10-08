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
    const { data: presetSets, error } = await supabase
      .from('eundal_preset_sets')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ presetSets: presetSets || [] });
  } catch (err) {
    console.error('Failed to get preset sets:', err);
    return NextResponse.json({ error: '추천 세트 목록을 불러오지 못했습니다.' }, { status: 500 });
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
      name,
      description,
      badge_text,
      image_url,
      components,
      package_box_id = 'none',
      package_box_name = '기본 포장',
      package_box_price = 0,
      packaging_options = [],
      price = 0,
      is_active = true,
      sort_order = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '추천 세트명을 입력해주세요.' }, { status: 400 });
    }
    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json({ error: '구성 품목을 최소 1개 이상 추가해주세요.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: created, error } = await supabase
      .from('eundal_preset_sets')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : null,
        badge_text: badge_text ? badge_text.trim() : '인기 꿀조합',
        image_url: image_url ? image_url.trim() : null,
        components,
        package_box_id,
        package_box_name,
        package_box_price: parseInt(String(package_box_price), 10) || 0,
        packaging_options,
        price: parseInt(String(price), 10) || 0,
        is_active,
        sort_order: parseInt(String(sort_order), 10) || 0,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error || !created) throw error;
    return NextResponse.json({ success: true, presetSet: created });
  } catch (err) {
    console.error('Failed to create preset set:', err);
    return NextResponse.json({ error: '추천 세트 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '세트 ID가 누락되었습니다.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: updated, error } = await supabase
      .from('eundal_preset_sets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) throw error;
    return NextResponse.json({ success: true, presetSet: updated });
  } catch (err) {
    console.error('Failed to update preset set:', err);
    return NextResponse.json({ error: '추천 세트 수정 중 오류가 발생했습니다.' }, { status: 500 });
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
    return NextResponse.json({ error: '세트 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from('eundal_preset_sets').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete preset set:', err);
    return NextResponse.json({ error: '추천 세트 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
