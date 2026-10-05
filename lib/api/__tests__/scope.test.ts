jest.mock('@/lib/api/require-auth', () => ({ requireAuthWithTenant: jest.fn() }));
jest.mock('@/lib/api/require-region', () => ({ getAccessibleRegionIdsForUser: jest.fn() }));
jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
import { resolveScope } from '../scope';
import { parseRegiaoIdParam, parseRegionIdInput } from '../region-id';
import { requireAuthWithTenant } from '../require-auth';
import { getAccessibleRegionIdsForUser } from '../require-region';
import { db } from '@/db';
beforeEach(() => {
  jest.resetAllMocks();
  (requireAuthWithTenant as jest.Mock).mockResolvedValue({ user: { id: 'u1', app_metadata: {} }, tenantId: 'org-a', response: null });
  (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue([11]);
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: 'org-a' }] });
});
it('denies an unassigned region in the same organization', async () => {
  expect((await resolveScope({ regiaoId: 22 })).response?.status).toBe(403);
});

it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
  'rejects invalid numeric region ID %s before database lookup', async (regiaoId) => {
    expect((await resolveScope({ regiaoId })).response?.status).toBe(400);
    expect(db.execute).not.toHaveBeenCalled();
  },
);
it('allows an assigned region', async () => {
  expect(await resolveScope({ regiaoId: 11 })).toMatchObject({ tenantId: 'org-a', regiaoId: 11, response: null });
});
it('denies a different organization before considering grants', async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: 'org-b' }] });
  expect((await resolveScope({ regiaoId: 33 })).response?.status).toBe(403);
  expect(getAccessibleRegionIdsForUser).not.toHaveBeenCalled();
});
it('denies missing grants instead of widening to the organization', async () => {
  (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue([]);
  expect((await resolveScope()).response?.status).toBe(403);
});
it('defaults a viewer to an assigned region', async () => {
  expect(await resolveScope()).toMatchObject({ regiaoId: 11, response: null });
});
it('allows owners to use all regions in their organization', async () => {
  (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue(null);
  expect(await resolveScope()).toMatchObject({ regiaoId: null, tenantId: 'org-a', response: null });
});
it('allows superadmin to select another organization explicitly', async () => {
  (requireAuthWithTenant as jest.Mock).mockResolvedValue({ user: { id: 'u1', app_metadata: { is_superadmin: true } }, tenantId: 'org-a', response: null });
  (db.execute as jest.Mock).mockResolvedValue({ rows: [{ tenant_id: 'org-b' }] });
  (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue(null);
  expect(await resolveScope({ regiaoId: 33 })).toMatchObject({ tenantId: 'org-b', regiaoId: 33, response: null });
});

it.each(['1abc', '1.5', '0', '-1', '', '9007199254740992', '01'])(
  'rejects a malformed region ID: %s', (raw) => {
    expect(parseRegionIdInput(raw)).toEqual({ ok: false });
  },
);

it('distinguishes an absent region from a valid explicit region', () => {
  expect(parseRegionIdInput(undefined)).toEqual({ ok: true, id: null });
  expect(parseRegionIdInput('11')).toEqual({ ok: true, id: 11 });
});

it('rejects duplicate region IDs rather than choosing the first one', () => {
  expect(parseRegionIdInput(['11', '22'])).toEqual({ ok: false });
  expect(parseRegiaoIdParam(new URLSearchParams('regiao_id=11&regiao_id=22'))).toEqual({ ok: false });
});
