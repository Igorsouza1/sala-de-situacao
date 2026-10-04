jest.mock("@/db", () => ({ db: { execute: jest.fn() } }));
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
jest.mock("@/lib/api/require-auth", () => ({ requireRole: jest.fn() }));
jest.mock("@/lib/repositories/acoesRepository", () => ({
  findAcaoById: jest.fn(),
  addAcaoImageById: jest.fn(),
}));
jest.mock("@/lib/supabase/admin", () => ({ createAdminClient: jest.fn() }));

import { requireRole } from "@/lib/api/require-auth";
import { findAcaoById, addAcaoImageById } from "@/lib/repositories/acoesRepository";
import { createAdminClient } from "@/lib/supabase/admin";
import { POST as uploadPhoto } from "./route";
import { POST as createUploadUrl } from "../upload-url/route";

const TENANT = "tenant-a";
const context = { params: Promise.resolve({ id: "42" }) };
const mockUpload = jest.fn();
const mockCreateSignedUploadUrl = jest.fn();

function formRequest(fileType = "image/jpeg") {
  const form = new FormData();
  form.append("file", new Blob(["image"], { type: fileType }), "photo.jpg");
  form.append("descricao", "Ação em campo");
  return new Request("http://localhost/api/acoes/42/upload-photo", { method: "POST", body: form });
}

function urlRequest(contentType = "image/jpeg") {
  return new Request("http://localhost/api/acoes/42/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: "photo.jpg", contentType }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (db.execute as jest.Mock).mockImplementation(async statement => {
    const q = new PgDialect().sqlToQuery(statement);
    if (q.sql.includes('FROM monitoramento.regioes')) return { rows: [{ tenant_id: TENANT }] };
    if (q.sql.includes('SELECT EXISTS')) return { rows: [{ ok: true }] };
    if (q.sql.includes('FROM monitoramento.roles')) return { rows: [{ region_id: 11 }] };
    throw new Error('Unexpected authorization query: ' + q.sql);
  });
  (requireRole as jest.Mock).mockResolvedValue({ user: { id: "editor-a", app_metadata: {} }, tenantId: TENANT, response: null });
  (findAcaoById as jest.Mock).mockResolvedValue({ id: 42, regiao_id: 11 });
  mockUpload.mockResolvedValue({ error: null });
  mockCreateSignedUploadUrl.mockResolvedValue({ data: { signedUrl: "https://storage/upload" }, error: null });
  (createAdminClient as jest.Mock).mockReturnValue({
    storage: {
      from: () => ({ upload: mockUpload, createSignedUploadUrl: mockCreateSignedUploadUrl }),
    },
  });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://storage.test";
});

describe.each([
  ["direct photo upload", uploadPhoto, formRequest],
  ["signed upload URL", createUploadUrl, urlRequest],
] as const)("%s authorization", (_name, handler, requestFactory) => {
  it("returns 401 without a session", async () => {
    (requireRole as jest.Mock).mockResolvedValue({ response: Response.json({}, { status: 401 }) });
    const response = await handler(requestFactory(), context);
    expect(response.status).toBe(401);
  });

  it("returns 403 for Viewer or Auditor", async () => {
    (requireRole as jest.Mock).mockResolvedValue({ response: Response.json({}, { status: 403 }) });
    const response = await handler(requestFactory(), context);
    expect(response.status).toBe(403);
  });

  it("returns 404 when the action is outside the tenant", async () => {
    (findAcaoById as jest.Mock).mockResolvedValue(null);
    const response = await handler(requestFactory(), context);
    expect(response.status).toBe(404);
    expect(findAcaoById).toHaveBeenCalledWith(42, TENANT);
  });
});

it("uploads and records a photo for an action in the editor's tenant", async () => {
  const response = await uploadPhoto(formRequest(), context);
  expect(response.status).toBe(200);
  expect(mockUpload).toHaveBeenCalledTimes(1);
  expect(addAcaoImageById).toHaveBeenCalledWith(42, expect.stringContaining("/acoes/42/"), "Ação em campo", expect.any(Date));
  expect(requireRole).toHaveBeenCalledWith("editor");
});

it("creates a signed URL for an image in the editor's tenant", async () => {
  const response = await createUploadUrl(urlRequest(), context);
  expect(response.status).toBe(200);
  expect(mockCreateSignedUploadUrl).toHaveBeenCalledTimes(1);
  expect(requireRole).toHaveBeenCalledWith("editor");
});

it("rejects non-image MIME types on both upload paths", async () => {
  const directResponse = await uploadPhoto(formRequest("application/pdf"), context);
  const signedResponse = await createUploadUrl(urlRequest("application/pdf"), context);
  expect(directResponse.status).toBe(400);
  expect(signedResponse.status).toBe(400);
  expect(mockUpload).not.toHaveBeenCalled();
  expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
});

it('denies an editor assigned only to a different region before mutations', async () => {
  (db.execute as jest.Mock).mockImplementation(async statement => {
    const q = new PgDialect().sqlToQuery(statement);
    if (q.sql.includes('FROM monitoramento.regioes')) return { rows: [{ tenant_id: TENANT }] };
    if (q.sql.includes('SELECT EXISTS')) return { rows: [{ ok: false }] };
    return { rows: [{ region_id: 12 }] };
  });
  expect((await uploadPhoto(formRequest(), context)).status).toBe(403);
  expect((await createUploadUrl(urlRequest(), context)).status).toBe(403);
  expect(createAdminClient).not.toHaveBeenCalled();
  expect(addAcaoImageById).not.toHaveBeenCalled();
});
