// Enriquece oportunidades com todos os cálculos derivados:
// valor por milha, pontuação do deal, gatilhos e avisos de segurança.

import type { Oportunidade, Rota, Observacao } from "@prisma/client";
import { calcularMilha, type QualidadeMilha } from "./miles";
import { pontuarDeal, type ResultadoPontuacao } from "./scoring";
import { avaliarGatilhos, type ResultadoGatilhos } from "./triggers";
import { avaliarSeguranca, type AvisoSeguranca } from "./safety";
import { construirContexto, type AmostraPreco } from "./context";
import type { ContextoRota, OportunidadeCore } from "./types";

export type OportunidadeEnriquecida = Oportunidade & {
  valorPorMilha: number | null;
  qualidadeMilha: QualidadeMilha | null;
  pontuacao: ResultadoPontuacao;
  gatilhos: ResultadoGatilhos;
  avisos: AvisoSeguranca[];
  contexto: ContextoRota;
};

function toCore(o: Oportunidade): OportunidadeCore {
  return {
    origem: o.origem,
    destino: o.destino,
    cabine: o.cabine,
    escalas: o.escalas,
    duracaoMinutos: o.duracaoMinutos,
    precoCash: o.precoCash,
    milhasNecessarias: o.milhasNecessarias,
    taxas: o.taxas,
    bagagemIncluida: o.bagagemIncluida,
    compraDireta: o.compraDireta,
    bilhetesSeparados: o.bilhetesSeparados,
    conexaoHoras: o.conexaoHoras,
    flexCancelamento: o.flexCancelamento,
    linkOferta: o.linkOferta,
  };
}

function referenciaDaRota(
  o: Oportunidade,
  rotas: Rota[],
): number | null | undefined {
  const rota = rotas.find(
    (r) =>
      r.origem === o.origem &&
      r.destino === o.destino &&
      r.cabine === o.cabine &&
      r.precoMedioReferencia != null,
  );
  return rota?.precoMedioReferencia;
}

export function enriquecer(
  oportunidades: Oportunidade[],
  rotas: Rota[] = [],
  observacoes: Observacao[] = [],
): OportunidadeEnriquecida[] {
  // O histórico de preços usado para a média combina as observações de
  // monitoramento e os preços cash das próprias oportunidades.
  const amostras: AmostraPreco[] = [
    ...observacoes.map((o) => ({
      id: `obs-${o.id}`,
      origem: o.origem,
      destino: o.destino,
      cabine: o.cabine,
      precoCash: o.precoCash,
    })),
    ...oportunidades.map((o) => ({
      id: o.id,
      origem: o.origem,
      destino: o.destino,
      cabine: o.cabine,
      precoCash: o.precoCash,
    })),
  ];

  return oportunidades.map((o) => {
    const ctx = construirContexto(o, amostras, referenciaDaRota(o, rotas));
    const core = toCore(o);
    const milha = calcularMilha(o.precoCash, o.taxas, o.milhasNecessarias);

    return {
      ...o,
      valorPorMilha: milha?.valorPorMilha ?? null,
      qualidadeMilha: milha?.qualidade ?? null,
      pontuacao: pontuarDeal(core, ctx),
      gatilhos: avaliarGatilhos(core, ctx),
      avisos: avaliarSeguranca(core, ctx),
      contexto: ctx,
    };
  });
}
