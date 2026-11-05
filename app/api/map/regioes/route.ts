import { NextResponse } from 'next/server'
import { requireAuthWithTenant } from '@/lib/api/require-auth'
import { listAccessibleRegions } from '@/lib/repositories/regionListRepository'

// GET /api/map/regioes — as Regiões para onde a pessoa pode ir (menu da conta, "Regiões"). Mesmas regras do escopo das rotas.
export async function GET() {
  const { user, tenantId, response } = await requireAuthWithTenant()
  if (response || !user || !tenantId) return response ?? NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  try {
    const regioes = await listAccessibleRegions(user.id, user.app_metadata?.is_superadmin === true)
    return NextResponse.json({ regioes }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Erro ao listar as regiões:', error)
    return NextResponse.json({ error: 'Não foi possível carregar as regiões.' }, { status: 500 })
  }
}
