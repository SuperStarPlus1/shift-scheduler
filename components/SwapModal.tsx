'use client';
import { useEffect, useState } from 'react';

type Candidate = { id: string; full_name: string; is_shift_lead: boolean };

export default function SwapModal({ assignmentId, onClose }: { assignmentId: number; onClose: ()=>void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/swaps/candidates?assignmentId=${assignmentId}`);
      const j = await res.json();
      if (j.error) setError(j.error); else setCandidates(j.data ?? []);
      setLoading(false);
    })();
  }, [assignmentId]);

  const requestSwap = async (to_employee_id: string) => {
    const res = await fetch('/api/swaps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from_assignment_id: assignmentId, to_employee_id }) });
    const j = await res.json();
    if (j.error) alert(j.error); else { alert('Swap request sent to manager'); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Choose a swap partner</h3>
          <button onClick={onClose} className="text-sm underline">Close</button>
        </div>
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && candidates.length === 0 && <p>No eligible candidates found.</p>}
        <ul className="divide-y">
          {candidates.map(c => (
            <li key={c.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.full_name}</div>
                {c.is_shift_lead && <div className="text-xs text-gray-600">Shift lead</div>}
              </div>
              <button onClick={()=>requestSwap(c.id)} className="px-3 py-1 bg-gray-900 text-white rounded">Request</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
