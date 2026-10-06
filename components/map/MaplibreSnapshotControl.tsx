"use client"

import { Printer } from "lucide-react"
import { DockButton } from "./MapDock"
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

  return <DockButton icon={Printer} label="Imprimir" motion="drop" onClick={handleSnapshot} />
}
