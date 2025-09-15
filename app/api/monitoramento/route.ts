import { monitoramentoService } from '@/lib/service/monitoramentoService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createRegistroSchema = z.object({
  pontoId: z.number(),
  parametro: z.string(),
  valor: z.number(),
  unidade: z.string().optional(),
  dataOcorrencia: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const regiaoId = searchParams.get('regiaoId');
  const pontoId = searchParams.get('pontoId');

  if (regiaoId) {
    try {
      const pontos = await monitoramentoService.getPontosMonitoramento(Number(regiaoId));
      return NextResponse.json(pontos);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Erro ao buscar pontos de monitoramento.' }, { status: 500 });
    }
  }

  if (pontoId) {
    try {
      const registros = await monitoramentoService.getRegistros(Number(pontoId));
      return NextResponse.json(registros);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Erro ao buscar registros de monitoramento.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Parâmetros de busca inválidos. Forneça regiaoId ou pontoId.' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newRegistroData = createRegistroSchema.parse(body);

    const newRegistro = await monitoramentoService.addRegistro(newRegistroData);

    return NextResponse.json(newRegistro, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados de entrada inválidos.', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar registro de monitoramento.' }, { status: 500 });
  }
}
