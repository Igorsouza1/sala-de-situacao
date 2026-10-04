jest.mock('@/lib/api/require-auth', () => ({ requireRole: jest.fn() }));
jest.mock('@/lib/api/require-region', () => ({ getAccessibleRegionIdsForUser: jest.fn() }));
jest.mock('@/lib/api/scope', () => ({ getTenantIdForRegion: jest.fn() }));
jest.mock('@/lib/repositories/acoesRepository', () => ({ findAcaoById: jest.fn(), addAcaoImageById: jest.fn() }));
jest.mock('@/lib/service/acoesService', () => ({ addAcaoUpdate: jest.fn(), deleteAcaoItemHistoryById: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
import { POST as update, DELETE as remove } from '@/app/api/acoes/[id]/updates/route';
import { POST as photo } from '@/app/api/acoes/[id]/upload-photo/route';
import { POST as signedUrl } from '@/app/api/acoes/[id]/upload-url/route';
import { requireRole } from '../require-auth';
import { getAccessibleRegionIdsForUser } from '../require-region';
import { getTenantIdForRegion } from '../scope';
import { findAcaoById, addAcaoImageById } from '@/lib/repositories/acoesRepository';
import { addAcaoUpdate, deleteAcaoItemHistoryById } from '@/lib/service/acoesService';
import { createAdminClient } from '@/lib/supabase/admin';
const upload = jest.fn(); const createSignedUploadUrl = jest.fn();
const context = { params: Promise.resolve({ id: '5' }) };
function request() {
  const req = new Request('http://localhost/api/acoes/5/updates?updateId=7', {
    method: 'POST', body: JSON.stringify({ descricao: 'update', fileName: 'photo.png', contentType: 'image/png' }),
  });
  req.formData = jest.fn().mockResolvedValue({ get: (key: string) => key === 'file' ? {
    name: 'photo.png', type: 'image/png', size: 3, arrayBuffer: async () => new Uint8Array([1,2,3]).buffer,
  } : 'description' });
  return req;
}
beforeEach(() => {
  jest.resetAllMocks();
  (requireRole as jest.Mock).mockResolvedValue({ user: { id: 'user-a', app_metadata: {} }, tenantId: 'org-a', response: null });
  (findAcaoById as jest.Mock).mockResolvedValue({ id: 5, regiao_id: 11 });
  (getTenantIdForRegion as jest.Mock).mockResolvedValue('org-a');
  (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue([11]);
  (deleteAcaoItemHistoryById as jest.Mock).mockResolvedValue([{ id: 7 }]);
  upload.mockResolvedValue({ error: null });
  createSignedUploadUrl.mockResolvedValue({ data: { signedUrl: 'https://storage/upload' }, error: null });
  (createAdminClient as jest.Mock).mockReturnValue({ storage: { from: () => ({ upload, createSignedUploadUrl }) } });
});
function noMutation() {
  expect(addAcaoUpdate).not.toHaveBeenCalled(); expect(deleteAcaoItemHistoryById).not.toHaveBeenCalled();
  expect(addAcaoImageById).not.toHaveBeenCalled(); expect(createAdminClient).not.toHaveBeenCalled();
}
describe.each([{name:'update POST',handler:update},{name:'update DELETE',handler:remove},{name:'photo POST',handler:photo},{name:'signed URL POST',handler:signedUrl}])('$name',({handler})=> {
  test.each([401,403])('rejects authentication/role failure %s before action or mutation',async status=> {
    (requireRole as jest.Mock).mockResolvedValue({response:new Response(null,{status})});
    expect((await handler(request(),context)).status).toBe(status);
    expect(findAcaoById).not.toHaveBeenCalled(); noMutation();
  });
  it('hides an action belonging to another organization',async()=> {
    (findAcaoById as jest.Mock).mockResolvedValue(undefined);
    expect((await handler(request(),context)).status).toBe(404);
    expect(findAcaoById).toHaveBeenCalledWith(5,'org-a'); noMutation();
  });
  it('rejects a region in the same organization without user grants',async()=> {
    (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue([12]);
    expect((await handler(request(),context)).status).toBe(403); noMutation();
  });
  it('rejects an action whose region belongs to another organization',async()=> {
    (getTenantIdForRegion as jest.Mock).mockResolvedValue('org-b');
    expect((await handler(request(),context)).status).toBe(403); noMutation();
  });
  it('rejects a viewer without regional assignments',async()=> {
    (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue([]);
    expect((await handler(request(),context)).status).toBe(403); noMutation();
  });
  it('accepts an editor in the assigned region',async()=> {
    expect((await handler(request(),context)).status).toBe(200);
    expect(requireRole).toHaveBeenCalledWith('editor');
    expect(getAccessibleRegionIdsForUser).toHaveBeenCalledWith('user-a','org-a',false);
  });
  it('accepts organization owners with all-region access',async()=> {
    (getAccessibleRegionIdsForUser as jest.Mock).mockResolvedValue(null);
    expect((await handler(request(),context)).status).toBe(200);
  });
});
it('update mutations target the authorized action and history entry',async()=> {
  await update(request(),context);
  expect(addAcaoUpdate).toHaveBeenCalledWith(5,expect.objectContaining({descricao:'update'}));
  await remove(request(),context);
  expect(deleteAcaoItemHistoryById).toHaveBeenCalledWith(5,7);
});
it('photo upload writes storage and image record only after authorization',async()=> {
  await photo(request(),context);
  expect(upload).toHaveBeenCalledTimes(1);
  expect(addAcaoImageById).toHaveBeenCalledWith(5,expect.stringContaining('/acoes/5/'),'description',expect.any(Date));
});
