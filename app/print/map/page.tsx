import { MapPrintTemplate } from "@/components/map/MapPrintTemplate"
import { getAllLayers } from "@/lib/service/layerService"
import { LayerResponseDTO } from "@/types/map-dto"

interface PrintMapPageProps {
  // 1. Wrap the type in a Promise
  searchParams: Promise<{
    lat?: string
    lng?: string
    z?: string
    l?: string 
    startDate?: string
    endDate?: string
  }>
}

export default async function PrintMapPage({ searchParams }: PrintMapPageProps) {
  // 2. You are already awaiting it here, so this part is correct!
  const params = await searchParams
  
  const lat = parseFloat(params.lat || "-21.327773")
  const lng = parseFloat(params.lng || "-56.694734")
  const zoom = parseInt(params.z || "11")
  const layerSlugs = params.l ? params.l.split(',') : []
  
  const startDate = params.startDate ? new Date(params.startDate) : undefined
  const endDate = params.endDate ? new Date(params.endDate) : undefined

  const allLayers = await getAllLayers(startDate, endDate)
  
  const activeLayers: LayerResponseDTO[] = []

  allLayers.forEach((layer: LayerResponseDTO) => {
      const directMatch = layerSlugs.includes(layer.slug)
      const groupMatch = layerSlugs.some(s => s.startsWith(layer.slug + '__'))

      if (directMatch || groupMatch) {
          let filteredData = layer.data

          if (groupMatch) {
              const activeSubValues = layerSlugs
                  .filter(s => s.startsWith(layer.slug + '__'))
                  .map(s => s.replace(layer.slug + '__', ''))
              
              if (activeSubValues.length > 0 && layer.visualConfig?.groupByColumn) {
                   filteredData = {
                       ...filteredData,
                       features: filteredData.features.filter((f: any) => 
                           activeSubValues.includes(f.properties?.[layer.visualConfig!.groupByColumn!] as string)
                       )
                   }
              }
          }

          if (filteredData.features.length > 0) {
              activeLayers.push({
                  ...layer,
                  data: filteredData
              })
          }
      }
  })

  activeLayers.sort((a,b) => (a.ordering || 0) - (b.ordering || 0))

  return (
    <div className="bg-white min-h-screen">
       <MapPrintTemplate 
         lat={lat}
         lng={lng}
         zoom={zoom}
         layers={activeLayers}
         activeSlugs={layerSlugs}
       />
    </div>
  )
}