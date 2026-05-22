import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, lerJson, tratarErro } from "@/lib/api";
import { validarAlerta } from "@/lib/validation";

export async function GET() {
  const alertas = await prisma.alerta.findMany({
    orderBy: [{ ativo: "desc" }, { createdAt: "desc" }],
  });
  return ok(alertas);
}

export async function POST(req: NextRequest) {
  try {
    const body = await lerJson(req);
    const data = validarAlerta(body);
    const alerta = await prisma.alerta.create({ data });
    return ok(alerta, { status: 201 });
  } catch (e) {
    return tratarErro(e);
  }
}
