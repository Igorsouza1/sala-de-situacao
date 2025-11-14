// lib/azure.ts
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob"

// ⛔ Sempre usar isso só em código server (route handlers, server actions)

function ensureEnv() {
  const connection = process.env.AZURE_STORAGE_CONNECTION_STRING
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME
  const baseUrl = process.env.AZURE_STORAGE_BASE_URL

  if (!connection || !containerName || !baseUrl) {
    throw new Error("Azure storage environment variables not set")
  }

  return { connection, containerName, baseUrl }
}

// Parseia AccountName e AccountKey da connection string
function getAccountFromConnectionString(connection: string) {
  const parts = connection.split(";").reduce((acc, part) => {
    const [key, value] = part.split("=")
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)

  const accountName = parts["AccountName"]
  const accountKey = parts["AccountKey"]

  if (!accountName || !accountKey) {
    throw new Error("Invalid AZURE_STORAGE_CONNECTION_STRING: missing AccountName or AccountKey")
  }

  return { accountName, accountKey }
}

/**
 * Upload via backend (usa o body na função server).
 * 👉 Em Vercel isso vai estourar o limite pra arquivos grandes.
 * Deixa aqui pra usos internos / scripts, mas pro formulário
 * de dossiê vamos migrar pra SAS + upload direto.
 */
export async function uploadAzure(file: File, path: string) {
  const { connection, containerName, baseUrl } = ensureEnv()

  const service = BlobServiceClient.fromConnectionString(connection)
  const container = service.getContainerClient(containerName)
  const block = container.getBlockBlobClient(path)

  const buffer = Buffer.from(await file.arrayBuffer())

  await block.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
  })

  return `${baseUrl}/${path}` // baseUrl deve ser: https://<account>.blob.core.windows.net/<container>
}

/**
 * Gera uma URL de upload (SAS) para o Blob.
 * - uploadUrl → usada no front pra fazer PUT diretamente no Azure
 * - blobUrl   → URL pública final do arquivo
 */
export function getAzureUploadUrls(path: string, expiresInMinutes = 15) {
  const { connection, containerName, baseUrl } = ensureEnv()
  const { accountName, accountKey } = getAccountFromConnectionString(connection)

  const credential = new StorageSharedKeyCredential(accountName, accountKey)

  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: path,
      permissions: BlobSASPermissions.parse("cw"), // create + write
      expiresOn,
    },
    credential,
  ).toString()

  const blobUrl = `${baseUrl}/${path}`
  const uploadUrl = `${blobUrl}?${sas}`

  return { uploadUrl, blobUrl }
}
