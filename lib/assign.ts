import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function assignWeek(startISO: string) {
  const admin = supabaseAdmin();

  // Load shifts for the week
  const { data: shifts } = await admin
    .from('shifts')
    .select('*')
    .gte('shift_date', startISO)
    .lte('shift_date', addDaysISO(startISO, 6));

  if (!shifts) return;

  // Group shifts by department & date for fairness
  const byDept: Record<string, any[]> = {};
  for (const sh of shifts) {
    byDept[sh.department_id] ??= [];
    byDept[sh.department_id].push(sh);
  }

  for (const depId of Object.keys(byDept)) {
    // Load employees in department
    const { data: employees } = await admin
      .from('profiles')
      .select('id, full_name, is_shift_lead')
      .eq('department_id', Number(depId));

    if (!employees || employees.length === 0) continue;

    // Track assigned count per employee this week
    const assignedCount: Record<string, number> = Object.fromEntries(employees.map(e => [e.id, 0]));
    const dailyTaken: Record<string, Set<string>> = {}; // key: yyyy-mm-dd → Set<employeeId>

    // Preload constraints for week
    const { data: cons } = await admin
      .from('constraints')
      .select('employee_id, start_ts, end_ts')
      .gte('week_start', startISO)
      .lte('week_start', startISO);

    const constraintsByEmp: Record<string, {start: number, end: number}[]> = {};
    (cons ?? []).forEach(c => {
      (constraintsByEmp[c.employee_id] ??= []).push({ start: Date.parse(c.start_ts), end: Date.parse(c.end_ts) });
    });

    for (const shift of byDept[depId].sort(sortByDateTime)) {
      const shiftStart = Date.parse(`${shift.shift_date}T${shift.start_time}`);
      const shiftEnd   = Date.parse(`${shift.shift_date}T${shift.end_time}`);

      const dayKey = shift.shift_date;
      dailyTaken[dayKey] ??= new Set<string>();

      // Candidate filter: not blocked by constraints & not already assigned that day
      let candidates = employees.filter(e => !overlapsConstraints(constraintsByEmp[e.id] ?? [], shiftStart, shiftEnd))
                                .filter(e => !dailyTaken[dayKey].has(e.id));

      // If require lead: pick a lead first
      const assigned: { id: string, role: 'regular'|'lead' }[] = [];
      if (shift.require_shift_lead) {
        const lead = candidates
          .filter(e => e.is_shift_lead)
          .sort((a, b) => (assignedCount[a.id] - assignedCount[b.id]) || cmp(a.full_name, b.full_name))[0];
        if (lead) {
          assigned.push({ id: lead.id, role: 'lead' });
          assignedCount[lead.id]++;
          dailyTaken[dayKey].add(lead.id);
          candidates = candidates.filter(c => c.id !== lead.id);
        } else {
          // No available lead → skip filling; manager can fix manually
          continue;
        }
      }

      // Fill remaining spots
      const remaining = (shift.required_headcount ?? 1) - assigned.length;
      const rest = candidates
        .sort((a, b) => (assignedCount[a.id] - assignedCount[b.id]) || cmp(a.full_name, b.full_name))
        .slice(0, Math.max(0, remaining));

      for (const r of rest) {
        assigned.push({ id: r.id, role: 'regular' });
        assignedCount[r.id]++;
        dailyTaken[dayKey].add(r.id);
      }

      // Persist assignments
      for (const a of assigned) {
        await admin.from('shift_assignments').upsert({
          shift_id: shift.id,
          employee_id: a.id,
          role: a.role,
          status: 'assigned'
        }, { onConflict: 'shift_id,employee_id' });
      }
    }
  }
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

function sortByDateTime(a: any, b: any) {
  const as = `${a.shift_date}T${a.start_time}`;
  const bs = `${b.shift_date}T${b.start_time}`;
  return as < bs ? -1 : as > bs ? 1 : 0;
}

function overlapsConstraints(windows: {start:number,end:number}[], s: number, e: number) {
  return windows.some(w => !(w.end <= s || w.start >= e));
}

function cmp(a?: string|null, b?: string|null) {
  return (a ?? '').localeCompare(b ?? '');
}
