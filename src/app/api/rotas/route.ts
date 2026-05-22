import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, lerJson, tratarErro } from "@/lib/api";
import { validarRota } from "@/lib/validation";

export async function GET() {
  const rotas = await prisma.rota.findMany({ orderBy: { createdAt: "desc" } });
  return ok(rotas);
}

export async function POST(req: NextRequest) {
  try {
    const body = await lerJson(req);
    const data = validarRota(body);
    const rota = await prisma.rota.create({ data });
    return ok(rota, { status: 201 });
  } catch (e) {
    return tratarErro(e);
  }
}
