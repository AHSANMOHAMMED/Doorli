import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  // Since we store token in localStorage, the server-side middleware cannot easily read it.
  // We'll rely on client-side protection or cookie based protection.
  // Wait, Next.js middleware is edge, so we can't read localStorage.
  // I will just return NextResponse.next() here and implement a client side provider instead.
  return NextResponse.next();
}
