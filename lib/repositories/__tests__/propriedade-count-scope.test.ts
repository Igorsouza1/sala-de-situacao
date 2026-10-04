import { PgDialect } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { countPropriedades } from '../propriedadesRepository';

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));

beforeEach(() => (db.execute as jest.Mock).mockResolvedValue({ rows: [{ count: 2 }] }));

it('counts only properties intersecting the assigned regions of the organization', async () => {
  expect(await countPropriedades('org-a', 10, 100, [7, 8])).toBe(2);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
  expect(query.sql).toContain('r.organization_id =');
  expect(query.sql).toContain('r.id IN');
  expect(query.sql).toContain('ST_Intersects(r.geom, p.geom)');
  expect(query.sql).not.toContain('p.tenant_id');
  expect(query.params).toEqual(expect.arrayContaining(['org-a', 7, 8, 10, 100]));
});

it('denies a user with an empty region grant', async () => {
  await countPropriedades('org-a', undefined, undefined, []);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls.at(-1)[0]);
  expect(query.sql).toContain('AND false');
});

it('allows the superadmin global count', async () => {
  await countPropriedades('org-a', undefined, undefined, null as unknown as undefined, true);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls.at(-1)[0]);
  expect(query.sql).not.toContain('ST_Intersects');
});
