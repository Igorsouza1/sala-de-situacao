"use client"

interface MapPreviewProps {
  geometry: string | any
}

export function MapPreview({ geometry }: MapPreviewProps) {
  // This is a placeholder for the actual map preview component
  // In a real implementation, you would integrate with your mapping library
  // (Leaflet, Mapbox, Google Maps, etc.)

  return (
    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
            />
          </svg>
        </div>
        <p className="text-sm font-medium">Preview do Mapa</p>
        <p className="text-xs text-muted-foreground">
          Geometria carregada: {typeof geometry === "string" ? "WKT" : "GeoJSON"}
        </p>
      </div>
    </div>
  )
}
