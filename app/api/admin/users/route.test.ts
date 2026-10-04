import { GET } from './route';
import { requireSuperadmin } from '@/lib/api/require-auth';
import { listUserAccess } from '@/lib/service/userManagementService';

jest.mock('@/lib/api/require-auth', () => ({ requireSuperadmin: jest.fn() }));
jest.mock('@/lib/service/userManagementService', () => ({ listUserAccess: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('does not enumerate login accounts for a non-superadmin', async () => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: new Response(null, { status: 403 }) } as never);
  expect((await GET()).status).toBe(403);
  expect(listUserAccess).not.toHaveBeenCalled();
});

it('includes an account without a current role for the admin panel', async () => {
  jest.mocked(requireSuperadmin).mockResolvedValue({ response: null } as never);
  jest.mocked(listUserAccess).mockResolvedValue([{ userId: 'u1', email: 'u@example.com', roleId: null, status: 'no_access' }] as never);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ data: [{ userId: 'u1', roleId: null, status: 'no_access' }] });
});
