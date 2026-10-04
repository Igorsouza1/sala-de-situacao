import { resolveScope } from '@/lib/api/scope';
import { getRegionIdsForUser } from '@/lib/api/require-region';
import { getAcaoDossie } from '@/lib/service/acoesService';
import { findPropriedadeDossieData } from '@/lib/repositories/propriedadesRepository';
import { getAllLayers } from '@/lib/service/layerService';
import { notFound, redirect } from 'next/navigation';

async function requirePrintScope() {
  const scope = await resolveScope();
  if (scope.response) {
    if (scope.response.status === 401) redirect('/sign-in');
    notFound();
  }
  return scope;
}
export async function loadPrintAcao(id: number) {
  const { tenantId } = await requirePrintScope();
  let data;
  try {
    data = await getAcaoDossie(id, tenantId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Ação não encontrada') notFound();
    throw error;
  }
  return data;
}
export async function loadPrintPropriedade(id: number) {
  const { tenantId, user } = await requirePrintScope();
  const regionIds = await getRegionIdsForUser(user.id, tenantId);
  const data = await findPropriedadeDossieData(id, tenantId, regionIds.length ? regionIds : undefined);
  if (!data) notFound();
  return data;
}
export async function loadPrintLayers(startDate?: Date, endDate?: Date) {
  const { tenantId, regiaoId } = await requirePrintScope();
  return getAllLayers(tenantId, startDate, endDate, undefined, undefined, regiaoId ?? undefined);
}
