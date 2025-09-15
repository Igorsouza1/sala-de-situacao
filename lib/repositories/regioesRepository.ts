import { db } from '@/db';
import { regioes } from '@/db/schema';

export const regioesRepository = {
  async findAllRegioes() {
    return await db.select().from(regioes);
  },
};
