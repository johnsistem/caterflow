import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const i18nMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Update session and get user
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  
  // Extract locale from pathname (e.g., /en/dashboard -> en)
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  const locale = pathnameHasLocale ? pathname.split('/')[1] : routing.defaultLocale;

  // 2. Auth Protection Logic
  
  // Is it a dashboard route?
  const isDashboardRoute = pathname.includes('/dashboard') || 
                           pathname.includes('/inventory') || 
                           pathname.includes('/recipes') || 
                           pathname.includes('/events') || 
                           pathname.includes('/clients') || 
                           pathname.includes('/financials');

  const isAuthRoute = pathname.includes('/login') || pathname.includes('/signup');

  if (isDashboardRoute && !user) {
    // Redirect to login if not authenticated
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    // Redirect to dashboard if already authenticated
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // 3. Run i18n middleware
  return i18nMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(es|en)/:path*',

    // Enable redirects that improve SEO for non-locale-prefix requests
    // (e.g. `/about` -> `/en/about`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
