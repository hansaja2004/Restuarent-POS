import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  const session = token ? await verifyToken(token) : null;

  // Protect /login route: if logged in, redirect to pos/admin
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    return NextResponse.next();
  }

  // Allow static files and API routes (can restrict API later)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow root landing page to be public
  if (pathname === '/') {
    return NextResponse.next();
  }

  // If no session, redirect everything else to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Route protection by role
  const isCashierAllowed = pathname === '/pos' || pathname.startsWith('/dashboard');
  const isManagerAllowed = !pathname.startsWith('/settings');

  if (session.role === 'cashier' && !isCashierAllowed) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  if (session.role === 'manager' && !isManagerAllowed) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }



  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
