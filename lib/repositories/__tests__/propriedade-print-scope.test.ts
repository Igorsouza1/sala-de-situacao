import { findPropriedadeDossieData } from '../propriedadesRepository';
import { db } from '@/db';
import { PgDialect } from 'drizzle-orm/pg-core';
jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
beforeEach(() => (db.execute as jest.Mock).mockResolvedValue({ rows: [] }));
it('authorizes base properties through owned assigned regions and scopes related actions', async () => {
  await findPropriedadeDossieData(5, 'org-a', [7, 8]);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls.at(-1)[0]);
  expect(query.sql).toContain('r.organization_id =');
  expect(query.sql).toContain('ST_Intersects(r.geom, propriedades.geom)');
  expect(query.sql).toContain('r.id IN');
  expect(query.sql).toContain('a.tenant_id =');
  expect((query.sql.match(/monitoramento\.firms_regioes fr/g) ?? [])).toHaveLength(3);
  expect((query.sql.match(/monitoramento\.desmatamento_regioes dr/g) ?? [])).toHaveLength(3);
  expect((query.sql.match(/r\.organization_id =/g) ?? [])).toHaveLength(7);
  expect(query.params).toEqual(expect.arrayContaining(['org-a', 7, 8]));
});
it('an explicitly empty region grant authorizes no properties', async () => {
  await findPropriedadeDossieData(5, 'org-a', []);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls.at(-1)[0]);
  expect(query.sql).toContain('AND false');
});
