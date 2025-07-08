import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { BlobServiceClient } from "@azure/storage-blob";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const formData = await request.formData();

    const updates: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "files") {
        updates[key] = value.toString();
      }
    }

    const updateClauses = Object.entries(updates)
      .filter(([k]) => k !== "id")
      .map(([k, v]) => sql`${sql.identifier(k)} = ${v}`);
    if (updateClauses.length) {
      await db.execute(sql`
        UPDATE rio_da_prata.acoes
        SET ${sql.join(updateClauses, sql`, `)}
        WHERE id = ${id}
      `);
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const baseUrl = process.env.AZURE_STORAGE_BASE_URL;

    if (connectionString && containerName && baseUrl) {
      const blobService = BlobServiceClient.fromConnectionString(connectionString);
      const container = blobService.getContainerClient(containerName);

      const files = formData.getAll("files").filter(f => f instanceof File) as File[];
      for (const file of files) {
        const blobName = `${id}/${Date.now()}-${file.name}`;
        const blockBlob = container.getBlockBlobClient(blobName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: file.type } });
        const url = `${baseUrl}/${blobName}`;
        await db.execute(sql`
          INSERT INTO rio_da_prata.fotos_acoes (acao_id, url)
          VALUES (${id}, ${url})
        `);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating acao:", error);
    return NextResponse.json({ error: "Failed to update acao" }, { status: 500 });
  }
}
