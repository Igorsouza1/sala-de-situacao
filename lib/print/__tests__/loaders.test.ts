import { loadPrintAcao, loadPrintPropriedade, loadPrintLayers } from '../loaders';
import { resolveScope } from '@/lib/api/scope';
import { getAcaoDossie } from '@/lib/service/acoesService';
import { findPropriedadeDossieData } from '@/lib/repositories/propriedadesRepository';
import { getAllLayers } from '@/lib/service/layerService';
import { getRegionIdsForUser } from '@/lib/api/require-region';
jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }));
jest.mock('@/lib/service/acoesService', () => ({ getAcaoDossie: jest.fn() }));
jest.mock('@/lib/repositories/propriedadesRepository', () => ({ findPropriedadeDossieData: jest.fn() }));
jest.mock('@/lib/service/layerService', () => ({ getAllLayers: jest.fn() }));
jest.mock('@/lib/api/require-region', () => ({ getRegionIdsForUser: jest.fn() }));
jest.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND'); },
  redirect: () => { throw new Error('NEXT_REDIRECT'); },
}));
beforeEach(() => {
  jest.clearAllMocks();
  (resolveScope as jest.Mock).mockResolvedValue({ user: { id: 'user' }, tenantId: 'org-a', regiaoId: 7, response: null });
  (getRegionIdsForUser as jest.Mock).mockResolvedValue([7, 8]);
});
it('turns another organization action into 404', async () => {
  (getAcaoDossie as jest.Mock).mockRejectedValue(new Error('Ação não encontrada'));
  await expect(loadPrintAcao(2)).rejects.toThrow('NEXT_NOT_FOUND');
  expect(getAcaoDossie).toHaveBeenCalledWith(2, 'org-a');
});
it('prints an action in its own organization', async () => {
  (getAcaoDossie as jest.Mock).mockResolvedValue({ id: 1 });
  expect(await loadPrintAcao(1)).toEqual({ id: 1 });
});
it('turns a property outside user regions into 404', async () => {
  (findPropriedadeDossieData as jest.Mock).mockResolvedValue(undefined);
  await expect(loadPrintPropriedade(3)).rejects.toThrow('NEXT_NOT_FOUND');
  expect(findPropriedadeDossieData).toHaveBeenCalledWith(3, 'org-a', [7, 8]);
});
it('loads map layers with the resolved organization and region', async () => {
  (getAllLayers as jest.Mock).mockResolvedValue([]);
  expect(await loadPrintLayers()).toEqual([]);
  expect(getAllLayers).toHaveBeenCalledWith('org-a', undefined, undefined, undefined, undefined, 7);
});
it('redirects an anonymous print request before reading data', async () => {
  (resolveScope as jest.Mock).mockResolvedValue({ response: new Response(null, { status: 401 }) });
  await expect(loadPrintAcao(1)).rejects.toThrow('NEXT_REDIRECT');
  expect(getAcaoDossie).not.toHaveBeenCalled();
});
it('denies users without a resolvable tenant', async () => {
  (resolveScope as jest.Mock).mockResolvedValue({ response: new Response(null, { status: 403 }) });
  await expect(loadPrintLayers()).rejects.toThrow('NEXT_NOT_FOUND');
  expect(getAllLayers).not.toHaveBeenCalled();
});
