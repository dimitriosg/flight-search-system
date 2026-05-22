import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, lerJson, tratarErro } from "@/lib/api";
import { validarOportunidade } from "@/lib/validation";
import { enriquecer } from "@/lib/enrich";

export async function GET() {
  const [oportunidades, rotas, observacoes] = await Promise.all([
    prisma.oportunidade.findMany({ orderBy: { dataBusca: "desc" } }),
    prisma.rota.findMany(),
    prisma.observacao.findMany(),
  ]);
  return ok(enriquecer(oportunidades, rotas, observacoes));
}

export async function POST(req: NextRequest) {
  try {
    const body = await lerJson(req);
    const data = validarOportunidade(body);
    const oportunidade = await prisma.oportunidade.create({ data });
    return ok(oportunidade, { status: 201 });
  } catch (e) {
    return tratarErro(e);
  }
}
