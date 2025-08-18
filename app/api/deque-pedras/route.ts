import { apiError, apiSuccess } from "@/lib/api/responses"
import {  getAllDequeDataGroupedByMonth } from "@/lib/service/dequeService"
import { NextRequest } from "next/server"


export async function GET() {
    try{
        const dequeData = await getAllDequeDataGroupedByMonth()

        return apiSuccess(dequeData)
    } catch (error) {
        return apiError(error as string, 500)
    }
    
}


export async function POST(req: NextRequest) {
    const formData = await req.formData()
    
 }