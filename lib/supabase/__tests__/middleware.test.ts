import { NextRequest } from 'next/server';
import { updateSession } from '../middleware';
import { createServerClient } from '@supabase/ssr';
jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
const getUser = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  (createServerClient as jest.Mock).mockReturnValue({ auth: { getUser } });
  getUser.mockResolvedValue({ data: { user: null }, error: null });
});
const request = (path: string, method = 'GET') => new NextRequest(`https://example.com${path}`, { method });
it('rejects unauthenticated API requests with JSON 401 even without an auth error', async () => {
  const response = await updateSession(request('/api/acoes'));
  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({ success: false });
});
it.each(['/print/dossie/1', '/print/propriedade/1', '/print/map'])('redirects anonymous print access %s', async path => {
  expect((await updateSession(request(path))).headers.get('location')).toBe('https://example.com/sign-in');
});
it('allows the public community javali POST without a session', async () => {
  expect((await updateSession(request('/api/javali-avistamentos/report', 'POST'))).status).toBe(200);
});
it('does not exempt other methods or similarly named paths', async () => {
  expect((await updateSession(request('/api/javali-avistamentos/report'))).status).toBe(401);
  expect((await updateSession(request('/api/javali-avistamentos/report/extra', 'POST'))).status).toBe(401);
});
it('allows authenticated API requests', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'user' } }, error: null });
  expect((await updateSession(request('/api/acoes'))).status).toBe(200);
});
it('fails closed on auth infrastructure errors', async () => {
  getUser.mockRejectedValue(new Error('unavailable'));
  expect((await updateSession(request('/api/acoes'))).status).toBe(401);
  expect((await updateSession(request('/print/map'))).headers.get('location')).toContain('/sign-in');
});

it('allows machine sync only with the configured secret', async () => {
  process.env.CRON_SECRET = 'test-cron-secret';
  const sync = new NextRequest('https://example.com/api/balneario-municipal/sync', {
    method: 'POST', headers: { Authorization: 'Bearer test-cron-secret' },
  });
  expect((await updateSession(sync)).status).toBe(200);
  expect((await updateSession(request('/api/balneario-municipal/sync', 'POST'))).status).toBe(401);
  delete process.env.CRON_SECRET;
  expect((await updateSession(sync)).status).toBe(401);
});
