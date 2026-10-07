import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const {
      name,
      branch_name,
      address,
      address_detail,
      postal_code,
      phone,
      operating_hours,
      description,
      is_active,
      sort_order,
    } = body;

    const supabase = getSupabaseServer();
    const { data: updated, error } = await supabase
      .from('eundal_stores')
      .update({
        name: name ? name.trim() : undefined,
        branch_name: branch_name !== undefined ? (branch_name ? branch_name.trim() : null) : undefined,
        address: address ? address.trim() : undefined,
        address_detail: address_detail !== undefined ? (address_detail ? address_detail.trim() : null) : undefined,
        postal_code: postal_code !== undefined ? (postal_code ? postal_code.trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        operating_hours: operating_hours !== undefined ? operating_hours.trim() : undefined,
        description: description !== undefined ? (description ? description.trim() : null) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        sort_order: sort_order !== undefined ? parseInt(String(sort_order), 10) : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !updated) throw error;

    return NextResponse.json({ success: true, store: updated });
  } catch (err) {
    console.error('Failed to update store:', err);
    return NextResponse.json({ error: '매장 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

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
    const { error } = await supabase.from('eundal_stores').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete store:', err);
    return NextResponse.json({ error: '매장 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
