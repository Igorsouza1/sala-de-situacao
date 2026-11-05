jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
jest.mock('../scope', () => ({ getTenantIdForRegion: jest.fn() }));
jest.mock('../require-region', () => ({ getRegionIdForUser: jest.fn() }));
import { db } from '@/db';
import { requireWriteRegion } from '../require-write-region';
import { getTenantIdForRegion } from '../scope';

const user = { id: 'u1', app_metadata: {} } as never;
const grant = (ok: boolean) => (db.execute as jest.Mock).mockResolvedValue({ rows: [{ ok }] });
beforeEach(() => {
  jest.resetAllMocks();
  (getTenantIdForRegion as jest.Mock).mockResolvedValue('org-b');
});

it('edita uma Região de outra Organização em que a pessoa é editora, e a Organização passa a ser a dela', async () => {
  grant(true);
  expect(await requireWriteRegion(user, 'org-a', '2')).toMatchObject({ regionId: 2, tenantId: 'org-b', response: null });
  const { PgDialect } = jest.requireActual('drizzle-orm/pg-core');
  expect(new PgDialect().sqlToQuery((db.execute as jest.Mock).mock.calls[0][0]).params).toEqual(['u1', 'org-b', 2]);
});
it('sem papel de escrita na Organização da Região: recusa dizendo que é de outra Organização', async () => {
  grant(false);
  const r = await requireWriteRegion(user, 'org-a', '2');
  expect(r.response?.status).toBe(403);
  expect((await r.response!.json()).error.message).toMatch(/outra organizacao/);
});
it('na mesma Organização, sem papel de escrita: recusa por falta de permissão', async () => {
  grant(false);
  (getTenantIdForRegion as jest.Mock).mockResolvedValue('org-a');
  const r = await requireWriteRegion(user, 'org-a', '2');
  expect((await r.response!.json()).error.message).toMatch(/Sem permissao de escrita/);
});
