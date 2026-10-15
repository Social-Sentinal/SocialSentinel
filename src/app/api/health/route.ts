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

  return NextResponse.json(
    {
      status: 'ok',
      service: 'SocialSentinel',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      engine: 'Next.js App Router (Vercel Serverless)',
    },
    { status: 200 }
  );
}
