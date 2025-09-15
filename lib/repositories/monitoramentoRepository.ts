import { db } from '@/db';
import { pontosMonitoramento, registrosMonitoramento, NewPontoMonitoramento, NewRegistroMonitoramento } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const monitoramentoRepository = {
  async findPontosMonitoramentoByRegiao(regiaoId: number) {
    return await db.select().from(pontosMonitoramento).where(eq(pontosMonitoramento.regiaoId, regiaoId));
  },

  async createPontoMonitoramento(ponto: NewPontoMonitoramento) {
    const [newPonto] = await db.insert(pontosMonitoramento).values(ponto).returning();
    return newPonto;
  },

  async findRegistrosByPonto(pontoId: number) {
    return await db.select().from(registrosMonitoramento).where(eq(registrosMonitoramento.pontoId, pontoId));
  },

  async createRegistroMonitoramento(registro: NewRegistroMonitoramento) {
    const [newRegistro] = await db.insert(registrosMonitoramento).values(registro).returning();
    return newRegistro;
  },
};
