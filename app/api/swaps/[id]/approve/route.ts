import { NextRequest, NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = supabaseRoute();
  const admin = supabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { approve } = await req.json();

  if (!approve) {
    await admin.from('swap_requests').update({ status: 'rejected', manager_id: user.id, decision_at: new Date().toISOString() }).eq('id', params.id);
    return NextResponse.json({ ok: true });
  }

  const { data: sw, error: e1 } = await admin
    .from('swap_requests').select('*').eq('id', params.id).single();
  if (e1 || !sw) return NextResponse.json({ error: e1?.message || 'Not found' }, { status: 404 });

  const { error: e2 } = await admin
    .from('shift_assignments')
    .update({ employee_id: sw.to_employee_id, status: 'swapped' })
    .eq('id', sw.from_assignment_id);
  if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });

  await admin.from('swap_requests').update({ status: 'approved', manager_id: user.id, decision_at: new Date().toISOString() }).eq('id', params.id);
  return NextResponse.json({ ok: true });
}
