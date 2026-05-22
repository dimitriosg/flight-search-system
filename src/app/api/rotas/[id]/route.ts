import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, lerJson, tratarErro } from "@/lib/api";
import { validarRota } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await lerJson(req);
    const data = validarRota(body);
    const rota = await prisma.rota.update({ where: { id }, data });
    return ok(rota);
  } catch (e) {
    return tratarErro(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.rota.delete({ where: { id } });
    return ok({ id });
  } catch {
    return fail("Rota não encontrada.", 404);
  }
}
