// Abrir um .zip solto no mapa e entregar os arquivos de dentro, como se a pessoa tivesse soltado a pasta.
// Motivo: a série de anos costuma chegar zipada (download do Google Drive, do GEE). Pedir para descompactar antes é um passo a mais
// que a tela pode dar sozinha. Só saem os arquivos que o mapa lê; os auxiliares e as pastas ficam para trás.

import { unzip, type Unzipped } from 'fflate'
import { isSidecarFile, kindOfFile } from './files'

/** o que se aceita descompactar (os rasters descompactados podem ser bem maiores que o .zip) */
export const MAX_UNZIPPED_MB = 600

export const isZip = (name: string) => name.toLowerCase().endsWith('.zip')

export class ZipProblemError extends Error {}

/** Os arquivos úteis de dentro de um .zip (o nome sem as pastas). */
export function filesFromZip(entries: Unzipped): File[] {
  const out: File[] = []
  for (const [path, bytes] of Object.entries(entries)) {
    const name = path.split('/').pop() ?? ''
    if (!name || path.endsWith('/') || path.startsWith('__MACOSX/') || isSidecarFile(name) || kindOfFile(name) === 'desconhecido') continue
    out.push(new File([bytes as BlobPart], name))
  }
  return out
}

export async function readZip(file: File): Promise<File[]> {
  const buffer = new Uint8Array(await file.arrayBuffer())
  let total = 0
  const entries = await new Promise<Unzipped>((resolve, reject) =>
    unzip(
      buffer,
      {
        // descompacta só o que serve, e para se passar do teto (um .zip pequeno pode guardar gigabytes)
        filter: (f) => {
          const name = f.name.split('/').pop() ?? ''
          const wanted = !!name && !f.name.startsWith('__MACOSX/') && !isSidecarFile(name) && kindOfFile(name) !== 'desconhecido'
          if (wanted) total += f.originalSize
          return wanted && total <= MAX_UNZIPPED_MB * 1024 * 1024
        },
      },
      (err, data) => (err ? reject(err) : resolve(data)),
    ),
  ).catch(() => {
    throw new ZipProblemError(`Não conseguimos abrir “${file.name}”. Confira se o .zip não está corrompido, ou descompacte e solte a pasta.`)
  })
  if (total > MAX_UNZIPPED_MB * 1024 * 1024) throw new ZipProblemError(`“${file.name}” descompactado passa de ${MAX_UNZIPPED_MB} MB. Solte só os arquivos da área que importa.`)
  const files = filesFromZip(entries)
  if (!files.length) throw new ZipProblemError(`“${file.name}” não tem nenhum arquivo que o mapa lê (GeoJSON ou raster .tif).`)
  return files
}
