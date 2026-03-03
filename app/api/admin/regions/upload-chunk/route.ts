import { apiError, apiSuccess } from "@/lib/api/responses";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const uploadId = formData.get("uploadId") as string;
        const chunkIndexStr = formData.get("chunkIndex") as string;
        const chunk = formData.get("chunk") as Blob;

        if (!uploadId || !chunkIndexStr || !chunk) {
            return apiError("Parâmetros inválidos para upload do chunk", 400);
        }

        const chunkIndex = parseInt(chunkIndexStr, 10);
        const arrayBuffer = await chunk.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const tmpDir = os.tmpdir();
        const chunkPath = path.join(tmpDir, `${uploadId}.chunk.${chunkIndex}`);

        fs.writeFileSync(chunkPath, buffer);

        return apiSuccess({ success: true, chunkIndex });
    } catch (error) {
        console.error("Chunk upload error:", error);
        return apiError("Erro ao salvar o fragmento do arquivo.", 500);
    }
}
