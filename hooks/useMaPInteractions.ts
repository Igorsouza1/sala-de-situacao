import { useState, useCallback } from "react"
import type { LatLngExpression } from "leaflet"

interface UseMapInteractionsProps {
  initialCenter: LatLngExpression
  initialZoom: number
}

export function useMapInteractions({ initialCenter, initialZoom }: UseMapInteractionsProps) {
  const [center, setCenter] = useState<LatLngExpression>(initialCenter)
  const [zoom, setZoom] = useState(initialZoom)

  const handleMoveEnd = useCallback((e: any) => {
    const map = e.target
    const newCenter: LatLngExpression = [map.getCenter().lat, map.getCenter().lng]
    setCenter(newCenter)
    setZoom(map.getZoom())
  }, [])

  return {
    center,
    zoom,
    handleMoveEnd,
  }
}

