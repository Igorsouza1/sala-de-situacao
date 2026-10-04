import { db } from "@/db";
import { deleteAcaoUpdateById } from "../acoesRepository";

jest.mock("@/db", () => {
  const { drizzle } = jest.requireActual("drizzle-orm/node-postgres");
  return { db: drizzle({ client: { query: jest.fn().mockResolvedValue({ rows: [] }) } }) };
});

const query = db.$client.query as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("deletes a history row only when both update id and action id match", async () => {
  await deleteAcaoUpdateById(7, 42);
  const [statement, params] = query.mock.calls[0];
  expect(statement.text).toMatch(/DELETE FROM "monitoramento"\."fotos_acoes"/i);
  expect(statement.text).toMatch(/WHERE .*"id" = \$1 AND .*"acao_id" = \$2/i);
  expect(statement.text).toMatch(/RETURNING/i);
  expect(params).toEqual([7, 42]);
});
