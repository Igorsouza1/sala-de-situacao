

import { findAllAcoesData } from "@/lib/repositories/acoesRepository";
import { findAllAcoesImagesData } from "@/lib/repositories/acoesRepository";



export async function getAllAcoesData() {
  const fogoData = await findAllAcoesData();
  return fogoData;
}


export async function getAllAcoesImagesData(id: number) {
  const acoesImagesData = await findAllAcoesImagesData(id);
  return acoesImagesData;
}

