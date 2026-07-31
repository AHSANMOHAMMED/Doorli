import { NextResponse } from 'next/server';

function getForumBase() {
  return (
    process.env.FORUM_SERVICE_URL ||
    process.env.NEXT_PUBLIC_FORUM_SERVICE_URL ||
    'http://127.0.0.1:8087'
  );
}

export async function GET() {
  const response = await fetch(`${getForumBase()}/forums`, { cache: 'no-store' });
  const json = await response.json().catch(() => ({ data: [] }));

  if (!response.ok) {
    return NextResponse.json({ items: [] }, { status: response.status });
  }

  return NextResponse.json({ items: json.data || [] });
}
