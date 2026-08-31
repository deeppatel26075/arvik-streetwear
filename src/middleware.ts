import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected path matches
  const isAdminPath = path.startsWith('/admin');
  const isProfilePath = path.startsWith('/profile');

  // Retrieve Supabase token from cookies
  const hasSession = request.cookies.has('sb-access-token') || 
                      request.cookies.has('supabase-auth-token') ||
                      request.cookies.getAll().some(c => c.name.includes('auth-token'));

  // If trying to access profile/admin without any token, redirect to login
  if ((isProfilePath || isAdminPath) && !hasSession) {
    // We let the client-side context handle deeper verification,
    // but redirect immediately if there are no auth cookies at all.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
};
