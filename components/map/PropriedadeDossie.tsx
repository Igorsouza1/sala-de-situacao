"use client"

import { useEffect, useState } from "react"
import type { ComponentType } from "react"
import {
  Map as MapIcon,
  Tag,
  Flame,
  AlertTriangle,
  Printer,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
} from "lucide-react"
import dynamic from "next/dynamic"

const PropriedadeMap = dynamic(() => import("./PropriedadeMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f5f7",
      fontSize: 13, color: "#94a3b8",
    }}>
      Carregando mapa…
    </div>
  ),
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionData {
  id: number
  name: string
  categoria: string
  status: string
  date: string
  descricao: string
  tipo_tecnico?: string
  carater?: string
  latitude?: string
  longitude?: string
}

interface FocoData {
  id: number
  date: string
  latitude: number
  longitude: number
  frp?: number
}

interface DesmatamentoData {
  id: number
  date: string
  area: number
  latitude: number
  longitude: number
}

interface PropriedadeData {
  id: number
  nome: string
  cod_imovel: string
  municipio: string
  num_area: number
  properties?: any
  geojson: any
  centerLat: number
  centerLng: number
  acoes: ActionData[]
  focos: FocoData[]
  desmatamentos: DesmatamentoData[]
  focosCount: number
  desmatamentoCount: number
  desmatamentoArea: number
  areaQueimada: number
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const INK         = "#0f172a"
const MUTED       = "#64748b"
const VERY_MUTED  = "#94a3b8"
const ACCENT      = "#02483E"
const HAIRLINE    = "rgba(0,0,0,0.07)"
const SURFACE     = "#ffffff"
const SURFACE_ALT = "#f5f5f7"

const STATUS_MAP: Record<string, { label: string; color: string; Icon: ComponentType<any> }> = {
  AT: { label: "Ativo",     color: "#059669", Icon: CheckCircle2 },
  CA: { label: "Cancelado", color: "#dc2626", Icon: XCircle },
  PE: { label: "Pendente",  color: "#d97706", Icon: Clock },
  SU: { label: "Suspenso",  color: "#ea580c", Icon: AlertTriangle },
}

const TIPO_MAP: Record<string, string> = {
  IRU: "Imóvel Rural",
  IRB: "Imóvel Rural (Beneficiário)",
}

// ── Main component ────────────────────────────────────────────────────────────

export function PropriedadeDossie({ propriedadeId }: { propriedadeId: number }) {
  const [data, setData] = useState<PropriedadeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!propriedadeId) return
    setLoading(true)
    fetch(`/api/propriedades/${propriedadeId}/dossie`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data)
        else setError(json.error)
      })
      .catch(() => setError("Falha ao carregar dados"))
      .finally(() => setLoading(false))
  }, [propriedadeId])

  const handlePrint = () =>
    window.open(`/print/propriedade/${propriedadeId}`, "_blank")

  if (loading) return <LoadingSkeleton />
  if (error)   return <ErrorState message={error} />
  if (!data)   return null

  const acoesCount = data.acoes?.length ?? 0

  return (
    <div style={{ minWidth: 400 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section style={{ paddingBottom: 24, borderBottom: `1px solid ${HAIRLINE}`, marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Eyebrow */}
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
              color: VERY_MUTED, textTransform: "uppercase", marginBottom: 8,
            }}>
              Propriedade Rural
            </p>

            {/* Name */}
            <h2 style={{
              fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px",
              lineHeight: 1.15, color: INK, marginBottom: 12,
            }}>
              {data.nome || "Propriedade Sem Nome"}
            </h2>

            {/* Meta row — município + área */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 12px", marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: MUTED }}>{data.municipio}</span>
              <Dot />
              <span style={{ fontSize: 14, color: MUTED }}>{data.num_area?.toFixed(2)} ha</span>
            </div>

            {/* CAR — full code with copy button */}
            <CARField value={data.cod_imovel} />
          </div>

          {/* Print pill button */}
          <PillButton onClick={handlePrint} icon={Printer} label="Imprimir" />
        </div>
      </section>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <SectionLabel icon={MapIcon} label="Localização e Ocorrências" />
        <div style={{
          borderRadius: 14, border: `1px solid ${HAIRLINE}`,
          overflow: "hidden", height: 340, background: SURFACE_ALT,
        }}>
          <PropriedadeMap propriedadeGeoJson={data.geojson} acoes={data.acoes} />
        </div>
        <p style={{ fontSize: 11, color: VERY_MUTED, textAlign: "center", marginTop: 8, fontStyle: "italic" }}>
          Polígono conforme cadastro. Pontos indicam ações e ocorrências registradas.
        </p>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          border: `1px solid ${HAIRLINE}`, borderRadius: 14, overflow: "hidden",
        }}>
          <StatCell value={acoesCount} label="Ações" color={ACCENT} />
          <StatCell
            value={data.focosCount}
            label="Focos de Calor"
            color="#ef4444"
            sub={data.areaQueimada > 0 ? `${data.areaQueimada.toFixed(1)} ha` : undefined}
            bordered
          />
          <StatCell
            value={data.desmatamentoCount}
            label="Alertas Desmate"
            color="#f59e0b"
            sub={data.desmatamentoArea > 0 ? `${data.desmatamentoArea.toFixed(1)} ha` : undefined}
            bordered
          />
        </div>
      </section>

      {/* ── CAR data ───────────────────────────────────────────────────── */}
      {data.properties && Object.keys(data.properties).length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <SectionLabel icon={ClipboardList} label="Dados Cadastrais" />
          <CarDataTable properties={data.properties} />
        </section>
      )}

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: data.desmatamentos?.length || data.focos?.length ? 28 : 0 }}>
        <SectionLabel icon={Tag} label="Detalhamento das Ocorrências" />
        {acoesCount > 0 ? (
          <div style={{ borderRadius: 14, border: `1px solid ${HAIRLINE}`, overflow: "hidden" }}>
            {data.acoes.map((acao, i) => (
              <ActionRow key={acao.id} acao={acao} last={i === data.acoes.length - 1} />
            ))}
          </div>
        ) : (
          <EmptyPlaceholder message="Nenhuma ação registrada nesta propriedade." />
        )}
      </section>

      {/* ── Desmatamento ───────────────────────────────────────────────── */}
      {data.desmatamentos?.length > 0 && (
        <section style={{ marginBottom: data.focos?.length ? 28 : 0 }}>
          <SectionLabel icon={AlertTriangle} label="Histórico de Desmatamento" />
          <div style={{ borderRadius: 14, border: `1px solid ${HAIRLINE}`, overflow: "hidden" }}>
            {data.desmatamentos.map((item, i) => (
              <OccurrenceRow
                key={item.id}
                icon={AlertTriangle}
                accentColor="#f59e0b"
                title="Alerta de Desmatamento"
                badge="Monitoramento"
                fields={[
                  { label: "Área afetada",   value: `${item.area?.toFixed(2)} ha` },
                  { label: "Data detecção",  value: fmtDate(item.date) },
                ]}
                last={i === data.desmatamentos.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Focos ──────────────────────────────────────────────────────── */}
      {data.focos?.length > 0 && (
        <section>
          <SectionLabel
            icon={Flame}
            label="Histórico de Focos de Calor"
            badge={data.focosCount > 5 ? `${data.focos.length} de ${data.focosCount} exibidos` : undefined}
          />
          <div style={{ borderRadius: 14, border: `1px solid ${HAIRLINE}`, overflow: "hidden" }}>
            {data.focos.map((item, i) => (
              <OccurrenceRow
                key={item.id}
                icon={Flame}
                accentColor="#ef4444"
                title="Foco de Calor"
                badge="Satélite FIRMS"
                fields={[
                  { label: "Data detecção",   value: fmtDate(item.date) },
                  { label: "Intensidade FRP", value: item.frp ? `${item.frp.toFixed(1)} MW` : "—" },
                ]}
                last={i === data.focos.length - 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── CARField ──────────────────────────────────────────────────────────────────

function CARField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silent fail
    }
  }

  if (!value) return null

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: SURFACE_ALT, border: `1px solid ${HAIRLINE}`,
        borderRadius: 8, overflow: "hidden", flex: 1, minWidth: 0,
      }}>
        {/* Label */}
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: VERY_MUTED,
          padding: "5px 10px", borderRight: `1px solid ${HAIRLINE}`,
          flexShrink: 0, background: "rgba(0,0,0,0.03)",
        }}>
          CAR
        </span>
        {/* Full code */}
        <span style={{
          fontSize: 11, fontFamily: "ui-monospace, monospace",
          color: MUTED, padding: "5px 10px",
          overflowX: "auto", whiteSpace: "nowrap",
          flex: 1, letterSpacing: "0.02em",
        }}>
          {value}
        </span>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        title={copied ? "Copiado!" : "Copiar código CAR"}
        style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          border: `1px solid ${copied ? "#059669" : HAIRLINE}`,
          background: copied ? "rgba(5,150,105,0.08)" : SURFACE,
          color: copied ? "#059669" : MUTED,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transition: "all 200ms ease",
        }}
        onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.background = SURFACE_ALT; e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT } }}
        onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = HAIRLINE; e.currentTarget.style.color = MUTED } }}
        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.92)" }}
        onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)" }}
      >
        {copied
          ? <Check size={13} strokeWidth={2.5} />
          : <Copy size={13} strokeWidth={1.8} />
        }
      </button>
    </div>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Dot() {
  return (
    <span style={{
      width: 3, height: 3, borderRadius: "50%",
      background: HAIRLINE, display: "inline-block", verticalAlign: "middle",
    }} />
  )
}

function PillButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void
  icon: ComponentType<any>
  label: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)" }}
      onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)" }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 18px", borderRadius: 9999,
        border: `1px solid ${ACCENT}`,
        background: hovered ? ACCENT : "transparent",
        color: hovered ? "#fff" : ACCENT,
        fontSize: 13, fontWeight: 500,
        cursor: "pointer", flexShrink: 0,
        transition: "background 150ms ease, color 150ms ease, transform 100ms ease",
      }}
    >
      <Icon size={13} strokeWidth={2} />
      {label}
    </button>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
  badge,
}: {
  icon: ComponentType<any>
  label: string
  badge?: string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
      <Icon size={12} color={ACCENT} strokeWidth={2.5} />
      <span style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
        color: MUTED, textTransform: "uppercase",
      }}>
        {label}
      </span>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 500, color: VERY_MUTED,
          background: SURFACE_ALT, border: `1px solid ${HAIRLINE}`,
          borderRadius: 9999, padding: "2px 8px",
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

function StatCell({
  value,
  label,
  color,
  sub,
  bordered,
}: {
  value: number
  label: string
  color: string
  sub?: string
  bordered?: boolean
}) {
  return (
    <div style={{
      padding: "22px 14px", textAlign: "center", background: SURFACE,
      borderLeft: bordered ? `1px solid ${HAIRLINE}` : "none",
    }}>
      <div style={{
        fontSize: 36, fontWeight: 700, letterSpacing: "-0.6px",
        color, lineHeight: 1, marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 600, letterSpacing: "0.06em",
        color: VERY_MUTED, textTransform: "uppercase",
      }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}

// ── CAR data table ────────────────────────────────────────────────────────────

function CarDataTable({ properties: p }: { properties: any }) {
  const statusKey = (p.ind_status ?? "").toUpperCase()
  const statusEntry = STATUS_MAP[statusKey] ?? null
  const StatusIcon = statusEntry?.Icon

  const rows: { label: string; value: string; mono?: boolean; warn?: boolean }[] = []
  if (p.ind_tipo)            rows.push({ label: "Tipo de Imóvel",       value: TIPO_MAP[p.ind_tipo] ?? p.ind_tipo })
  if (p.des_condic)          rows.push({ label: "Condição do CAR",      value: p.des_condic, warn: true })
  if (p.area_imovel || p.num_area)
                             rows.push({ label: "Área Total",           value: p.area_imovel ?? `${p.num_area} ha`, mono: true })
  if (p.mod_fiscal != null)  rows.push({ label: "Módulo Fiscal",        value: String(p.mod_fiscal), mono: true })
  if (p.situacao_reserva_legal)
                             rows.push({ label: "Situação da RL",       value: p.situacao_reserva_legal })
  if (p.area_remanescente)   rows.push({ label: "Remanescente nativo",  value: p.area_remanescente, mono: true })
  if (p.area_uso_consolidado)
                             rows.push({ label: "Uso consolidado",      value: p.area_uso_consolidado, mono: true })
  if (p.cadastrante && p.cadastrante !== "Nao Informado")
                             rows.push({ label: "Cadastrante",          value: p.cadastrante })
  if (p.dat_criaca || p.data_registro)
                             rows.push({ label: "Data de Registro",     value: p.dat_criaca ?? p.data_registro, mono: true })
  if (p.dat_atuali || p.data_ultima_retificacao)
                             rows.push({ label: "Última Retificação",   value: p.dat_atuali ?? p.data_ultima_retificacao, mono: true })

  if (rows.length === 0 && !statusEntry) return null

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${HAIRLINE}`, overflow: "hidden" }}>
      {statusEntry && StatusIcon && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: SURFACE_ALT,
          borderBottom: rows.length ? `1px solid ${HAIRLINE}` : "none",
        }}>
          <span style={{ fontSize: 12, color: MUTED }}>Status CAR</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: statusEntry.color }}>
            <StatusIcon size={12} />
            {statusEntry.label}
          </span>
        </div>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex", alignItems: "baseline", padding: "10px 16px",
            borderBottom: i < rows.length - 1 ? `1px solid ${HAIRLINE}` : "none",
            background: row.warn ? "rgba(239,68,68,0.03)" : (i % 2 === 1 ? "rgba(245,245,247,0.5)" : SURFACE),
          }}
        >
          <span style={{ fontSize: 12, color: row.warn ? "#dc2626" : MUTED, width: 188, flexShrink: 0 }}>
            {row.label}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: row.warn ? "#dc2626" : INK,
            fontFamily: row.mono ? "ui-monospace, monospace" : "inherit",
            wordBreak: "break-word",
          }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Action row ────────────────────────────────────────────────────────────────

function ActionRow({ acao, last }: { acao: ActionData; last: boolean }) {
  const cat = (acao.categoria || "").toLowerCase()
  let accentColor = "#3b82f6"
  if (cat.includes("fiscaliza") || cat.includes("incidente")) accentColor = "#ef4444"
  else if (cat.includes("recupera")) accentColor = "#059669"

  const isPassivo = acao.carater?.toLowerCase().includes("passiv")
  const chareterColor = isPassivo ? "#dc2626" : "#059669"

  return (
    <div
      style={{
        padding: "14px 18px 14px 21px", position: "relative",
        borderBottom: last ? "none" : `1px solid ${HAIRLINE}`,
        background: SURFACE, transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = SURFACE_ALT }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = SURFACE }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accentColor }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 7 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: "-0.224px", lineHeight: 1.3 }}>
          {acao.name || "Ação Sem Título"}
        </p>
        <span style={{ fontSize: 11, color: VERY_MUTED, flexShrink: 0, marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
          {fmtDate(acao.date)}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 6px", marginBottom: acao.descricao ? 10 : 0 }}>
        {acao.categoria   && <Chip label={acao.categoria}   color={accentColor} />}
        {acao.tipo_tecnico && <Chip label={acao.tipo_tecnico} />}
        {acao.carater     && <Chip label={acao.carater}     color={chareterColor} />}
      </div>

      {acao.descricao && (
        <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, fontStyle: "italic", marginTop: 2 }}>
          "{acao.descricao}"
        </p>
      )}
    </div>
  )
}

// ── Occurrence row (Desmate / Focos) ──────────────────────────────────────────

function OccurrenceRow({
  icon: Icon,
  accentColor,
  title,
  badge,
  fields,
  last,
}: {
  icon: ComponentType<any>
  accentColor: string
  title: string
  badge: string
  fields: { label: string; value: string }[]
  last: boolean
}) {
  return (
    <div
      style={{
        padding: "12px 18px 12px 21px", position: "relative",
        borderBottom: last ? "none" : `1px solid ${HAIRLINE}`,
        background: SURFACE, transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = SURFACE_ALT }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = SURFACE }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accentColor }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon size={13} color={accentColor} strokeWidth={2} />
          <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{title}</span>
        </div>
        <Chip label={badge} color={accentColor} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 28px" }}>
        {fields.map((f) => (
          <div key={f.label}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", color: VERY_MUTED, textTransform: "uppercase", marginBottom: 2 }}>
              {f.label}
            </p>
            <p style={{ fontSize: 13, fontWeight: 500, color: INK, fontFamily: "ui-monospace, monospace" }}>
              {f.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Micro components ──────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: color || MUTED,
      background: color ? `${color}18` : SURFACE_ALT,
      border: `1px solid ${color ? `${color}35` : HAIRLINE}`,
      borderRadius: 9999,
      padding: "2px 8px",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  )
}

function EmptyPlaceholder({ message }: { message: string }) {
  return (
    <div style={{
      padding: "32px 20px", textAlign: "center",
      border: `1px dashed rgba(0,0,0,0.1)`,
      borderRadius: 14, color: VERY_MUTED, fontSize: 14,
    }}>
      {message}
    </div>
  )
}

// ── Skeleton & Error states ───────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ minWidth: 400 }}>
      <style>{`
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
      `}</style>
      {[280, 200, 320, 120, 80].map((h, i) => (
        <div key={i} style={{
          height: h, borderRadius: 14, marginBottom: 16,
          background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
        }} />
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      padding: "56px 24px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        background: "rgba(239,68,68,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AlertTriangle size={22} color="#ef4444" />
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: INK, letterSpacing: "-0.2px" }}>
        Erro ao carregar dossiê
      </p>
      <p style={{ fontSize: 13, color: MUTED }}>{message}</p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString("pt-BR") }
  catch { return d }
}
