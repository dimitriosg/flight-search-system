import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, lerJson, tratarErro } from "@/lib/api";
import { hashEmail } from "@/lib/dedupe";
import { montarObservacao } from "@/lib/ingestao";
import { validarImportacaoEmail } from "@/lib/validation";

// GET /api/importacoes — lista todas as importações (mais recente primeiro)
export async function GET() {
  try {
    const importacoes = await prisma.importacaoEmail.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return ok(importacoes);
  } catch (e) {
    return tratarErro(e);
  }
}

// POST /api/importacoes — salva importação e, opcionalmente, cria Observacao
export async function POST(req: NextRequest) {
  try {
    const body = await lerJson(req);
    const criarObservacao = body.criarObservacao === true;
    const data = validarImportacaoEmail(body, criarObservacao);

    const hash = hashEmail(data.textoBruto);

    const jaExiste = await prisma.importacaoEmail.findUnique({ where: { hash } });
    if (jaExiste) {
      return fail("E-mail já importado anteriormente.", 409, {
        hash: "Conteúdo duplicado.",
      });
    }

    let observacaoId: string | null = null;

    if (criarObservacao) {
      const obsData = montarObservacao({
        origem: data.origem!,
        destino: data.destino!,
        cabine: data.cabine!,
        preco: data.preco,
        fonte: data.fonte,
      });
      const obs = await prisma.observacao.create({ data: obsData });
      observacaoId = obs.id;
    }

    const importacao = await prisma.importacaoEmail.create({
      data: {
        ...data,
        hash,
        observacaoId,
        status: criarObservacao ? "importado" : data.status,
      },
    });

    return ok({ importacao, observacaoId }, { status: 201 });
  } catch (e) {
    return tratarErro(e);
  }
}
