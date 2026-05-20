"use client"

import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMapContext } from "@/context/GeoDataContext"

interface MaplibreSnapshotControlProps {
  activeLayers: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapRef: React.RefObject<any>
}

export function MaplibreSnapshotControl({
  activeLayers,
  mapRef,
}: MaplibreSnapshotControlProps) {
  const { dateFilter } = useMapContext()

  const handleSnapshot = () => {
    const map = mapRef.current
    if (!map) return

    const center = map.getCenter()
    const zoom = map.getZoom()

    const params = new URLSearchParams()
    params.append("lat", center.lat.toString())
    params.append("lng", center.lng.toString())
    params.append("z", zoom.toString())

    if (activeLayers.length > 0) params.append("l", activeLayers.join(","))
    if (dateFilter.startDate)
      params.append("startDate", dateFilter.startDate.toISOString())
    if (dateFilter.endDate)
      params.append("endDate", dateFilter.endDate.toISOString())

    window.open(`/print/map?${params.toString()}`, "_blank")
  }

  return (
    <div className="absolute top-[370px] right-4 z-[400]">
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
