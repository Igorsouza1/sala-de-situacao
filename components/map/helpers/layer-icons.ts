import type { Icon } from '@tabler/icons-react'
import {
  IconActivity, IconAlertCircle, IconAlertOctagon, IconAlertTriangle, IconCamera, IconDroplet, IconEye, IconFeather, IconFish,
  IconFlag, IconFlame, IconHammer, IconHome, IconLeaf, IconMapPin, IconMountain, IconPaw, IconPlant2, IconShield, IconTag, IconTent,
  IconTrees, IconWaveSine,
} from '@tabler/icons-react'

// Os ícones das camadas e das áreas (DESIGN.md 11 e 13.6): Tabler, de traço firme, num conjunto curado de silhuetas bem diferentes
// entre si, para a área se distinguir de relance. O catálogo guarda o NOME em kebab-case (hoje herdado do Lucide: "map-pin",
// "sprout"…); este mapa traduz o nome para o desenho, sem mexer nos dados salvos. Nome desconhecido cai no pino, e o teste
// garante que todo ícone que o editor oferece tem desenho.
export const LAYER_ICON_MAP: Record<string, Icon> = {
  'map-pin': IconMapPin,
  waves: IconWaveSine,
  wave: IconWaveSine,
  water: IconWaveSine,
  droplets: IconDroplet,
  flame: IconFlame,
  fire: IconFlame,
  sprout: IconPlant2,
  trees: IconTrees,
  mountain: IconMountain,
  'paw-print': IconPaw,
  activity: IconActivity,
  eye: IconEye,
  shield: IconShield,
  hammer: IconHammer,
  house: IconHome,
  flag: IconFlag,
  camera: IconCamera,
  fish: IconFish,
  bird: IconFeather,
  tent: IconTent,
  leaf: IconLeaf,
  tag: IconTag,
  'alert-triangle': IconAlertTriangle,
  'alert-octagon': IconAlertOctagon,
  'alert-circle': IconAlertCircle,
}

export const resolveLayerIcon = (name?: string | null): Icon => LAYER_ICON_MAP[(name ?? '').trim().toLowerCase()] ?? IconMapPin

/** traço dos ícones (DESIGN.md 11) */
export const ICON_STROKE = 1.75
