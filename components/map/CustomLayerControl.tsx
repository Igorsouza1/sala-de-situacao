"use client"

import { useState } from "react"
import { useMap } from "react-leaflet"
import { Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import L from "leaflet"

const layers = [
  {
    name: "Google Satellite",
    url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    options: {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
      attribution: "© Google",
    },
  },
  {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  {
    name: "Topográfico",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 17,
      attribution:
        'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    },
  },
]

export function CustomLayerControl() {
  const map = useMap()
  const [activeLayer, setActiveLayer] = useState(layers[0].name)

  const changeLayer = (layer: (typeof layers)[0]) => {
    try {
      // Remove existing tile layers
      map.eachLayer((mapLayer) => {
        if ((mapLayer as any)._url) {
          map.removeLayer(mapLayer)
        }
      })

      // Add new tile layer with proper options
      const tileLayer = L.tileLayer(layer.url, layer.options)

      if (map) {
        tileLayer.addTo(map)
        setActiveLayer(layer.name)
      }
    } catch (error) {
      console.error("Error changing layer:", error)
    }
  }

  return (
    <div className="absolute top-4 right-4 z-[400]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-white hover:bg-gray-100 shadow-md text-black hover:text-black">
            <Layers className="h-4 w-4 mr-2" />
            {activeLayer}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {layers.map((layer) => (
            <DropdownMenuItem key={layer.name} onSelect={() => changeLayer(layer)} className="cursor-pointer">
              {layer.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

