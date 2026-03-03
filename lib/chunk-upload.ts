import fs from "fs";
import path from "path";
import os from "os";

export function assembleChunks(uploadId: string, totalChunks: number): string {
    const tmpDir = os.tmpdir();
    let finalBuffer = Buffer.alloc(0);

    for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(tmpDir, `${uploadId}.chunk.${i}`);
        if (!fs.existsSync(chunkPath)) {
            throw new Error(`O fragmento (chunk) ${i} do arquivo não foi encontrado.`);
        }
        const chunkBuffer = fs.readFileSync(chunkPath);
        finalBuffer = Buffer.concat([finalBuffer, chunkBuffer]);
    }

    // Cleanup chunks after successful assembly
    for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(tmpDir, `${uploadId}.chunk.${i}`);
        try {
            fs.unlinkSync(chunkPath);
        } catch (e) { /* ignore cleanup errors */ }
    }

    return finalBuffer.toString('utf-8');
}
