"use client"

import { useMap } from "react-leaflet"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CustomZoomControl() {
  const map = useMap()

  return (
    <div className="absolute top-20 right-4 z-[400]">
      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="bg-white hover:bg-gray-100 shadow-md text-black"
          onClick={() => map.zoomIn()}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white hover:bg-gray-100 text-black shadow-md"
          onClick={() => map.zoomOut()}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

