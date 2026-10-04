import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { isPublicApiRequest, unauthenticatedResponse } from './auth-policy';

export const updateSession = async (request: NextRequest) => {
  if (isPublicApiRequest(request)) return NextResponse.next();
  let response = NextResponse.next({ request: { headers: request.headers } });
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      } },
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const denied = unauthenticatedResponse(request);
      if (denied) {
        response.cookies.getAll().forEach(cookie => denied.cookies.set(cookie));
        return denied;
      }
    } else if (['/sign-in', '/forgot-password', '/invite'].includes(request.nextUrl.pathname)) {
      const destination = user.app_metadata?.is_superadmin === true ? '/admin' : '/protected';
      const redirect = NextResponse.redirect(new URL(destination, request.url));
      response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
      return redirect;
    }
    return response;
  } catch {
    return unauthenticatedResponse(request) ?? response;
  }
};
