import { apiError, apiSuccess } from "@/lib/api/responses";
import { createEstradaData } from "@/lib/service/estradaService";
import { ZodError } from "zod";



export async function POST(req: Request){
    try{
        const body = await req.json()
        const { regiaoId, ...estradaData } = body;

        if (!regiaoId) {
            return apiError("O campo regiaoId é obrigatório.", 400);
        }

        const newEntry = await createEstradaData(Number(regiaoId), estradaData)
        return apiSuccess(newEntry, 201)
    }catch(error){
        if(error instanceof ZodError){
            console.log("Erro de validação Zod:", error.issues);
            return apiError(
                error.issues.map((issue) => issue.message).join(", "),
                400
              );
        }
        console.error("Erro inesperado:", error);
        return apiError("Ocorreu um erro inesperado no servidor.", 500);
    }
 }