import {
  createOrganizationInDb, createRegionInDb,
  deleteOrganizationInDb,
  deleteRegionInDb,
  getRegionByIdInDb,
  listOrganizationsInDb,
  listRegionsInDb,
  updateOrganizationInDb,
  updateRegionInDb,
  updateRegionMetadataInDb,
} from "@/lib/repositories/adminRepository";
import { OrganizationPayload, RegionPayload } from "@/lib/validations/admin";

export async function listOrganizations() {
  return listOrganizationsInDb();
}

export async function createOrganization(payload: OrganizationPayload) {
  return createOrganizationInDb(payload);
}

export async function updateOrganization(id: string, payload: OrganizationPayload) {
  return updateOrganizationInDb(id, payload);
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

export async function createRegion(payload: RegionPayload) {
  return createRegionInDb({
    nome: payload.nome,
    organizationId: payload.organizationId,
    geojson: JSON.stringify(payload.geometry),
  });
}

export async function updateRegion(id: number, payload: RegionPayload) {
  return updateRegionInDb(id, {
    nome: payload.nome,
    organizationId: payload.organizationId,
    geojson: JSON.stringify(payload.geometry),
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
