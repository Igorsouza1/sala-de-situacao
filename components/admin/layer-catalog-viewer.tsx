"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Layers, Code, Settings, Database } from "lucide-react"

interface LayerCatalog {
  id: number
  slug: string
  name: string
  ordering: number
  visualConfig: any
  schemaConfig: any
  // Add other fields as needed
}

export function LayerCatalogViewer({ layers }: { layers: LayerCatalog[] }) {
  const [selectedLayer, setSelectedLayer] = useState<LayerCatalog | null>(layers[0] || null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLayers = layers.filter(layer => 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    layer.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-100px)] border rounded-lg overflow-hidden bg-background">
      {/* Sidebar List */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <Layers className="w-5 h-5 text-brand-primary" />
            <span>Camadas ({layers.length})</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar camada..."
              className="pl-8 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-2 gap-1">
            {filteredLayers.map((layer) => (
              <Button
                key={layer.id}
                variant={selectedLayer?.id === layer.id ? "secondary" : "ghost"}
                className={`justify-start h-auto py-3 px-4 text-left ${selectedLayer?.id === layer.id ? "bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary" : ""}`}
                onClick={() => setSelectedLayer(layer)}
              >
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                  <span className="font-medium truncate">{layer.name}</span>
                  <span className="text-xs text-muted-foreground font-mono truncate">{layer.slug}</span>
                </div>
              </Button>
            ))}
            {filteredLayers.length === 0 && (
              <div className="text-center p-8 text-muted-foreground text-sm">
                Nenhuma camada encontrada.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedLayer ? (
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-8 max-w-5xl mx-auto">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-blue-600 bg-clip-text text-transparent">
                    {selectedLayer.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="font-mono">{selectedLayer.slug}</Badge>
                    <Badge variant="secondary">ID: {selectedLayer.id}</Badge>
                    <Badge variant="secondary">Ordem: {selectedLayer.ordering}</Badge>
                  </div>
                </div>
              </div>

              {/* Visual Config */}
              <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-brand-primary" />
                        <CardTitle className="text-base">Visual Configuration</CardTitle>
                    </div>
                    <CardDescription>Defines how the layer appears on the map (colors, icons, filters).</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-slate-950">
                  <div className="relative">
                    <pre className="p-4 overflow-x-auto text-sm font-mono text-emerald-400">
                      {JSON.stringify(selectedLayer.visualConfig, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Schema Config */}
              <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-purple-600" />
                        <CardTitle className="text-base">Schema Configuration</CardTitle>
                    </div>
                    <CardDescription>Defines which properties are displayed in popups and filters.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 bg-slate-950">
                  <div className="relative">
                    <pre className="p-4 overflow-x-auto text-sm font-mono text-blue-300">
                      {JSON.stringify(selectedLayer.schemaConfig, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

               {/* Raw Data Preview (Optional/Debug) */}
               <div className="pt-8 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                      <Code className="w-4 h-4" /> Raw Object
                  </h3>
                  <div className="bg-slate-100 rounded-lg p-4 font-mono text-xs overflow-x-auto text-slate-600">
                      {JSON.stringify(selectedLayer, null, 2)}
                  </div>
               </div>

            </div>
          </ScrollArea>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Layers className="w-16 h-16 mb-4 opacity-20" />
                <p>Selecione uma camada para visualizar os detalhes.</p>
            </div>
        )}
      </div>
    </div>
  )
}
