import { 
  ShieldAlert, 
  Sprout, 
  AlertTriangle, 
  Activity, 
  Construction,
  LucideIcon 
} from "lucide-react";

export type ActionCategory = 'Fiscalização' | 'Recuperação' | 'Incidente' | 'Monitoramento' | 'Infraestrutura';
export type ActionStatus = 'Ativo' | 'Monitorando' | 'Resolvido' | 'Crítico';

export interface CategoryConfig {
  color: string;
  icon: LucideIcon;
  label: string;
}

export interface StatusConfig {
  className: string;
  label: string;
}

export const ACTION_CATEGORIES: Record<ActionCategory, CategoryConfig> = {
  'Fiscalização': {
    color: '#ef4444', // red-500
    icon: ShieldAlert,
    label: 'Fiscalização'
  },
  'Recuperação': {
    color: '#22c55e', // green-500
    icon: Sprout,
    label: 'Recuperação'
  },
  'Incidente': {
    color: '#f97316', // orange-500
    icon: AlertTriangle,
    label: 'Incidente'
  },
  'Monitoramento': {
    color: '#3b82f6', // blue-500
    icon: Activity,
    label: 'Monitoramento'
  },
  'Infraestrutura': {
    color: '#64748b', // slate-500
    icon: Construction,
    label: 'Infraestrutura'
  }
};

export const STATUS_STYLES: Record<ActionStatus, StatusConfig & { color: string }> = {
  'Ativo': {
    className: 'border-2 border-blue-500 opacity-100',
    label: 'Ativo',
    color: '#3bf69fff' // blue-500
  },
  'Monitorando': {
    className: 'border-2 border-yellow-500 opacity-90',
    label: 'Monitorando',
    color: '#eab308' // yellow-500
  },
  'Resolvido': {
    className: 'border-2 border-green-500 opacity-60 grayscale',
    label: 'Resolvido',
    color: '#22c55e' // green-500
  },
  'Crítico': {
    className: 'border-2 border-red-600 animate-pulse',
    label: 'Crítico',
    color: '#dc2626' // red-600
  }
};

export interface GroupedActionType {
  id: string; // The 'tipo'
  label: string;
  count: number;
}

export interface GroupedActionCategory {
  id: ActionCategory; // The 'categoria'
  label: string;
  count: number;
  color: string;
  icon: LucideIcon;
  types: GroupedActionType[];
}
