import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, lerJson, tratarErro } from "@/lib/api";
import { validarAlerta } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await lerJson(req);

    // Alternar ativo/inativo vs. edição completa.
    if (!("plataforma" in body) && "ativo" in body) {
      const alerta = await prisma.alerta.update({
        where: { id },
        data: { ativo: body.ativo === true || body.ativo === "true" },
      });
      return ok(alerta);
    }

    const data = validarAlerta(body);
    const alerta = await prisma.alerta.update({ where: { id }, data });
    return ok(alerta);
  } catch (e) {
    return tratarErro(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.alerta.delete({ where: { id } });
    return ok({ id });
  } catch {
    return fail("Alerta não encontrado.", 404);
  }
}
