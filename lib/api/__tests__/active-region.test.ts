/**
 * Testes para a Região ativa do Superadmin (cookie mantido pelo middleware).
 */
import { NextRequest, NextResponse } from "next/server";
import { ACTIVE_REGION_COOKIE, parseActiveRegionId, syncActiveRegionCookie } from "../active-region";

describe("parseActiveRegionId", () => {
  it.each([
    ["1", 1],
    ["42", 42],
  ])("aceita inteiro positivo %s", (raw, expected) => {
    expect(parseActiveRegionId(raw)).toBe(expected);
  });

  it.each([null, undefined, "", "0", "-1", "1.5", "abc", "1; DROP", "9999999999999999999"])(
    "rejeita valor inválido %p",
    (raw) => {
      expect(parseActiveRegionId(raw as string | null | undefined)).toBeNull();
    },
  );
});

describe("syncActiveRegionCookie", () => {
  const run = (url: string, cookie?: string) => {
    const request = new NextRequest(url, cookie ? { headers: { cookie } } : undefined);
    const response = NextResponse.next();
    syncActiveRegionCookie(request, response);
    return response.cookies.get(ACTIVE_REGION_COOKIE);
  };

  it("/protected?regiao_id=1 grava o cookie httpOnly", () => {
    const c = run("http://localhost/protected?regiao_id=1");
    expect(c?.value).toBe("1");
    expect(c?.httpOnly).toBe(true);
    expect(c?.path).toBe("/");
  });

  it("/protected sem regiao_id limpa um cookie existente", () => {
    const c = run("http://localhost/protected", `${ACTIVE_REGION_COOKIE}=1`);
    expect(c?.value).toBe("");
  });

  it("/protected sem regiao_id e sem cookie não faz nada", () => {
    expect(run("http://localhost/protected")).toBeUndefined();
  });

  it("regiao_id inválido não grava cookie", () => {
    expect(run("http://localhost/protected?regiao_id=abc")).toBeUndefined();
  });

  it("outras rotas não alteram o cookie", () => {
    expect(run("http://localhost/admin?regiao_id=1")).toBeUndefined();
    expect(run("http://localhost/api/acoes/248?regiao_id=1")).toBeUndefined();
  });
});
