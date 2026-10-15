import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const frontendBase = process.env.FRONTEND_URL;
  if (!frontendBase) {
    return NextResponse.json(
      { error: 'FRONTEND_URL service binding is not configured' },
      { status: 503 }
    );
  }

  const subpath = params?.path?.length ? params.path.join('/') : '';
  const search = req.nextUrl.search;
  const targetUrl = new URL(subpath + search, frontendBase);

  try {
    const response = await fetch(targetUrl.toString());
    const contentType = response.headers.get('content-type') || 'text/html';
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'content-type': contentType,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to proxy to frontend service: ${error.message}` },
      { status: 502 }
    );
  }
}
