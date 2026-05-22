// Envelope de resposta consistente + tratamento de erros para as rotas de API.

import { NextResponse } from "next/server";
import { ErroValidacao } from "./validation";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  message: string,
  status = 400,
  campos?: Record<string, string>,
) {
  return NextResponse.json({ ok: false, error: message, campos }, { status });
}

export async function lerJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {
    /* cai no erro abaixo */
  }
  throw new ErroValidacao({ _: "Corpo da requisição inválido." });
}

export function tratarErro(e: unknown) {
  if (e instanceof ErroValidacao) {
    return fail(e.message, 422, e.campos);
  }
  console.error("[api] erro inesperado:", e);
  return fail("Erro interno do servidor.", 500);
}
