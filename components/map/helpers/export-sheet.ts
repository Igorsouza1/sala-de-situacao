// Baixar o mapa (Gerar mapa): o PDF no tamanho do papel e o PNG a 300 dpi, sem a pessoa escolher resolução. A folha é desenhada fora
// da tela, já no tamanho de exportação (milímetros do papel em pixels de 96 dpi), com o mapa em resolução de 300 dpi, e então fotografada.

export type ExportKind = 'pdf' | 'png'

export const EXPORT_DPI = 300
const CSS_DPI = 96
const MM_PER_INCH = 25.4

/** o tamanho da folha de exportação: em pixels de tela (cssW × cssH), o que multiplicar para chegar a 300 dpi, e o tamanho final */
export function exportSize(widthMm: number, heightMm: number) {
  const pxPerMm = CSS_DPI / MM_PER_INCH
  const cssW = Math.ceil(widthMm * pxPerMm)
  const cssH = Math.ceil(heightMm * pxPerMm)
  const pixelRatio = EXPORT_DPI / CSS_DPI
  return { pxPerMm, cssW, cssH, pixelRatio, outW: Math.round(cssW * pixelRatio), outH: Math.round(cssH * pixelRatio) }
}

/** "Focos de calor em São Paulo!" → "focos-de-calor-em-sao-paulo", sem passar de `max` letras */
export function slugify(text: string, max = 60): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.slice(0, max).replace(/-+$/, '')
}

const two = (n: number) => String(n).padStart(2, '0')

/** o nome do arquivo: mapa, o título e a data de hoje */
export function exportFileName(title: string, date: Date, ext: ExportKind): string {
  const day = `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`
  const slug = slugify(title)
  return `mapa${slug ? `-${slug}` : ''}-${day}.${ext}`
}

/** fotografa a folha (já desenhada no tamanho de exportação) e a devolve como PNG ou como PDF no tamanho do papel */
export async function captureSheet(node: HTMLElement, widthMm: number, heightMm: number, kind: ExportKind): Promise<Blob> {
  const { toCanvas } = await import('html-to-image')
  const { cssW, cssH, pixelRatio } = exportSize(widthMm, heightMm)
  const canvas = await toCanvas(node, { pixelRatio, width: cssW, height: cssH, backgroundColor: 'white', cacheBust: false })
  if (kind === 'png') {
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png vazio'))), 'image/png'))
  }
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: widthMm > heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [widthMm, heightMm], compress: true })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, widthMm, heightMm)
  return pdf.output('blob')
}

/** entrega o arquivo à pessoa (pasta de downloads) */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
