jest.mock("@/db", () => ({ db: { execute: jest.fn() } }));
import { db } from "@/db";
import { PgDialect } from "drizzle-orm/pg-core";
jest.mock("@/lib/api/require-auth", () => ({ requireRole: jest.fn() }));
jest.mock("@/lib/repositories/acoesRepository", () => ({ findAcaoById: jest.fn() }));
jest.mock("@/lib/service/acoesService", () => ({
  addAcaoUpdate: jest.fn(),
  deleteAcaoItemHistoryById: jest.fn(),
}));
jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }));

import { requireRole } from "@/lib/api/require-auth";
import { findAcaoById } from "@/lib/repositories/acoesRepository";
import { addAcaoUpdate, deleteAcaoItemHistoryById } from "@/lib/service/acoesService";
import { revalidateTag } from "next/cache";
import { POST, DELETE } from "./route";

const TENANT = "tenant-a";
const USER = { id: "editor-a", app_metadata: { tenant_id: TENANT } };
const context = { params: Promise.resolve({ id: "42" }) };

function postRequest(body: unknown = { descricao: "Ação revisada" }) {
  return new Request("http://localhost/api/acoes/42/updates", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest(updateId = 7) {
  return new Request(`http://localhost/api/acoes/42/updates?updateId=${updateId}`, { method: "DELETE" });
}

beforeEach(() => {
  jest.clearAllMocks();
  (db.execute as jest.Mock).mockImplementation(async statement => {
    const q = new PgDialect().sqlToQuery(statement);
    if (q.sql.includes('FROM monitoramento.regioes')) return { rows: [{ tenant_id: TENANT }] };
    if (q.sql.includes('SELECT EXISTS')) return { rows: [{ ok: false }] };
    if (q.sql.includes('FROM monitoramento.roles')) return { rows: [{ region_id: 11 }] };
    throw new Error('Unexpected authorization query: ' + q.sql);
  });
  (requireRole as jest.Mock).mockResolvedValue({ user: USER, tenantId: TENANT, response: null });
  (findAcaoById as jest.Mock).mockResolvedValue({ id: 42, regiao_id: 11 });
  (addAcaoUpdate as jest.Mock).mockResolvedValue({ message: "ok" });
  (deleteAcaoItemHistoryById as jest.Mock).mockResolvedValue([{ id: 7 }]);
});

describe.each([
  ["POST", POST, postRequest],
  ["DELETE", DELETE, deleteRequest],
] as const)("%s action update", (_method, handler, requestFactory) => {
  it("returns 401 without a session", async () => {
    (requireRole as jest.Mock).mockResolvedValue({ response: Response.json({}, { status: 401 }) });
    expect((await handler(requestFactory(), context)).status).toBe(401);
    expect(findAcaoById).not.toHaveBeenCalled();
  });

  it("returns 403 for Viewer or Auditor", async () => {
    (requireRole as jest.Mock).mockResolvedValue({ response: Response.json({}, { status: 403 }) });
    expect((await handler(requestFactory(), context)).status).toBe(403);
    expect(findAcaoById).not.toHaveBeenCalled();
  });

  it("returns 404 when the action belongs to another organization", async () => {
    (findAcaoById as jest.Mock).mockResolvedValue(null);
    expect((await handler(requestFactory(), context)).status).toBe(404);
    expect(findAcaoById).toHaveBeenCalledWith(42, TENANT);
  });
});

it("adds an update only after finding the action in the editor's organization", async () => {
  const response = await POST(postRequest({ descricao: "Ação revisada", urlMidia: "https://media.test/photo.jpg" }), context);
  expect(response.status).toBe(200);
  expect(requireRole).toHaveBeenCalledWith("editor");
  expect(findAcaoById).toHaveBeenCalledWith(42, TENANT);
  expect(addAcaoUpdate).toHaveBeenCalledWith(42, expect.objectContaining({
    descricao: "Ação revisada",
    urlMidia: "https://media.test/photo.jpg",
  }));
});

it("deletes a history row only through the action it belongs to", async () => {
  const response = await DELETE(deleteRequest(7), context);
  expect(response.status).toBe(200);
  expect(deleteAcaoItemHistoryById).toHaveBeenCalledWith(42, 7);
  expect(revalidateTag).toHaveBeenCalledWith("acoes");
});

it("returns 404 when the update does not belong to the requested action", async () => {
  (deleteAcaoItemHistoryById as jest.Mock).mockResolvedValue([]);
  const response = await DELETE(deleteRequest(99), context);
  expect(response.status).toBe(404);
  expect(revalidateTag).not.toHaveBeenCalled();
});

it('denies an editor assigned only to a different region before mutations', async () => {
  (db.execute as jest.Mock).mockImplementation(async statement => {
    const q = new PgDialect().sqlToQuery(statement);
    if (q.sql.includes('FROM monitoramento.regioes')) return { rows: [{ tenant_id: TENANT }] };
    if (q.sql.includes('SELECT EXISTS')) return { rows: [{ ok: false }] };
    return { rows: [{ region_id: 12 }] };
  });
  expect((await POST(postRequest(), context)).status).toBe(403);
  expect((await DELETE(deleteRequest(), context)).status).toBe(403);
  expect(addAcaoUpdate).not.toHaveBeenCalled();
  expect(deleteAcaoItemHistoryById).not.toHaveBeenCalled();
});
