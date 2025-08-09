# Weekly Shift Scheduler

## Quick Start
1. **Supabase**: Create project → open **SQL Editor** → paste `supabase/schema.sql`, run. Optionally run `supabase/seed.sql`.
2. **Vercel**: Import this repo → set env vars from `.env.example` → Deploy.
3. **Cron**: In Vercel Project → Settings → **Cron Jobs** → POST `/api/schedule/generate` weekly (or use `vercel.json`).

## Local Dev
```bash
cp .env.example .env.local
npm i
npm run dev
