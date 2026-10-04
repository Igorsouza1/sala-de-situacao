import { PgDialect } from 'drizzle-orm/pg-core';
import { POST } from './route';
import { db } from '@/db';
import { requireRole } from '@/lib/api/require-auth';
import { getTenantIdForRegion } from '@/lib/api/scope';

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
jest.mock('@/lib/api/require-auth', () => ({ requireRole: jest.fn() }));
jest.mock('@/lib/api/scope', () => ({ getTenantIdForRegion: jest.fn() }));

const feature = (alertid: string) => ({
  type: 'Feature',
  properties: { ALERTID: alertid, ALERTHA: 1 },
  geometry: { type: 'Point', coordinates: [-56, -15] },
});
const request = (features: object[]) => {
  const form = new FormData();
  form.append('file', new Blob([JSON.stringify({ type: 'FeatureCollection', features })], { type: 'application/geo+json' }), 'alerts.geojson');
  return new Request('http://localhost/api/admin/regions/7/commit-desmatamento', { method: 'POST', body: form });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(requireRole).mockResolvedValue({ response: null } as never);
  jest.mocked(getTenantIdForRegion).mockResolvedValue('org-a');
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ linked: true }] });
});

it('upserts a universal fact and atomically links the requested region as historical', async () => {
  const response = await POST(request([feature('alert-1')]), { params: Promise.resolve({ id: '7' }) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ data: { inserted: 1, skipped: 0 } });
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
  expect(query.sql).toContain('ON CONFLICT (alertid) WHERE alertid IS NOT NULL');
  expect(query.sql).toContain('monitoramento.desmatamento_regioes');
  expect(query.sql).toContain('alerta_enviado');
  expect(query.sql).not.toContain('tenant_id');
  expect(query.params).toEqual(expect.arrayContaining(['alert-1', 7]));
});

it('does not duplicate an existing link or repeated alertid in the file', async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ linked: false }] });
  const response = await POST(request([feature('alert-1'), feature('alert-1')]), { params: Promise.resolve({ id: '7' }) });
  expect(await response.json()).toMatchObject({ data: { inserted: 0, skipped: 2 } });
  expect(db.execute).toHaveBeenCalledTimes(1);
});

it('requires superadmin authorization before reading the import', async () => {
  jest.mocked(requireRole).mockResolvedValue({ response: new Response(null, { status: 403 }) } as never);
  const response = await POST(request([feature('alert-1')]), { params: Promise.resolve({ id: '7' }) });
  expect(response.status).toBe(403);
  expect(db.execute).not.toHaveBeenCalled();
});
