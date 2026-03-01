import {
  createOrganizationInDb,
  createRegionInDb,
  deleteOrganizationInDb,
  deleteRegionInDb,
  listOrganizationsInDb,
  listRegionsInDb,
  updateOrganizationInDb,
  updateRegionInDb,
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
