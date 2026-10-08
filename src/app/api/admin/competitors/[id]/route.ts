import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { EUNDAL_STORE1_COORDS, EUNDAL_STORE2_COORDS, calculateDistanceKm } from '@/lib/geoUtils';

// 경쟁사 수정 (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServer();

  try {
    const body = await request.json();
    const {
      name,
      brand_type,
      target_branch,
      address,
      address_detail,
      phone,
      latitude,
      longitude,
      naver_place_id,
      naver_place_url,
      rating,
      review_count,
      blog_review_count,
      popularity_score,
      image_url,
      description,
      representative_menu,
      avg_coffee_price,
      is_active,
      sort_order,
      menus,
    } = body;

    const updatePayload: Record<string, any> = {
      last_updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updatePayload.name = name;
    if (brand_type !== undefined) updatePayload.brand_type = brand_type;
    if (target_branch !== undefined) updatePayload.target_branch = target_branch;
    if (address !== undefined) updatePayload.address = address;
    if (address_detail !== undefined) updatePayload.address_detail = address_detail;
    if (phone !== undefined) updatePayload.phone = phone;

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      updatePayload.latitude = lat;
      updatePayload.longitude = lng;
      updatePayload.distance_store1 = calculateDistanceKm(lat, lng, EUNDAL_STORE1_COORDS.lat, EUNDAL_STORE1_COORDS.lng);
      updatePayload.distance_store2 = calculateDistanceKm(lat, lng, EUNDAL_STORE2_COORDS.lat, EUNDAL_STORE2_COORDS.lng);
    }

    if (naver_place_id !== undefined) updatePayload.naver_place_id = naver_place_id;
    if (naver_place_url !== undefined) updatePayload.naver_place_url = naver_place_url;
    if (rating !== undefined) updatePayload.rating = parseFloat(rating);
    if (review_count !== undefined) updatePayload.review_count = parseInt(review_count, 10);
    if (blog_review_count !== undefined) updatePayload.blog_review_count = parseInt(blog_review_count, 10);
    if (popularity_score !== undefined) updatePayload.popularity_score = parseFloat(popularity_score);
    if (image_url !== undefined) updatePayload.image_url = image_url;
    if (description !== undefined) updatePayload.description = description;
    if (representative_menu !== undefined) updatePayload.representative_menu = representative_menu;
    if (avg_coffee_price !== undefined) updatePayload.avg_coffee_price = parseInt(avg_coffee_price, 10);
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (sort_order !== undefined) updatePayload.sort_order = parseInt(sort_order, 10);

    const { data: updated, error: updateError } = await supabase
      .from('eundal_competitors')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 메뉴 목록이 제공된 경우 갱신
    if (Array.isArray(menus)) {
      await supabase.from('eundal_competitor_menus').delete().eq('competitor_id', id);

      if (menus.length > 0) {
        const menuRows = menus.map((m: any, idx: number) => ({
          competitor_id: id,
          name: m.name,
          category: m.category || 'coffee',
          price: parseInt(m.price, 10) || 0,
          description: m.description || null,
          is_signature: Boolean(m.is_signature),
          sort_order: idx + 1,
        }));
        await supabase.from('eundal_competitor_menus').insert(menuRows);
      }
    }

    return NextResponse.json({ success: true, competitor: updated });
  } catch (error: any) {
    console.error('Failed to update competitor:', error);
    return NextResponse.json({ error: error.message || '수정 실패' }, { status: 500 });
  }
}

// 경쟁사 삭제 (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServer();

  try {
    const { error } = await supabase.from('eundal_competitors').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete competitor:', error);
    return NextResponse.json({ error: error.message || '삭제 실패' }, { status: 500 });
  }
}
