'use client'

import { useEffect, type RefObject } from 'react'
import { planStackMoves } from './helpers/layer-order'

// Põe as camadas no mapa na ordem que a pessoa escolheu (DESIGN.md 13.1). O react-map-gl cria cada camada no topo, na ordem em que ela
// aparece na tela, e depois não a reposiciona: então mudar a ordem, ou chegar uma camada tarde (os dados, a imagem de um raster),
// pede um movimento explícito. Rodamos a cada mudança de estilo do mapa; já na ordem, não há nada a mover (planStackMoves devolve vazio),
// então não há laço e o custo é uma leitura da pilha.
export function useLayerStack(mapRef: RefObject<any>, ready: boolean, slugs: string[]) {
  const key = slugs.join('|')
  useEffect(() => {
    const map = mapRef.current?.getMap?.()
    if (!map || !ready) return
    const wanted = key ? key.split('|') : []
    const apply = () => {
      for (const { id, before } of planStackMoves(map.getLayersOrder(), wanted)) map.moveLayer(id, before)
    }
    apply()
    map.on('styledata', apply)
    return () => { map.off('styledata', apply) }
  }, [mapRef, ready, key])
}
