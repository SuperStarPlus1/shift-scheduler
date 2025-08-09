import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { assignWeek } from '@/lib/assign';

function nextSundayISO() {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() + ((7 - today.getDay()) % 7));
  return d.toISOString().slice(0,10);
}

export async function POST() {
  const admin = supabaseAdmin();

  const { data: deps } = await admin.from('departments').select('*');
  if (!deps) return NextResponse.json({ ok: true });

  const startISO = nextSundayISO();
  const start = new Date(startISO);
  for (let i = 0; i < 7; i++) {
    const day = new Date(start); day.setDate(start.getDate() + i);
    const ds = day.toISOString().slice(0,10);
    for (const dep of deps) {
      await admin.from('shifts').upsert({ department_id: dep.id, shift_date: ds, start_time: '07:00', end_time: '14:59', required_headcount: 3, require_shift_lead: false }, { onConflict: 'department_id,shift_date,start_time,end_time' });
      await admin.from('shifts').upsert({ department_id: dep.id, shift_date: ds, start_time: '15:00', end_time: '22:00', required_headcount: 3, require_shift_lead: true  }, { onConflict: 'department_id,shift_date,start_time,end_time' });
    }
  }

  // NEW: auto-assign fairly respecting constraints + evening lead
  await assignWeek(startISO);

  return NextResponse.json({ ok: true });
}
