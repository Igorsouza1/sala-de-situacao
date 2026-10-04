import { type NextRequest, NextResponse } from 'next/server';

// Exact path and method: community reporting is intentionally public, including
// the offline queue on /avistamento-javali. Other javali APIs require a session.
export const API_AUTH_EXCEPTIONS = [
  { path: '/api/javali-avistamentos/report', method: 'POST', reason: 'Public community wildlife reporting' },
] as const;
// Auth callbacks live outside /api. Scheduled ingestion calls Supabase Edge
// Functions directly, where _shared/edge.ts validates CRON_SECRET. No machine
// endpoint in this Next.js API is exempted; new ones must validate their secret.
export function isPublicApiRequest(request: NextRequest): boolean {
  return API_AUTH_EXCEPTIONS.some(entry => entry.path === request.nextUrl.pathname && entry.method === request.method);
}
export function unauthenticatedResponse(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;
  if ((path === '/api' || path.startsWith('/api/')) && !isPublicApiRequest(request)) {
    return NextResponse.json({ success: false, error: { message: 'Não autorizado.' } }, { status: 401 });
  }
  if (['/print', '/protected', '/admin'].some(prefix => path === prefix || path.startsWith(prefix + '/'))) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  return null;
}
