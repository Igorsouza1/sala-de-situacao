'use client'

const CATEGORIA_ACCENT: Record<string, string> = {
  'Fiscalização':   '#ef4444',
  'Recuperação':    '#22c55e',
  'Monitoramento':  '#3b82f6',
  'Incidente':      '#f97316',
  'Infraestrutura': '#64748b',
}

const STATUS_COLOR: Record<string, string> = {
  'Identificado':   '#1d6dcc',
  'Em Recuperação': '#b45309',
  'Concluído':      '#15803d',
}

const STATUS_BG: Record<string, string> = {
  'Identificado':   'rgba(29,109,204,0.08)',
  'Em Recuperação': 'rgba(180,83,9,0.08)',
  'Concluído':      'rgba(21,128,61,0.08)',
}

const resolveCaraterColor = (carater?: string): string => {
  if (!carater) return '#6e6e73'
  const v = carater.toLowerCase()
  if (v.includes('ativo') && !v.includes('in')) return '#15803d'
  if (v.includes('passivo') || v.includes('inativo')) return '#b45309'
  return '#6e6e73'
}

interface Props {
  properties: Record<string, any>
}

function FieldRow({ label, value, valueColor }: { label: string; value?: string; valueColor?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-3">
      <span style={{ fontSize: 11, color: '#7a7a7a', whiteSpace: 'nowrap', paddingTop: 1 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: valueColor || '#1d1d1f',
          fontWeight: valueColor ? 600 : 500,
          textAlign: 'right',
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  )
}

export function AcaoHoverCard({ properties }: Props) {
  const name          = properties.name || properties.acao || '—'
  const tipo          = properties.tipo as string | undefined
  const status        = properties.status as string | undefined
  const tipoTec       = properties.tipo_tecnico as string | undefined
  const carater       = properties.carater as string | undefined
  const categoria     = properties.categoria as string | undefined
  const rawTime       = properties.time as string | undefined
  const timeFormatado = properties.time_formatado as string | undefined

  const accentColor  = CATEGORIA_ACCENT[categoria ?? ''] ?? '#3b82f6'
  const statusColor  = STATUS_COLOR[status ?? '']
  const statusBg     = STATUS_BG[status ?? ''] ?? 'rgba(0,0,0,0.05)'
  const caraterColor = resolveCaraterColor(carater)

  // Formata data no formato dd/mm/aaaa
  let dataExibicao: string | undefined = undefined
  if (timeFormatado) {
    const parts = timeFormatado.split(' ')
    if (parts[0] && parts[0].includes('/')) {
      dataExibicao = parts[0]
    }
  }
  if (!dataExibicao && rawTime) {
    try {
      const match = rawTime.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (match) {
        dataExibicao = `${match[3]}/${match[2]}/${match[1]}`
      } else {
        const date = new Date(rawTime)
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          dataExibicao = `${day}/${month}/${year}`
        }
      }
    } catch {}
  }

  return (
    <div
      className="rounded-[18px] overflow-hidden select-none pointer-events-none"
      style={{
        width: 240,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        fontFamily: "system-ui, -apple-system, 'Inter', sans-serif",
      }}
    >
      {/* Acento superior — categoria color, 3px */}
      <div style={{ height: 3, backgroundColor: accentColor }} />

      <div style={{ padding: '13px 16px 15px' }}>
        {/* Nome */}
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1d1d1f',
            letterSpacing: '-0.374px',
            lineHeight: 1.24,
            marginBottom: 3,
          }}
        >
          {name}
        </p>

        {/* Tipo */}
        {tipo && (
          <p
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#6e6e73',
              letterSpacing: '-0.12px',
              lineHeight: 1.4,
              marginBottom: 10,
            }}
          >
            {tipo}
          </p>
        )}

        {/* Status badge */}
        {status && (
          <div style={{ marginBottom: 11 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 9999,
                paddingLeft: 9,
                paddingRight: 9,
                paddingTop: 3,
                paddingBottom: 3,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '-0.08px',
                color: statusColor ?? '#6e6e73',
                backgroundColor: statusBg,
              }}
            >
              {status}
            </span>
          </div>
        )}

        {/* Hairline */}
        {(tipoTec || carater || dataExibicao) && (
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', marginBottom: 10 }} />
        )}

        {/* Campos secundários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldRow label="Data"         value={dataExibicao} />
          <FieldRow label="Tipo Técnico" value={tipoTec} />
          <FieldRow label="Caráter"      value={carater} valueColor={caraterColor} />
        </div>
      </div>
    </div>
  )
}
