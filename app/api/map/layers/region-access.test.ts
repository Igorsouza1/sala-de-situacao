jest.mock('@/lib/api/scope', () => ({ resolveScope: jest.fn() }));
jest.mock('@/lib/service/layerService', () => ({ getAllLayers: jest.fn(), getLayer: jest.fn() }));

import { NextRequest } from 'next/server';
import { GET as listLayers } from './route';
import { GET as getLayer } from './[slug]/route';
import { resolveScope } from '@/lib/api/scope';
import { getAllLayers, getLayer as loadLayer } from '@/lib/service/layerService';

const routes = [
  { name: 'catalog', get: (query: string) => listLayers(new NextRequest(`http://localhost/api/map/layers${query}`)) },
  { name: 'layer', get: (query: string) => getLayer(new NextRequest(`http://localhost/api/map/layers/fogo${query}`), { params: Promise.resolve({ slug: 'fogo' }) }) },
];

beforeEach(() => jest.clearAllMocks());

describe.each(routes)('$name', ({ get }) => {
  it.each(['?regiao_id=11abc', '?regiao_id=11&regiao_id=22', '?regiao_id=0'])(
    'rejects malformed region override %s before authorization or data loading', async (query) => {
      expect((await get(query)).status).toBe(400);
      expect(resolveScope).not.toHaveBeenCalled();
      expect(getAllLayers).not.toHaveBeenCalled();
      expect(loadLayer).not.toHaveBeenCalled();
    },
  );

  it('does not load another region when authorization denies it', async () => {
    jest.mocked(resolveScope).mockResolvedValue({
      user: null, tenantId: null, regiaoId: null, response: new Response(null, { status: 403 }),
    });
    expect((await get('?regiao_id=22')).status).toBe(403);
    expect(resolveScope).toHaveBeenCalledWith({ regiaoId: 22 });
    expect(getAllLayers).not.toHaveBeenCalled();
    expect(loadLayer).not.toHaveBeenCalled();
  });
});
