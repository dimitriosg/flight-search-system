import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, lerJson, tratarErro } from "@/lib/api";
import { validarObservacao } from "@/lib/validation";

export async function GET() {
  const observacoes = await prisma.observacao.findMany({
    orderBy: { dataObservacao: "desc" },
  });
  return ok(observacoes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await lerJson(req);
    const data = validarObservacao(body);
    const observacao = await prisma.observacao.create({ data });
    return ok(observacao, { status: 201 });
  } catch (e) {
    return tratarErro(e);
  }
}
