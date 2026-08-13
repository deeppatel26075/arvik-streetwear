import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAdminPath = path.startsWith('/admin');
  const isProfilePath = path.startsWith('/profile');

  // Check for any Supabase auth cookie (chunked or legacy format)
  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('supabase-auth-token') ||
    request.cookies.getAll().some((c) => c.name.includes('auth-token')) ||
    request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  // Redirect unauthenticated users away from protected routes
  if ((isAdminPath || isProfilePath) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
};
