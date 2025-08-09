import { NextRequest, NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Returns valid swap candidates for a given assignment: same dept, same role capability, no overlap.
export async function GET(req: NextRequest) {
  const sb = supabaseRoute();
  const admin = supabaseAdmin();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assignmentId = Number(new URL(req.url).searchParams.get('assignmentId'));
  if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });

  // Load original assignment + shift + role
  const { data: asg, error: e1 } = await admin
    .from('shift_assignments')
    .select('id, role, employee_id, shift:shift_id(*), owner:employee_id(*)')
    .eq('id', assignmentId)
    .single();
  if (e1 || !asg) return NextResponse.json({ error: e1?.message || 'Assignment not found' }, { status: 404 });

  // Employees in same department
  const { data: peers } = await admin
    .from('profiles')
    .select('id, full_name, is_shift_lead, department_id')
    .eq('department_id', asg.shift.department_id);

  // Existing assignments that day to check overlap
  const { data: sameDayAsg } = await admin
    .from('shift_assignments')
    .select('employee_id, shift:shift_id(shift_date, start_time, end_time)')
    .in('shift_id', [asg.shift.id]);

  const result = (peers ?? [])
    .filter(p => p.id !== asg.employee_id)
    .filter(p => asg.role === 'regular' || (asg.role === 'lead' && p.is_shift_lead))
    .map(p => ({ id: p.id, full_name: p.full_name ?? 'Unnamed', is_shift_lead: p.is_shift_lead }));

  return NextResponse.json({ data: result });
}
