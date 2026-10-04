jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
import { db } from '@/db';
import { PgDialect } from 'drizzle-orm/pg-core';
import { resolveTableLayer } from '../layer-resolver';
import type { LayerScope } from '@/types/map-dto';
beforeEach(() => { jest.resetAllMocks(); (db.execute as jest.Mock).mockResolvedValue({ rows: [] }); });
async function query(tableName: string, scope: LayerScope = 'region', regiaoId: number | undefined = 11) {
  await resolveTableLayer({ tableName }, scope, { tenantId: 'org-a', regiaoId });
  return new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
}
test.each(['tenant', 'region', 'global'] as LayerScope[])('actions remain private under catalog scope %s', async scope => {
  const q = await query('acoes', scope);
  expect(q.sql).toContain('t.tenant_id =');
  expect(q.sql).toContain('r.id = t.regiao_id');
  expect(q.sql).toContain('r.organization_id =');
  expect(q.params).toEqual(['org-a', 'org-a', 11]);
  expect(q.sql).not.toContain('ST_Intersects');
});
test.each(['raw_firms', 'desmatamento'])('%s uses universal facts via authorized junction even when catalog is global', async table => {
  const q = await query(table, 'global');
  expect(q.sql).toContain(table === 'raw_firms' ? '"firms_regioes"' : '"desmatamento_regioes"');
  expect(q.sql).toContain('EXISTS');
  expect(q.sql).toContain('r.organization_id =');
  expect(q.params).toEqual(['org-a', 11]);
  expect(q.sql).not.toContain('t.tenant_id =');
});
it('limits universal properties spatially to authorized regions', async () => {
  const q = await query('propriedades', 'global');
  expect(q.sql).toContain('ST_Intersects(t."geom", r.geom)');
  expect(q.params).toEqual(['org-a', 11]);
});
it('owner organization scope still filters junction ownership', async () => {
  await resolveTableLayer({ tableName: 'raw_firms' }, 'global', { tenantId: 'org-a' });
  const q = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
  expect(q.params).toEqual(['org-a']);
  expect(q.sql).toContain('r.organization_id =');
});
it('global reference roads remain available', async () => {
  const q = await query('estradas', 'global');
  expect(q.sql).toContain('WHERE TRUE');
  expect(q.params).toEqual([]);
});
it('returns actual geometry and feature properties from query rows', async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ id: 5, acq_date: '2026-10-04', geojson: '{"type":"Point","coordinates":[1,2]}' }] });
  expect(await resolveTableLayer({ tableName: 'raw_firms' }, 'global', { tenantId: 'org-a', regiaoId: 11 })).toEqual({ type: 'FeatureCollection', features: [{ type: 'Feature', id: 5, geometry: { type: 'Point', coordinates: [1, 2] }, properties: { id: 5, acq_date: '2026-10-04' } }] });
});
