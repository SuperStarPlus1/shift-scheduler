import Link from 'next/link';
export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weekly Shift Scheduler</h1>
      <div className="space-x-3">
        <Link className="underline" href="/(auth)/login">Login</Link>
        <Link className="underline" href="/(auth)/register">Register</Link>
      </div>
    </main>
  );
}
