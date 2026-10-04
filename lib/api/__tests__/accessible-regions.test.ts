import { getAccessibleRegionIdsForUser } from '../require-region';
import { db } from '@/db';
jest.mock('@/db', () => ({ db: { execute: jest.fn() } }));
beforeEach(() => jest.resetAllMocks());
it('owner has all regions in the resolved organization', async () => {
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ ok: true }] });
  expect(await getAccessibleRegionIdsForUser('user', 'org-a')).toBeNull();
});
it('a non-owner without regional assignments has zero regions', async () => {
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  expect(await getAccessibleRegionIdsForUser('user', 'org-a')).toEqual([]);
});
it('keeps every assigned region for a non-owner', async () => {
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ ok: false }] })
    .mockResolvedValueOnce({ rows: [{ region_id: 7 }, { region_id: 8 }] });
  expect(await getAccessibleRegionIdsForUser('user', 'org-a')).toEqual([7, 8]);
});
it('superadmin uses organization scope without requiring role rows', async () => {
  expect(await getAccessibleRegionIdsForUser('user', 'org-a', true)).toBeNull();
  expect(db.execute).not.toHaveBeenCalled();
});
