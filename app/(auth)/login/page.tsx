'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function Login() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);
    router.push('/(employee)/dashboard');
  };

  return (
    <main className="p-6 max-w-sm mx-auto space-y-3">
      <h2 className="text-xl font-semibold">Login</h2>
      <form onSubmit={submit} className="space-y-2">
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-black text-white">Sign in</button>
      </form>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </main>
  );
}
