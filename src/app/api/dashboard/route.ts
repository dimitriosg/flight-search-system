import { prisma } from "@/lib/db";
import { ok, tratarErro } from "@/lib/api";
import { enriquecer, type OportunidadeEnriquecida } from "@/lib/enrich";
import { detectarFortesOportunidades } from "@/lib/opportunities";

const porNotaDesc = (a: OportunidadeEnriquecida, b: OportunidadeEnriquecida) =>
  b.pontuacao.nota - a.pontuacao.nota;

export async function GET() {
  try {
  const [opps, rotas, alertas, observacoes] = await Promise.all([
    prisma.oportunidade.findMany(),
    prisma.rota.findMany(),
    prisma.alerta.findMany(),
    prisma.observacao.findMany(),
  ]);

  const enr = enriquecer(opps, rotas, observacoes);
  const ativas = enr.filter((o) => o.status !== "descartado");

  const melhores = [...ativas].sort(porNotaDesc).slice(0, 8);

  const businessGatilho = ativas
    .filter((o) => o.cabine === "business" && o.gatilhos.algumDeCompra)
    .sort(porNotaDesc);

  const proximasAcoes = enr
    .filter((o) => o.status === "comprar" || o.status === "comparar")
    .sort(porNotaDesc);

  const descartadas = enr.filter((o) => o.status === "descartado");

  // Distribuição por nota (1..10)
  const porNota = Array.from({ length: 10 }, (_, i) => {
    const nota = i + 1;
    return { nota, total: enr.filter((o) => o.pontuacao.nota === nota).length };
  });

  const contar = (chave: (o: OportunidadeEnriquecida) => string) => {
    const mapa = new Map<string, number>();
    for (const o of enr) mapa.set(chave(o), (mapa.get(chave(o)) ?? 0) + 1);
    return [...mapa.entries()]
      .map(([k, total]) => ({ chave: k, total }))
      .sort((a, b) => b.total - a.total);
  };

  const porCabine = contar((o) => o.cabine);
  const porOrigem = contar((o) => o.origem);

  // Rotas com maior potencial (melhor nota por par origem > destino)
  const rotasMap = new Map<
    string,
    { origem: string; destino: string; melhorNota: number; total: number }
  >();
  for (const o of ativas) {
    const chave = `${o.origem} > ${o.destino}`;
    const atual = rotasMap.get(chave);
    if (!atual) {
      rotasMap.set(chave, {
        origem: o.origem,
        destino: o.destino,
        melhorNota: o.pontuacao.nota,
        total: 1,
      });
    } else {
      atual.melhorNota = Math.max(atual.melhorNota, o.pontuacao.nota);
      atual.total += 1;
    }
  }
  const rotasPotencial = [...rotasMap.values()].sort(
    (a, b) => b.melhorNota - a.melhorNota,
  );

  const fortesOportunidades = detectarFortesOportunidades(observacoes, rotas);

  return ok({
    totais: {
      oportunidades: enr.length,
      ativas: ativas.length,
      rotas: rotas.length,
      alertasAtivos: alertas.filter((a) => a.ativo).length,
      observacoes: observacoes.length,
    },
    fortesOportunidades,
    melhores,
    businessGatilho,
    proximasAcoes,
    descartadas,
    porNota,
    porCabine,
    porOrigem,
    rotasPotencial,
  });
  } catch (e) {
    return tratarErro(e);
  }
}
