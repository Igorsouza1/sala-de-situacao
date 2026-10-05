jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NOT_FOUND'); }),
  redirect: jest.fn(() => { throw new Error('REDIRECT'); }),
}));
jest.mock('@/app/protected/client-page', () => ({ __esModule: true, default: () => null }));

import Page from './page';
import { resolveScope } from '@/lib/api/scope';
import { notFound, redirect } from 'next/navigation';

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(resolveScope).mockResolvedValue({
    user: { id: 'user-a' }, tenantId: 'org-a', regiaoId: 11, response: null,
  } as never);
});

it('blocks a user who changes the URL to an unassigned region', async () => {
  jest.mocked(resolveScope).mockResolvedValue({
    user: null, tenantId: null, regiaoId: null, response: new Response(null, { status: 403 }),
  });
  await expect(Page({ searchParams: Promise.resolve({ regiao_id: '22' }) })).rejects.toThrow('NOT_FOUND');
  expect(resolveScope).toHaveBeenCalledWith({ regiaoId: 22 });
  expect(notFound).toHaveBeenCalled();
});

it('does not render the map when the account has no regional grants', async () => {
  jest.mocked(resolveScope).mockResolvedValue({
    user: null, tenantId: null, regiaoId: null, response: new Response(null, { status: 403 }),
  });
  await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow('NOT_FOUND');
  expect(resolveScope).toHaveBeenCalledWith({ regiaoId: null });
});

it('does not render a malformed or duplicate region ID', async () => {
  for (const raw of ['11oops', ['11', '22'], '0', '9007199254740992']) {
    await expect(Page({ searchParams: Promise.resolve({ regiao_id: raw }) })).rejects.toThrow('NOT_FOUND');
  }
  expect(resolveScope).not.toHaveBeenCalled();
});

it('renders an authorized region and checks access when no ID was supplied', async () => {
  const selected = await Page({ searchParams: Promise.resolve({ regiao_id: '11' }) });
  expect(resolveScope).toHaveBeenCalledWith({ regiaoId: 11 });
  expect(selected.props.children.props.regiaoId).toBe(11);

  await Page({ searchParams: Promise.resolve({}) });
  expect(resolveScope).toHaveBeenCalledWith({ regiaoId: null });
});

it('sends an unauthenticated visitor to sign-in', async () => {
  jest.mocked(resolveScope).mockResolvedValue({
    user: null, tenantId: null, regiaoId: null, response: new Response(null, { status: 401 }),
  });
  await expect(Page({ searchParams: Promise.resolve({ regiao_id: '11' }) })).rejects.toThrow('REDIRECT');
  expect(redirect).toHaveBeenCalledWith('/sign-in');
});
