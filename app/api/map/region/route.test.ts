import { PgDialect } from 'drizzle-orm/pg-core';
import { GET } from './route';
import { requireAuthWithTenant } from '@/lib/api/require-auth';
import { getAccessibleRegionIdsForUser } from '@/lib/api/require-region';
import { db } from '@/db';

jest.mock('@/lib/api/require-auth', () => ({ requireAuthWithTenant: jest.fn() }));
jest.mock('@/lib/api/require-region', () => ({ getAccessibleRegionIdsForUser: jest.fn(), getRegionIdsForUser: jest.fn() }));
jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(requireAuthWithTenant).mockResolvedValue({ user: { id: 'user-a', app_metadata: {} }, tenantId: 'org-a', response: null } as never);
  jest.mocked(getAccessibleRegionIdsForUser).mockResolvedValue([11]);
});

it('rejects an explicit region not assigned to the user before querying its geometry', async () => {
  const response = await GET(new Request('http://localhost/api/map/region?regiao_id=12'));
  expect(response.status).toBe(403);
  expect(db.execute).not.toHaveBeenCalled();
});

it('constrains an assigned explicit region by the resolved organization', async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ count: 0 }] });
  const response = await GET(new Request('http://localhost/api/map/region?regiao_id=11'));
  expect(response.status).toBe(200);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
  expect(query.sql).toContain('organization_id =');
  expect(query.params).toEqual(expect.arrayContaining([11, 'org-a']));
});
