import { getLayer } from '../layerService';
import { getLayerCatalog, getGenericLayerData } from '@/lib/repositories/layerRepository';
import { db } from '@/db';
import { PgDialect } from 'drizzle-orm/pg-core';
jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
jest.mock('@/lib/repositories/layerRepository', () => ({ getLayerCatalog: jest.fn(), getGenericLayerData: jest.fn() }));
jest.mock('../layer-resolver', () => ({ resolveTableLayer: jest.fn() }));
const base = { id: 1, name: 'layer', slug: 'acoes', schemaConfig: {}, visualConfig: {}, tenantId: 'org-a' };
beforeEach(() => {
  jest.clearAllMocks();
  (getGenericLayerData as jest.Mock).mockResolvedValue({ type: 'FeatureCollection', features: [] });
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
});
it('does not load data for a catalog entry owned by another organization', async () => {
  (getLayerCatalog as jest.Mock).mockResolvedValue({ ...base, tenantId: 'org-b' });
  expect(await getLayer('acoes', 'org-a')).toBeNull();
  expect(getGenericLayerData).not.toHaveBeenCalled();
});
it('retains global generic layer data for authenticated users', async () => {
  (getLayerCatalog as jest.Mock).mockResolvedValue({ ...base, tenantId: null, scope: 'global' });
  expect(await getLayer('acoes', 'org-a')).not.toBeNull();
  expect(getGenericLayerData).toHaveBeenCalledWith(1, 'monitoramento', expect.objectContaining({ tenantId: null }));
});
it('retains legacy global layer data even when catalog tenant belongs to another organization', async () => {
  (getLayerCatalog as jest.Mock).mockResolvedValue({ ...base, tenantId: 'org-b', scope: 'global' });
  expect(await getLayer('acoes', 'org-a')).not.toBeNull();
  expect(getGenericLayerData).toHaveBeenCalledWith(1, 'monitoramento', expect.objectContaining({ tenantId: null }));
});
it('does not expose action group names from another organization', async () => {
  (getLayerCatalog as jest.Mock).mockResolvedValue({ ...base, visualConfig: { groupByColumn: 'categoria' } });
  await getLayer('acoes', 'org-a');
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
  expect(query.sql).toContain('tenant_id =');
  expect(query.params).toContain('org-a');
});
