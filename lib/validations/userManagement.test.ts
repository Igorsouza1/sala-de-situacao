import { createUserAccessSchema, updateUserAccessSchema } from './userManagement';

const tenantId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

it('requires an assigned region for editor, viewer, and auditor', () => {
  for (const role of ['editor', 'viewer', 'auditor']) {
    expect(createUserAccessSchema.safeParse({ email: 'a@example.com', tenantId, role, regionIds: [] }).success).toBe(false);
    expect(updateUserAccessSchema.safeParse({ role, regionId: null }).success).toBe(false);
  }
});

it('allows organization-wide access only for owner', () => {
  expect(createUserAccessSchema.safeParse({ email: 'a@example.com', tenantId, role: 'owner', regionIds: [] }).success).toBe(true);
  expect(updateUserAccessSchema.safeParse({ role: 'owner', regionId: null }).success).toBe(true);
  expect(createUserAccessSchema.safeParse({ email: 'a@example.com', tenantId, role: 'owner', regionIds: [11] }).success).toBe(false);
});

it('accepts an explicit region for a limited role', () => {
  expect(createUserAccessSchema.safeParse({ email: 'a@example.com', tenantId, role: 'editor', regionIds: [11] }).success).toBe(true);
  expect(updateUserAccessSchema.safeParse({ role: 'viewer', regionId: 11 }).success).toBe(true);
});
