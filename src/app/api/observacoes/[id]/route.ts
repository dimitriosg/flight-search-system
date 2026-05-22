import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.observacao.delete({ where: { id } });
    return ok({ id });
  } catch {
    return fail("Observação não encontrada.", 404);
  }
}
