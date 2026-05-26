import {
  createOrganizationInDb, createRegionInDb,
  deleteOrganizationInDb,
  deleteRegionInDb,
  getRegionByIdInDb,
  listOrganizationsInDb,
  listRegionsInDb,
  updateOrganizationInDb,
  updateRegionInDb,
  updateRegionInfoInDb,
  updateRegionMetadataInDb,
} from "@/lib/repositories/adminRepository";
import { OrganizationPayload, RegionPayload } from "@/lib/validations/admin";

export async function listOrganizations() {
  return listOrganizationsInDb();
}

export async function createOrganization(payload: OrganizationPayload) {
  return createOrganizationInDb({ name: payload.name, maxRegions: payload.maxRegions, slug: payload.slug });
}

export async function updateOrganization(id: string, payload: OrganizationPayload) {
  return updateOrganizationInDb(id, { name: payload.name, maxRegions: payload.maxRegions, slug: payload.slug });
}

export async function deleteOrganization(id: string) {
  return deleteOrganizationInDb(id);
}

export async function listRegions() {
  return listRegionsInDb();
}

export async function getRegionById(id: number) {
  return getRegionByIdInDb(id);
}

export async function getPropertiesByRegion(id: number) {
  const { getPropertiesByRegionInDb } = await import("@/lib/repositories/adminRepository");
  return getPropertiesByRegionInDb(id);
}

export async function getBaseLayersByRegion(id: number) {
  const { getBaseLayersByRegionInDb } = await import("@/lib/repositories/adminRepository");
  return getBaseLayersByRegionInDb(id);
}

export async function getFocosByRegion(id: number) {
  const { getFocosByRegionInDb } = await import("@/lib/repositories/adminRepository");
  return getFocosByRegionInDb(id);
}

export async function getDesmatamentoByRegion(id: number) {
  const { getDesmatamentoByRegionInDb } = await import("@/lib/repositories/adminRepository");
  return getDesmatamentoByRegionInDb(id);
}

export async function getAcoesByRegion(id: number) {
  const { getAcoesByRegionInDb } = await import("@/lib/repositories/adminRepository");
  return getAcoesByRegionInDb(id);
}

export async function createRegion(payload: RegionPayload) {
  if (!payload.geometry) throw new Error("geometry is required to create a region");
  return createRegionInDb({
    nome: payload.nome,
    descricao: payload.descricao,
    organizationId: payload.organizationId,
    geojson: JSON.stringify(payload.geometry),
  });
}

export async function updateRegion(id: number, payload: RegionPayload) {
  if (payload.geometry) {
    return updateRegionInDb(id, {
      nome: payload.nome,
      descricao: payload.descricao,
      organizationId: payload.organizationId,
      geojson: JSON.stringify(payload.geometry),
    });
  }
  return updateRegionInfoInDb(id, {
    nome: payload.nome,
    descricao: payload.descricao,
    organizationId: payload.organizationId,
  });
}

export async function deleteRegion(id: number) {
  return deleteRegionInDb(id);
}

export async function updateRegionMetadata(
  id: number,
  payload: { nome: string; organizationId: string }
) {
  return updateRegionMetadataInDb(id, payload);
}
