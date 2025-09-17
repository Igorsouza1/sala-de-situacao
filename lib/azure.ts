import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadAzure(file: File, path: string) {
  const connection = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  const baseUrl = process.env.AZURE_STORAGE_BASE_URL;

  if (!connection || !containerName || !baseUrl) {
    throw new Error("Azure storage environment variables not set");
  }

  const service = BlobServiceClient.fromConnectionString(connection);
  const container = service.getContainerClient(containerName);
  const block = container.getBlockBlobClient(path);
  const buffer = Buffer.from(await file.arrayBuffer());
  await block.uploadData(buffer, { blobHTTPHeaders: { blobContentType: file.type } });
  return `${baseUrl}/${path}`;
}


