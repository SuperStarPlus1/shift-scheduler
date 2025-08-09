import { NextRequest, NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('swap_requests')
    .select('*')
    .eq('status','pending_manager')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const sb = supabaseRoute();
  const admin = supabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { from_assignment_id, to_employee_id } = await req.json();

  const { data: asg } = await admin
    .from('shift_assignments')
    .select('id, employee_id')
    .eq('id', from_assignment_id)
    .single();
  if (!asg || asg.employee_id !== user.id) {
    return NextResponse.json({ error: 'Not your assignment' }, { status: 403 });
  }

  const { error } = await admin
    .from('swap_requests')
    .insert({ from_assignment_id, to_employee_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
