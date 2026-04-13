/**
 * Testes para o helper require-auth
 *
 * Garante que:
 * - Retorna 401 quando não há sessão ativa
 * - Retorna o user quando autenticado
 * - A resposta de erro nunca expõe detalhes internos do banco
 */

import { requireAuth } from "../require-auth";

// Mock do supabase server client
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("requireAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar { user, response: null } quando o usuário está autenticado", async () => {
    // Arrange
    const mockUser = { id: "user-123", email: "user@test.com" };
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    // Act
    const result = await requireAuth();

    // Assert
    expect(result.user).toEqual(mockUser);
    expect(result.response).toBeNull();
  });

  it("deve retornar response 401 quando não há usuário na sessão", async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    // Act
    const result = await requireAuth();

    // Assert
    expect(result.user).toBeNull();
    expect(result.response).not.toBeNull();
    const body = await result.response!.json();
    expect(result.response!.status).toBe(401);
    // Mensagem genérica — não expõe detalhes internos
    expect(body.success).toBe(false);
    expect(body.error.message).toBe("Não autorizado.");
  });

  it("deve retornar response 401 quando o Supabase retorna erro de auth", async () => {
    // Arrange
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "JWT expired" },
        }),
      },
    });

    // Act
    const result = await requireAuth();

    // Assert
    expect(result.user).toBeNull();
    expect(result.response!.status).toBe(401);
    // Não deve vazar a mensagem interna "JWT expired"
    const body = await result.response!.json();
    expect(body.error.message).not.toContain("JWT");
    expect(body.error.message).toBe("Não autorizado.");
  });
});
