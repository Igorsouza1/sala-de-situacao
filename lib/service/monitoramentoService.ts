import { monitoramentoRepository } from '@/lib/repositories/monitoramentoRepository';
import { NewPontoMonitoramento, NewRegistroMonitoramento } from '@/db/schema';

export const monitoramentoService = {
  async getPontosMonitoramento(regiaoId: number) {
    return await monitoramentoRepository.findPontosMonitoramentoByRegiao(regiaoId);
  },

  async addPontoMonitoramento(ponto: NewPontoMonitoramento) {
    // Aqui poderia haver lógica de validação ou de negócios no futuro
    return await monitoramentoRepository.createPontoMonitoramento(ponto);
  },

  async getRegistros(pontoId: number) {
    return await monitoramentoRepository.findRegistrosByPonto(pontoId);
  },

  async addRegistro(registro: NewRegistroMonitoramento) {
    // Lógica de negócios, como verificar se o registro é válido, etc.
    return await monitoramentoRepository.createRegistroMonitoramento(registro);
  },
};
