import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, lerJson, tratarErro } from "@/lib/api";
import { ingerirTexto } from "@/lib/ingestao";

// Faz o parsing do texto colado SEM salvar e informa se já existe importação
// com o mesmo conteúdo (deduplicação).
export async function POST(req: NextRequest) {
  try {
    const body = await lerJson(req);
    const textoBruto = typeof body.textoBruto === "string" ? body.textoBruto : "";
    if (!textoBruto.trim()) {
      return fail("Cole o texto do e-mail.", 422, {
        textoBruto: "Cole o texto do e-mail.",
      });
    }

    const { parsed, hash } = ingerirTexto({
      textoBruto,
      assunto: typeof body.assunto === "string" ? body.assunto : null,
      remetente: typeof body.remetente === "string" ? body.remetente : null,
    });

    const duplicado = (await prisma.importacaoEmail.count({ where: { hash } })) > 0;
    return ok({ parsed, hash, duplicado });
  } catch (e) {
    return tratarErro(e);
  }
}
