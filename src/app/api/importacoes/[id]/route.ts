import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, lerJson, tratarErro } from "@/lib/api";

const STATUS_VALIDOS = ["pendente", "importado", "ignorado", "falha"];

// PATCH /api/importacoes/[id] — atualiza o status da importação
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await lerJson(req);
    const status = typeof body.status === "string" ? body.status : "";
    if (!STATUS_VALIDOS.includes(status)) {
      return fail("Status inválido.", 422, { status: "Status inválido." });
    }

    const importacao = await prisma.importacaoEmail.update({
      where: { id },
      data: { status },
    });
    return ok(importacao);
  } catch (e) {
    return tratarErro(e);
  }
}

// DELETE /api/importacoes/[id] — remove a importação
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existe = await prisma.importacaoEmail.findUnique({ where: { id } });
    if (!existe) return fail("Importação não encontrada.", 404);
    await prisma.importacaoEmail.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return tratarErro(e);
  }
}
