import { getVersion, setWorkerUrl } from 'maplibre-gl'

// Next dev injects React Refresh into a bundled worker, where $RefreshReg$ does not exist.
// Serve the untouched file copied from the installed MapLibre package instead.
setWorkerUrl(`/maplibre-gl-worker.mjs?v=${getVersion()}`)
