import { apiError, apiSuccess } from "@/lib/api/responses"
import {  createDequeData, getAllDequeDataGroupedByMonth } from "@/lib/service/dequeService"
import { NextRequest } from "next/server"
import { ZodError } from "zod"


export async function GET() {
    try{
        const dequeData = await getAllDequeDataGroupedByMonth()

        return apiSuccess(dequeData)
    } catch (error) {
        return apiError(error as string, 500)
    }
    
}


export async function POST(req: NextRequest) {
    try{
        const body = await req.json()
        const newEntry = await createDequeData(body)
        return apiSuccess(newEntry, 201)
    }catch(error){
        if(error instanceof ZodError){
            return apiError(
                error.issues.map((issue) => issue.message).join(", "),
                400
              );
        }
        console.error("Erro inesperado:", error);
        return apiError("Ocorreu um erro inesperado no servidor.", 500);
    }
    
 }