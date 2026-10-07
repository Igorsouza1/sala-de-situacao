import { copyFile } from 'node:fs/promises'

const source = new URL('../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url)
const target = new URL('../public/maplibre-gl-worker.mjs', import.meta.url)

await copyFile(source, target)
