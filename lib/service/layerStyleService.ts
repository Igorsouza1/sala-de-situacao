import { z } from 'zod'
import { findLayerEntryBySlug, updateLayerEntry } from '@/lib/repositories/layerRepository'
import { LAYER_CATEGORIES, applyEdit, hasIconRule, isHexColor, layerShape, type LayerEdit } from '@/lib/layer-style'

// Edição da aparência de uma camada do catálogo (DESIGN.md 13.3). O `slug` nunca muda: o código decide comportamento por ele.

const hex = z.string().refine(isHexColor, 'Cor inválida: use #rgb ou #rrggbb.')

export const layerEditSchema = z.object({
  // sem espaços nas pontas: "Municipio de Bonito " existe no banco hoje
  name: z.string().trim().min(1, 'O nome não pode ficar vazio.').max(60, 'O nome pode ter até 60 caracteres.'),
  category: z.enum(LAYER_CATEGORIES),
  defaultVisibility: z.boolean(),
  style: z.object({
    shape: z.enum(['fill', 'line', 'circle', 'icon', 'other']),
    color: hex,
    fillColor: hex,
    fillOpacity: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1),
    weight: z.number().min(0).max(20),
    radius: z.number().min(1).max(60),
    iconName: z.string().regex(/^[a-z0-9-]{1,40}$/, 'Ícone inválido.').optional(),
  }),
  // ícone de cada área (ex.: cada eixo temático de Ações): a chave é o valor que o mapa compara, o valor é o nome do ícone
  ruleIcons: z
    .record(z.string().trim().min(1).max(80), z.string().regex(/^[a-z0-9-]{1,40}$/, 'Ícone inválido.'))
    .refine((r) => Object.keys(r).length <= 100, 'Áreas demais para editar de uma vez.')
    .optional(),
})

export class LayerEditError extends Error {
  constructor(public status: 400 | 403 | 404, message: string) {
    super(message)
  }
}

interface Actor {
  tenantId: string
  isSuperadmin: boolean
}

// O tipo da camada só pode ser o que ela já é. Exceção: camada sem tipo explícito (o mapa decide pela geometria dos dados),
// em que o editor, que vê os dados, sabe mais do que o catálogo.
function hasExplicitShape(vc: any): boolean {
  return !!(vc?.maplibre?.type || vc?.baseStyle?.type || vc?.mapMarker?.type || vc?.type)
}

export async function updateLayerEdit(slug: string, edit: LayerEdit, actor: Actor) {
  const entry = await findLayerEntryBySlug(slug)
  if (!entry) throw new LayerEditError(404, 'Camada não encontrada.')

  if (!actor.isSuperadmin) {
    // camada de outra organização não existe para quem não é dela; camada global só o superadmin edita
    if (entry.tenantId && entry.tenantId !== actor.tenantId) throw new LayerEditError(404, 'Camada não encontrada.')
    if (!entry.tenantId || entry.scope === 'global') throw new LayerEditError(403, 'Só o superadmin edita camadas globais.')
  }

  const vc = (entry.visualConfig ?? {}) as Record<string, any>
  if (hasExplicitShape(vc) && layerShape(vc) !== edit.style.shape) {
    throw new LayerEditError(400, 'O tipo da camada não pode ser trocado por aqui.')
  }

  // ícone por área só existe onde há regra por valor; do contrário o pedido seria gravado e o mapa nunca o leria
  if (edit.ruleIcons && Object.keys(edit.ruleIcons).length > 0 && !hasIconRule(vc)) {
    throw new LayerEditError(400, 'Esta camada não tem ícone por área para editar.')
  }

  const visualConfig = applyEdit(vc, edit)
  const saved = await updateLayerEntry(entry.id, { name: edit.name, visualConfig })
  if (!saved) throw new LayerEditError(404, 'Camada não encontrada.')
  return { slug: entry.slug, name: edit.name, visualConfig }
}
