// A linha pequena do cartão: mostra para onde o assunto vem indo, sem eixo nem número (DESIGN.md 2.2).
export function MiniSpark({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const H = 32
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = H - ((v - min) / range) * (H - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg aria-hidden width="100%" height={H} viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" className="w-full">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={points} />
    </svg>
  )
}
