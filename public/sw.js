// ─── Configuração ──────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v5'
const SHELL_CACHE   = `javali-shell-${CACHE_VERSION}`
const TILES_CACHE   = `javali-tiles-${CACHE_VERSION}`
const TILES_MAX     = 1500

// Região de Bonito/MS para pré-cache de tiles
const PRE_CACHE_LEVELS = [
  { z: 9,  minLat: -21.9, maxLat: -20.7, minLng: -57.3, maxLng: -56.1 },
  { z: 10, minLat: -21.9, maxLat: -20.7, minLng: -57.3, maxLng: -56.1 },
  { z: 11, minLat: -21.9, maxLat: -20.7, minLng: -57.3, maxLng: -56.1 },
  { z: 12, minLat: -21.9, maxLat: -20.7, minLng: -57.3, maxLng: -56.1 },
  { z: 13, minLat: -21.7, maxLat: -20.9, minLng: -57.1, maxLng: -56.3 },
]

const LEAFLET_ICONS = [
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
]

// ─── Helpers de tiles ──────────────────────────────────────────────────────────
function latLngToTile(lat, lng, z) {
  const n      = Math.pow(2, z)
  const x      = Math.floor((lng + 180) / 360 * n)
  const latRad = (lat * Math.PI) / 180
  const y      = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n)
  return { x, y }
}

function buildTileUrls({ minLat, maxLat, minLng, maxLng, z }) {
  const tl   = latLngToTile(maxLat, minLng, z)
  const br   = latLngToTile(minLat, maxLng, z)
  const urls = []
  for (let x = tl.x; x <= br.x; x++) {
    for (let y = tl.y; y <= br.y; y++) {
      urls.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`)
    }
  }
  return urls
}

// ─── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE)

      // Ícones do Leaflet
      await Promise.allSettled(
        LEAFLET_ICONS.map(url =>
          fetch(url).then(r => r.ok && shellCache.put(url, r)).catch(() => {})
        )
      )

      // Tiles da região de Bonito/MS
      const tileCache = await caches.open(TILES_CACHE)
      for (const level of PRE_CACHE_LEVELS) {
        const urls = buildTileUrls(level)
        for (let i = 0; i < urls.length; i += 10) {
          await Promise.allSettled(
            urls.slice(i, i + 10).map(async url => {
              if (await tileCache.match(url)) return
              const r = await fetch(url, { mode: 'cors' }).catch(() => null)
              if (r && r.ok) await tileCache.put(url, r)
            })
          )
        }
      }
    })()
  )
})

// ─── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== TILES_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// ─── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Tiles OSM sem subdomain + ícones Leaflet
  if (url.hostname === 'tile.openstreetmap.org' || url.hostname === 'unpkg.com') {
    event.respondWith(serveTile(req))
    return
  }

  // Só intercepta requests da mesma origem a partir daqui
  if (url.origin !== self.location.origin) return

  // API: network-only (fila offline gerenciada pela página)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ success: false, error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Next.js HMR / dev — nunca cachear
  if (
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('__nextjs')
  ) {
    event.respondWith(fetch(req))
    return
  }

  // Chunks e assets estáticos do Next.js (/_next/static/...):
  // cache-first — esses arquivos têm hash no nome, nunca mudam
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStatic(req))
    return
  }

  // Navegação para a rota do javali: stale-while-revalidate com fallback offline
  if (url.pathname.startsWith('/avistamento-javali')) {
    event.respondWith(staleWhileRevalidate(req))
    return
  }

  // Todas as outras rotas da app: passa direto para a rede (não interfere)
  event.respondWith(fetch(req))
})

// Cache-first para assets estáticos hasheados (/_next/static/...):
// O hash no nome garante que o arquivo nunca muda — pode ser cacheado para sempre.
async function cacheFirstStatic(request) {
  const cache  = await caches.open(SHELL_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    return new Response('Recurso indisponível offline', { status: 503 })
  }
}

// Stale-While-Revalidate: para o HTML da rota do javali.
async function staleWhileRevalidate(request) {
  const cache  = await caches.open(SHELL_CACHE)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok && response.status < 400) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  // Se tem cache: retorna imediatamente e revalida em background
  if (cached) {
    networkPromise // fire-and-forget
    return cached
  }

  // Sem cache: espera a rede; se falhar, erro claro
  const networkResponse = await networkPromise
  if (networkResponse) return networkResponse

  return new Response('Recurso indisponível offline', { status: 503 })
}

async function serveTile(request) {
  const cache  = await caches.open(TILES_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const keys = await cache.keys()
      if (keys.length >= TILES_MAX) await cache.delete(keys[0])
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    // Tile não cacheado offline: retorna PNG transparente (Leaflet mostra vazio)
    return new Response(
      new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,1,0,0,0,1,0,8,6,0,0,0,92,114,168,102,0,0,0,11,73,68,65,84,120,156,98,248,15,0,0,255,255,3,0,8,252,2,254,163,126,104,79,0,0,0,0,73,69,78,68,174,66,96,130]),
      { status: 200, headers: { 'Content-Type': 'image/png' } }
    )
  }
}

// ─── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'javali-sync') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_REQUESTED' }))
      )
    )
  }
})
