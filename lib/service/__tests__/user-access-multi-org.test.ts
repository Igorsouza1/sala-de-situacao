jest.mock('@/lib/repositories/userManagementRepository', () => ({
  findAuthUserByEmailInDb: jest.fn(),
  getRegionTenantsInDb: jest.fn(),
  tenantExistsInDb: jest.fn(),
  insertRoleAssignmentsInDb: jest.fn(),
  ensureLegacyUserAccessInDb: jest.fn(),
  getTenantNameInDb: jest.fn(),
  getRegionNamesInDb: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => ({})) }));
jest.mock('@/lib/email/resend', () => ({
  sendEmail: jest.fn(),
  buildInviteEmail: jest.fn(() => ({ subject: 's', html: 'h' })),
  buildAccessGrantedEmail: jest.fn(() => ({ subject: 's', html: 'h' })),
}));
import * as repo from '@/lib/repositories/userManagementRepository';
import { buildAccessGrantedEmail } from '@/lib/email/resend';
import { createUserAccess, grantsFor } from '../userManagementService';

const m = jest.mocked(repo);
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_BASE_URL = 'https://prisma.test';
  m.getRegionTenantsInDb.mockResolvedValue([{ id: 1, tenantId: 'org-a' }, { id: 2, tenantId: 'org-b' }]);
  m.findAuthUserByEmailInDb.mockResolvedValue({ id: 'u1', email: 'a@x.com', emailConfirmedAt: '2026-01-01' });
  m.insertRoleAssignmentsInDb.mockImplementation(async (i) => i.regionIds.map((regionId, k) => ({ id: k + 1, regionId })));
  m.getTenantNameInDb.mockImplementation(async (id) => (id === 'org-a' ? 'Instituto Homem Pantaneiro' : 'Rede Amolar'));
  m.getRegionNamesInDb.mockResolvedValue(['Bonito e Rio da Prata', 'Serra do Amolar']);
});

it('regiões de duas organizações viram um papel em cada uma', async () => {
  expect(await grantsFor({ email: 'a@x.com', role: 'viewer', regionIds: [1, 2, 2] })).toEqual([
    { tenantId: 'org-a', regionIds: [1] },
    { tenantId: 'org-b', regionIds: [2] },
  ]);
});

it('região inexistente recusa o pedido inteiro, sem criar nada', async () => {
  m.getRegionTenantsInDb.mockResolvedValue([{ id: 1, tenantId: 'org-a' }]);
  await expect(createUserAccess({ email: 'a@x.com', role: 'viewer', regionIds: [1, 99] })).rejects.toMatchObject({ status: 404 });
  expect(m.insertRoleAssignmentsInDb).not.toHaveBeenCalled();
});

it('owner continua sendo de uma organização inteira', async () => {
  m.tenantExistsInDb.mockResolvedValue(true);
  expect(await grantsFor({ email: 'a@x.com', role: 'owner', tenantId: 'org-b', regionIds: [] })).toEqual([{ tenantId: 'org-b', regionIds: [] }]);
});

it('cria os papéis nas duas organizações e manda um aviso só, com as duas', async () => {
  const r = await createUserAccess({ email: 'a@x.com', role: 'viewer', regionIds: [1, 2] });
  expect(r).toMatchObject({ createdAssignments: 2, alreadyGranted: false, mode: 'notified' });
  expect(m.insertRoleAssignmentsInDb).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'org-a', regionIds: [1] }));
  expect(m.insertRoleAssignmentsInDb).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'org-b', regionIds: [2] }));
  expect(m.ensureLegacyUserAccessInDb).toHaveBeenCalledTimes(2);
  expect(buildAccessGrantedEmail).toHaveBeenCalledTimes(1);
  expect(buildAccessGrantedEmail).toHaveBeenCalledWith(expect.objectContaining({ organizationName: 'Instituto Homem Pantaneiro e Rede Amolar' }));
});

it('quem já tinha tudo: nada novo, nenhum email', async () => {
  m.insertRoleAssignmentsInDb.mockResolvedValue([]);
  expect(await createUserAccess({ email: 'a@x.com', role: 'viewer', regionIds: [1, 2] })).toMatchObject({ alreadyGranted: true });
  expect(buildAccessGrantedEmail).not.toHaveBeenCalled();
});
