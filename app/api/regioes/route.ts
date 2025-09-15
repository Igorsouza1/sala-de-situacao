import { regioesService } from '@/lib/service/regioesService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allRegioes = await regioesService.getAllRegioes();
    return NextResponse.json(allRegioes);
  } catch (error) {
    console.error('Erro ao buscar regiões:', error);
    return NextResponse.json({ error: 'Erro ao buscar regiões.' }, { status: 500 });
  }
}
