"use client"

import { useState, useEffect, useRef } from "react"
import { Info, Home, Loader2 } from "lucide-react"

interface PropertyBasic {
  nome?: string
  cod_imovel?: string
  municipio?: string
  num_area?: number
}

interface DossieData {
  nome: string
  cod_imovel: string
  municipio: string
  num_area: number
  focosCount: number
  desmatamentoCount: number
  acoes: Array<{ carater?: string }>
}

interface PropertyInfoControlProps {
  isActive: boolean
  onToggle: () => void
  hoveredPropertyId: number | null
  hoveredPropertyBasic: PropertyBasic | null
}

export function PropertyInfoControl({
  isActive,
  onToggle,
  hoveredPropertyId,
  hoveredPropertyBasic,
}: PropertyInfoControlProps) {
  const [dossie, setDossie] = useState<DossieData | null>(null)
  const [loading, setLoading] = useState(false)
  const [contentKey, setContentKey] = useState(0)
  const currentIdRef = useRef<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isActive || !hoveredPropertyId) {
      setDossie(null)
      setLoading(false)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      currentIdRef.current = hoveredPropertyId
      setLoading(true)
      setContentKey((k) => k + 1)
      try {
        const res = await fetch(`/api/propriedades/${hoveredPropertyId}/dossie`)
        const json = await res.json()
        if (currentIdRef.current === hoveredPropertyId && json.success) {
          setDossie(json.data)
        }
      } catch {
        // silently ignore hover errors
      } finally {
        if (currentIdRef.current === hoveredPropertyId) setLoading(false)
      }
    }, 320)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [isActive, hoveredPropertyId])

  const nome = dossie?.nome || hoveredPropertyBasic?.nome
  const area = dossie?.num_area ?? hoveredPropertyBasic?.num_area
  const municipio = dossie?.municipio || hoveredPropertyBasic?.municipio
  const car = dossie?.cod_imovel || hoveredPropertyBasic?.cod_imovel
  const acoesTotal = dossie?.acoes?.length ?? 0
  const acoesPassivas =
    dossie?.acoes?.filter((a) => a.carater?.toLowerCase().includes("passiv")).length ?? 0
  const acoesAtivas =
    dossie?.acoes?.filter(
      (a) =>
        a.carater?.toLowerCase().includes("ativ") &&
        !a.carater?.toLowerCase().includes("passiv")
    ).length ?? 0

  const hasBasic = !!hoveredPropertyBasic

  return (
    <div style={{ position: "relative", zIndex: 1000 }}>

      {/* ── Toggle button ── */}
      <button
        onClick={onToggle}
        title={isActive ? "Desativar informações" : "Informações da Propriedade"}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: isActive ? "none" : "1px solid rgba(0,0,0,0.12)",
          background: isActive ? "#1d1d1f" : "#ffffff",
          color: isActive ? "#ffffff" : "#1d1d1f",
          boxShadow: isActive
            ? "0 4px 14px rgba(0,0,0,0.28)"
            : "0 2px 8px rgba(0,0,0,0.12)",
          cursor: "pointer",
          outline: "none",
          transition: "background 200ms ease, box-shadow 200ms ease, transform 120ms ease",
          flexShrink: 0,
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.93)" }}
        onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
      >
        <Info size={17} strokeWidth={1.8} />
      </button>

      {/* ── Info card ── */}
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 0,
          width: 276,
          background: "#ffffff",
          borderRadius: 18,
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "opacity 280ms cubic-bezier(0.4,0,0.2,1), transform 280ms cubic-bezier(0.4,0,0.2,1)",
          opacity: isActive ? 1 : 0,
          transform: isActive
            ? "translateX(0) scale(1)"
            : "translateX(-8px) scale(0.96)",
          pointerEvents: isActive ? "auto" : "none",
          transformOrigin: "left center",
        }}
      >

        {/* ── Card header ── */}
        <div
          style={{
            padding: "13px 18px 11px",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Info size={11} color="#7a7a7a" strokeWidth={2} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.07em",
              color: "#7a7a7a",
              textTransform: "uppercase",
            }}
          >
            Informações do Imóvel
          </span>
        </div>

        {/* ── Card body ── */}
        {hasBasic ? (
          <div
            key={contentKey}
            style={{
              padding: "16px 18px 18px",
              animation: "fadeSlideIn 200ms ease forwards",
            }}
          >
            <style>{`
              @keyframes fadeSlideIn {
                from { opacity: 0; transform: translateY(4px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* Property name */}
            <p
              style={{
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.374px",
                color: "#1d1d1f",
                lineHeight: 1.24,
                marginBottom: 13,
              }}
            >
              {nome || "Propriedade"}
            </p>

            {/* Data rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
              {area != null && (
                <DataRow label="Área" value={`${Number(area).toFixed(2)} ha`} />
              )}
              {municipio && <DataRow label="Município" value={municipio} />}
              {car && (
                <DataRow
                  label="CAR"
                  value={car.length > 22 ? `…${car.slice(-20)}` : car}
                  mono
                />
              )}
            </div>

            {/* Hairline divider */}
            <div
              style={{
                height: 1,
                background: "rgba(0,0,0,0.06)",
                marginBottom: 16,
              }}
            />

            {/* Stats */}
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#7a7a7a",
                  padding: "4px 0",
                }}
              >
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: 13, letterSpacing: "-0.12px" }}>
                  Carregando estatísticas…
                </span>
              </div>
            ) : dossie ? (
              <div>
                {/* Three stat numbers */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    marginBottom: acoesTotal > 0 ? 14 : 0,
                  }}
                >
                  <StatNum value={dossie.focosCount} label="Focos" color="#ef4444" />
                  <StatNum
                    value={dossie.desmatamentoCount}
                    label="Desmate"
                    color="#f59e0b"
                    bordered
                  />
                  <StatNum value={acoesTotal} label="Ações" color="#1d1d1f" />
                </div>

                {/* Ações breakdown */}
                {acoesTotal > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <AcaoChip label="Passivo" value={acoesPassivas} positive={false} />
                    <AcaoChip label="Ativo" value={acoesAtivas} positive={true} />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          /* Empty state */
          <div
            style={{
              padding: "32px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#f5f5f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Home size={17} color="#7a7a7a" strokeWidth={1.6} />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#7a7a7a",
                lineHeight: 1.5,
                letterSpacing: "-0.12px",
                maxWidth: 200,
                margin: "0 auto",
              }}
            >
              Passe o mouse sobre uma propriedade no mapa
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline" }}>
      <span
        style={{
          fontSize: 12,
          color: "#7a7a7a",
          letterSpacing: "-0.12px",
          width: 72,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: mono ? 11 : 14,
          fontWeight: 500,
          color: "#1d1d1f",
          letterSpacing: mono ? 0 : "-0.224px",
          fontFamily: mono ? "ui-monospace, monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  )
}

function StatNum({
  value,
  label,
  color,
  bordered,
}: {
  value: number
  label: string
  color: string
  bordered?: boolean
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "0 4px",
        borderLeft: bordered ? "1px solid rgba(0,0,0,0.06)" : "none",
        borderRight: bordered ? "1px solid rgba(0,0,0,0.06)" : "none",
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color,
          lineHeight: 1,
          marginBottom: 5,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "#7a7a7a",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  )
}

function AcaoChip({
  label,
  value,
  positive,
}: {
  label: string
  value: number
  positive: boolean
}) {
  const color = positive ? "#059669" : "#dc2626"
  const bg = positive ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)"
  const border = positive ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)"

  return (
    <div
      style={{
        padding: "9px 12px",
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.3px",
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "0.06em",
          color: "#7a7a7a",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  )
}
