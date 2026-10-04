import { resolveScope } from '@/lib/api/scope';
import { getAccessibleRegionIdsForUser } from '@/lib/api/require-region';
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
  const { tenantId, user } = await requirePrintScope();
  const regionIds = await getAccessibleRegionIdsForUser(user.id, tenantId, user.app_metadata?.is_superadmin === true);
  if (regionIds?.length === 0) notFound();
  let data;
  try {
    data = await getAcaoDossie(id, tenantId, regionIds);
  } catch (error) {
    if (error instanceof Error && error.message === 'Ação não encontrada') notFound();
    throw error;
  }
  if (!data) notFound();
  return data;
}
export async function loadPrintPropriedade(id: number) {
  const { tenantId, user } = await requirePrintScope();
  const regionIds = await getAccessibleRegionIdsForUser(user.id, tenantId, user.app_metadata?.is_superadmin === true);
  if (regionIds?.length === 0) notFound();
  const data = await findPropriedadeDossieData(id, tenantId, regionIds ?? undefined);
  if (!data) notFound();
  return data;
}
export async function loadPrintLayers(startDate?: Date, endDate?: Date) {
  const { tenantId, regiaoId, user } = await requirePrintScope();
  const regionIds = await getAccessibleRegionIdsForUser(user.id, tenantId, user.app_metadata?.is_superadmin === true);
  if (regionIds?.length === 0) notFound();
  const regionId = regionIds == null ? undefined
    : regiaoId != null && regionIds.includes(regiaoId) ? regiaoId : regionIds[0];
  return getAllLayers(tenantId, startDate, endDate, undefined, undefined, regionId);
}
