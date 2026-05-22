import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, lerJson, tratarErro } from "@/lib/api";
import { validarOportunidade, validarStatus } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await lerJson(req);

    // Mudança rápida de status (board) vs. edição completa (formulário).
    const apenasStatus = !("origem" in body) && "status" in body;
    const data = apenasStatus ? validarStatus(body) : validarOportunidade(body);

    const oportunidade = await prisma.oportunidade.update({
      where: { id },
      data,
    });
    return ok(oportunidade);
  } catch (e) {
    return tratarErro(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.oportunidade.delete({ where: { id } });
    return ok({ id });
  } catch {
    return fail("Oportunidade não encontrada.", 404);
  }
}
