import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  let dbStatus = 'disconnected';

  try {
    const { error } = await supabase.from('communities').select('id').limit(1);
    if (!error) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  let frontendStatus = 'unbound';
  if (process.env.FRONTEND_URL) {
    try {
      const frontendHealthUrl = new URL('', process.env.FRONTEND_URL);
      const feRes = await fetch(frontendHealthUrl.toString(), {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000),
      });
      frontendStatus = feRes.ok ? 'connected' : `status_${feRes.status}`;
    } catch {
      frontendStatus = 'offline';
    }
  }

  return NextResponse.json(
    {
      status: 'ok',
      service: 'SocialSentinel',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      services: {
        frontend: frontendStatus,
      },
      engine: 'Next.js App Router (Vercel Serverless)',
    },
    { status: 200 }
  );
}
