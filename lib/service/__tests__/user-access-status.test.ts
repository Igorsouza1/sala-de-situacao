jest.mock('@/lib/repositories/userManagementRepository', () => ({ listUserAccessInDb: jest.fn() }));
import { listUserAccessInDb } from '@/lib/repositories/userManagementRepository';
import { listUserAccess } from '../userManagementService';

const account = (overrides: Record<string, unknown>) => ({
  roleId: 1, userId: 'user-1', email: 'user@example.com', role: 'viewer',
  tenantId: 'org-a', organizationName: 'Org A', regionId: 11, regionName: 'Região A',
  createdAt: '2026-10-04', invitedAt: null, emailConfirmedAt: '2026-10-04',
  lastSignInAt: null, isSuperadmin: false, ...overrides,
});

it('marks a login without current roles as lacking access even with a confirmed email', async () => {
  jest.mocked(listUserAccessInDb).mockResolvedValue([account({ roleId: null, role: null, tenantId: null, organizationName: null, regionId: null })]);
  expect((await listUserAccess())[0].status).toBe('no_access');
});

it('marks non-owner assignments without a region as needing attention', async () => {
  jest.mocked(listUserAccessInDb).mockResolvedValue([account({ regionId: null, regionName: null })]);
  expect((await listUserAccess())[0].status).toBe('no_region');
});

it('keeps owner and superadmin access distinct from missing regional grants', async () => {
  jest.mocked(listUserAccessInDb).mockResolvedValue([
    account({ role: 'owner', regionId: null, regionName: null }),
    account({ roleId: null, role: null, tenantId: null, isSuperadmin: true }),
  ]);
  expect((await listUserAccess()).map((row) => row.status)).toEqual(['active', 'superadmin']);
});
