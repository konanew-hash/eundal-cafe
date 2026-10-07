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
    const [catRes, menuRes] = await Promise.all([
      supabase.from('eundal_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('eundal_menus').select('*').order('sort_order', { ascending: true }),
    ]);

    return NextResponse.json({
      categories: catRes.data || [],
      menus: menuRes.data || [],
    });
  } catch (error) {
    console.error('Admin menu get error:', error);
    return NextResponse.json({ error: '메뉴 데이터 조회 실패' }, { status: 500 });
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
    const { action } = body;

    if (action === 'create_category') {
      const { name, description, sort_order } = body;
      if (!name) return NextResponse.json({ error: '카테고리명을 입력해주세요.' }, { status: 400 });

      const { data, error } = await supabase
        .from('eundal_categories')
        .insert({ name, description, sort_order: sort_order || 0, is_active: true })
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, category: data });
    }

    if (action === 'create_menu') {
      const { category_id, name, description, allergens, price, image_url, additional_images, video_urls, sort_order } = body;
      if (!name || !category_id || price === undefined) {
        return NextResponse.json({ error: '카테고리, 메뉴명, 가격은 필수입니다.' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('eundal_menus')
        .insert({
          category_id,
          name,
          description,
          allergens: allergens || '',
          price: parseInt(price, 10),
          image_url: image_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
          additional_images: Array.isArray(additional_images) ? additional_images.filter(Boolean) : [],
          video_urls: Array.isArray(video_urls) ? video_urls.filter(Boolean) : [],
          sort_order: sort_order || 0,
          is_sold_out: false,
          is_active: true,
        })
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, menu: data });
    }

    return NextResponse.json({ error: '올바른 액션이 아닙니다.' }, { status: 400 });
  } catch (error) {
    console.error('Menu POST error:', error);
    return NextResponse.json({ error: '저장 처리 중 오류가 발생했습니다.' }, { status: 500 });
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
    const { action } = body;

    if (action === 'toggle_sold_out') {
      const { id, is_sold_out } = body;
      const { data, error } = await supabase
        .from('eundal_menus')
        .update({ is_sold_out })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, menu: data });
    }

    if (action === 'update_category') {
      const { id, name, description, sort_order, is_active } = body;
      const { data, error } = await supabase
        .from('eundal_categories')
        .update({ name, description, sort_order, is_active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, category: data });
    }

    if (action === 'update_menu') {
      const { id, category_id, name, description, allergens, price, image_url, additional_images, video_urls, sort_order, is_sold_out, is_active } = body;
      const { data, error } = await supabase
        .from('eundal_menus')
        .update({
          category_id,
          name,
          description,
          allergens: allergens !== undefined ? allergens : '',
          price: parseInt(price, 10),
          image_url,
          additional_images: Array.isArray(additional_images) ? additional_images.filter(Boolean) : [],
          video_urls: Array.isArray(video_urls) ? video_urls.filter(Boolean) : [],
          sort_order,
          is_sold_out,
          is_active,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, menu: data });
    }

    return NextResponse.json({ error: '올바른 액션이 아닙니다.' }, { status: 400 });
  } catch (error) {
    console.error('Menu PUT error:', error);
    return NextResponse.json({ error: '수정 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });

  try {
    if (type === 'category') {
      const { error } = await supabase.from('eundal_categories').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: '카테고리가 삭제되었습니다.' });
    }

    if (type === 'menu') {
      const { error } = await supabase.from('eundal_menus').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, message: '메뉴가 삭제되었습니다.' });
    }

    return NextResponse.json({ error: '삭제 타입이 올바르지 않습니다.' }, { status: 400 });
  } catch (error) {
    console.error('Menu DELETE error:', error);
    return NextResponse.json({ error: '삭제 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
