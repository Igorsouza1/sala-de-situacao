import { PgDialect } from 'drizzle-orm/pg-core';
import { db } from '@/db';
import { listUserAccessInDb } from '../userManagementRepository';

jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));

it('starts from login accounts so users without roles remain visible', async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ userId: 'user-without-role', roleId: null }] });
  expect(await listUserAccessInDb()).toEqual([{ userId: 'user-without-role', roleId: null }]);
  const query = new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]);
  expect(query.sql).toContain('FROM auth.users u');
  expect(query.sql).toContain('LEFT JOIN monitoramento.roles r ON r.user_id = u.id');
  expect(query.sql).toContain('"isSuperadmin"');
});
