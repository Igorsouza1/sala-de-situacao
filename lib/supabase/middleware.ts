import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { isPublicApiRequest, unauthenticatedResponse } from './auth-policy';
import { OPEN_REGION_COOKIE, OPEN_REGION_MAX_AGE } from '@/lib/open-region-cookie';
import { parseRegiaoIdParam } from '@/lib/api/region-id';

/**
 * A página aberta com `regiao_id` guarda essa Região num cookie: as rotas que não recebem a Região usam a Organização dela
 * (lib/api/open-region.ts). Só páginas, nunca /api (uma chamada não muda onde a pessoa está). É preferência, não permissão.
 */
export function rememberOpenRegion(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.pathname.startsWith('/api/')) return;
  const parsed = parseRegiaoIdParam(request.nextUrl.searchParams);
  if (!parsed.ok || parsed.id === null) return;
  if (request.cookies.get(OPEN_REGION_COOKIE)?.value === String(parsed.id)) return;
  response.cookies.set(OPEN_REGION_COOKIE, String(parsed.id), {
    path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: OPEN_REGION_MAX_AGE,
  });
}

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
    } else {
      rememberOpenRegion(request, response);
    }
    return response;
  } catch {
    return unauthenticatedResponse(request) ?? response;
  }
};
