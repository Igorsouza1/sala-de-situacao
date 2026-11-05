import { zipSync, strToU8 } from 'fflate'
import { filesFromZip, readZip } from '../zip'

const zipFile = (entries: Record<string, Uint8Array>, name = 'serie.zip') => new File([zipSync(entries) as BlobPart], name)

describe('abrir um .zip solto no mapa', () => {
  it('entrega os rasters e GeoJSON de dentro, sem pastas nem auxiliares', async () => {
    const files = await readZip(
      zipFile({
        'uso_solo_recortado/uso_1985.tif': strToU8('a'),
        'uso_solo_recortado/uso_1985.tif.aux.xml': strToU8('b'),
        'uso_solo_recortado/uso_1986.tif': strToU8('c'),
        'leia-me.txt': strToU8('d'),
        '__MACOSX/uso_solo_recortado/._uso_1985.tif': strToU8('e'),
      }),
    )
    expect(files.map((f) => f.name).sort()).toEqual(['uso_1985.tif', 'uso_1986.tif'])
  })

  it('diz quando não há nada que o mapa leia', async () => {
    await expect(readZip(zipFile({ 'leia-me.txt': strToU8('x') }))).rejects.toThrow('não tem nenhum arquivo que o mapa lê')
  })

  it('diz quando o .zip não abre', async () => {
    await expect(readZip(new File([strToU8('não é zip')], 'quebrado.zip'))).rejects.toThrow('Não conseguimos abrir')
  })

  it('ignora as entradas de pasta', () => {
    expect(filesFromZip({ 'pasta/': new Uint8Array(), 'pasta/a.geojson': strToU8('{}') }).map((f) => f.name)).toEqual(['a.geojson'])
  })
})
