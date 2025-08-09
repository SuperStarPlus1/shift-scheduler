'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Register() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) return setMsg(error.message);
    setMsg('Signed up. Check your email if confirmation is required. Ask your manager to assign department/role.');
  };

  return (
    <main className="p-6 max-w-sm mx-auto space-y-3">
      <h2 className="text-xl font-semibold">Register</h2>
      <form onSubmit={submit} className="space-y-2">
        <input className="w-full border p-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-black text-white">Create account</button>
      </form>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
