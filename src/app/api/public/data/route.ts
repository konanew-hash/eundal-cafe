import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getSupabaseServer();

  try {
    const [cafeRes, catRes, menuRes, policyRes] = await Promise.all([
      supabase.from('eundal_cafes').select('*').limit(1).single(),
      supabase.from('eundal_categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('eundal_menus').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('eundal_delivery_policies').select('*').limit(1).single(),
    ]);

    return NextResponse.json({
      cafe: cafeRes.data || null,
      categories: catRes.data || [],
      menus: menuRes.data || [],
      deliveryPolicy: policyRes.data || null,
    });
  } catch (error) {
    console.error('Failed to load public data:', error);
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
