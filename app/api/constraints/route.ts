import { NextRequest, NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const sb = supabaseRoute();
  const admin = supabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { start_ts, end_ts, week_start, kind = 'unavailable' } = await req.json();

  const { count } = await admin
    .from('constraints')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', user.id)
    .eq('week_start', week_start);
  if ((count ?? 0) >= 2) return NextResponse.json({ error: 'Already submitted 2 constraints this week' }, { status: 400 });

  const { error } = await admin.from('constraints').insert({ employee_id: user.id, start_ts, end_ts, week_start, kind });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
