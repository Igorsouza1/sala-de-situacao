import { type NextRequest, NextResponse } from 'next/server';

// Exact path and method: community reporting is intentionally public, including
// the offline queue on /avistamento-javali. Other javali APIs require a session.
export const API_AUTH_EXCEPTIONS = [
  { path: '/api/javali-avistamentos/report', method: 'POST', reason: 'Public community wildlife reporting', auth: 'public' },
  // Scheduled river measurements: machine callers must provide the shared secret.
  { path: '/api/balneario-municipal/sync', method: 'POST', reason: 'Scheduled river measurement sync', auth: 'cron-secret' },
] as const;
// Auth callbacks live outside /api. Environmental ingestion calls Supabase
// Edge Functions directly (_shared/edge.ts validates CRON_SECRET there).
export function isPublicApiRequest(request: NextRequest): boolean {
  const entry = API_AUTH_EXCEPTIONS.find(entry => entry.path === request.nextUrl.pathname && entry.method === request.method);
  if (!entry) return false;
  if (entry.auth === 'public') return true;
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
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
