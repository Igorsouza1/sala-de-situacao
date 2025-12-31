"use client"

import { Camera } from "lucide-react"
import { useMap } from "react-leaflet"
import { Button } from "@/components/ui/button"
import { useMapContext } from "@/context/GeoDataContext" // Assuming visible layers are not in context but map.tsx state?
// Ah, visibleDynamicLayers state is in map.tsx, NOT in context.
// I need to accept it as props.

interface SnapshotControlProps {
    activeLayers: string[]
}

export function SnapshotControl({ activeLayers }: SnapshotControlProps) {
  const map = useMap()
  const { dateFilter } = useMapContext()

  const handleSnapshot = () => {
    const center = map.getCenter()
    const zoom = map.getZoom()
    
    const params = new URLSearchParams()
    params.append("lat", center.lat.toString())
    params.append("lng", center.lng.toString())
    params.append("z", zoom.toString())
    
    if (activeLayers.length > 0) {
        params.append("l", activeLayers.join(','))
    }

    if (dateFilter.startDate) {
        params.append("startDate", dateFilter.startDate.toISOString())
    }
    if (dateFilter.endDate) {
        params.append("endDate", dateFilter.endDate.toISOString())
    }

    const url = `/print/map?${params.toString()}`
    window.open(url, '_blank')
  }

  return (
    <div className="absolute top-[370px] right-4 z-[400] flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        className="bg-white hover:bg-gray-100 shadow-md text-slate-700"
        onClick={handleSnapshot}
        title="Imprimir Mapa (Snapshot)"
      >
        <Camera className="h-4 w-4" />
      </Button>
    </div>
  )
}
