// O que o clique numa feição importada mostra: todas as propriedades que vieram no arquivo, com nome e valor legíveis.
// O arquivo não diz como cada campo se chama na tela, então o nome sai do próprio campo ("data_deteccao" vira "Data de detecção").

export interface PropertyRow {
  key: string
  label: string
  value: string
}

// campos que só servem ao banco de quem exportou: o número de série não diz nada à pessoa
const HIDDEN = /^(id|fid|gid|objectid|ogc_fid|cod_id)$/i

// palavras comuns dos arquivos de monitoramento que perdem o acento quando exportadas
const WORDS: Record<string, string> = {
  area: 'área',
  deteccao: 'detecção',
  municipio: 'município',
  codigo: 'código',
  descricao: 'descrição',
  situacao: 'situação',
  observacao: 'observação',
  proprietario: 'proprietário',
  dt: 'data',
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/

/** "data_deteccao" → "Data de detecção"; "area_ha" → "Área (hectares)". */
export function propertyLabel(key: string): string {
  const parts = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
  if (!parts.length) return key

  let unit = ''
  if (parts.length > 1 && parts[parts.length - 1] === 'ha') {
    parts.pop()
    unit = ' (hectares)'
  }
  // "data_deteccao" lê melhor como "data de detecção"
  const words = parts.flatMap((w, i) => (i > 0 && parts[i - 1] === 'data' && w !== 'de' ? ['de', WORDS[w] ?? w] : [WORDS[w] ?? w]))
  const text = words.join(' ') + unit
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function formatValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    // o ano não leva ponto de milhar ("2019", não "2.019")
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: !/(^|_)(ano|year)(_|$)/i.test(key) })
  }
  const text = String(value).trim()
  if (!text) return null
  const iso = ISO_DATE.exec(text)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return text
}

/** Uma linha por propriedade com valor, na ordem do arquivo. Campos de série, internos (começam com "_") e vazios ficam de fora. */
export function propertyRows(properties: Record<string, unknown> | null | undefined): PropertyRow[] {
  if (!properties) return []
  const rows: PropertyRow[] = []
  for (const [key, raw] of Object.entries(properties)) {
    if (key.startsWith('_') || HIDDEN.test(key)) continue
    const value = formatValue(key, raw)
    if (value !== null) rows.push({ key, label: propertyLabel(key), value })
  }
  return rows
}
