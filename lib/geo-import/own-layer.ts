import type { User } from "@supabase/supabase-js";
import { findLayerEntryBySlug } from "@/lib/repositories/layerRepository";
import { DROP_IMPORT_SOURCE } from "./layer-config";

/**
 * A camada que a importação pode gravar ou desfazer: precisa existir, ter nascido de um arquivo solto no mapa
 * e ser da Organização de quem pede (Superadmin passa por todas).
 */
export async function findImportedLayer(slug: string, user: User, tenantId: string) {
  const layer = await findLayerEntryBySlug(slug);
  if (!layer) return null;
  if ((layer.schemaConfig as { source?: string } | null)?.source !== DROP_IMPORT_SOURCE) return null;
  if (layer.tenantId !== tenantId && user.app_metadata?.is_superadmin !== true) return null;
  return layer;
}
