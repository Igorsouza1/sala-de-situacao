import { regioesRepository } from '@/lib/repositories/regioesRepository';

export const regioesService = {
  async getAllRegioes() {
    return await regioesRepository.findAllRegioes();
  },
};
