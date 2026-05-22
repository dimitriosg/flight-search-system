// Detecção de fortes oportunidades a partir de Observacoes.
//
// Cada preço observado é pontuado por rota+cabine contra o histórico e os
// gatilhos. Os fortes (nota alta ou gatilho de compra) sobem ao dashboard como
// "Ação necessária". NÃO cria Oportunidade nem compra nada.

import type { Observacao, Rota } from "@prisma/client";
import { pontuarObservado, type ResultadoPontuacao } from "./scoring";
import { avaliarGatilhos } from "./triggers";
import { construirContexto, type AmostraPreco } from "./context";
import type { OportunidadeCore } from "./types";

/** Nota mínima para considerar uma oportunidade "forte" (Ação necessária). */
export const LIMIAR_FORTE = 8;

export interface ForteOportunidade {
  observacaoId: string;
  origem: string;
  destino: string;
  cabine: string;
  precoCash: number | null;
  milhasNecessarias: number | null;
  dataObservacao: Date;
  fonte: string | null;
  pontuacao: ResultadoPontuacao;
  gatilho: boolean;
}

function paraCore(o: Observacao): OportunidadeCore {
  return {
    origem: o.origem,
    destino: o.destino,
    cabine: o.cabine,
    escalas: 0,
    duracaoMinutos: null,
    precoCash: o.precoCash,
    milhasNecessarias: o.milhasNecessarias,
    taxas: o.taxas,
    bagagemIncluida: false,
    compraDireta: false,
    bilhetesSeparados: false,
    conexaoHoras: null,
    flexCancelamento: "desconhecida",
    linkOferta: null,
  };
}

export function detectarFortesOportunidades(
  observacoes: Observacao[],
  rotas: Rota[] = [],
  limiar: number = LIMIAR_FORTE,
): ForteOportunidade[] {
  const amostras: AmostraPreco[] = observacoes.map((o) => ({
    id: o.id,
    origem: o.origem,
    destino: o.destino,
    cabine: o.cabine,
    precoCash: o.precoCash,
  }));

  const referencia = (o: Observacao) =>
    rotas.find(
      (r) =>
        r.origem === o.origem &&
        r.destino === o.destino &&
        r.cabine === o.cabine &&
        r.precoMedioReferencia != null,
    )?.precoMedioReferencia;

  // Melhor (maior nota) observação por rota+cabine.
  const melhorPorGrupo = new Map<string, ForteOportunidade>();
  for (const o of observacoes) {
    const ctx = construirContexto(o, amostras, referencia(o));
    const pontuacao = pontuarObservado(o, ctx);
    const gatilho = avaliarGatilhos(paraCore(o), ctx).algumDeCompra;

    const candidato: ForteOportunidade = {
      observacaoId: o.id,
      origem: o.origem,
      destino: o.destino,
      cabine: o.cabine,
      precoCash: o.precoCash,
      milhasNecessarias: o.milhasNecessarias,
      dataObservacao: o.dataObservacao,
      fonte: o.fonte,
      pontuacao,
      gatilho,
    };

    const chave = `${o.origem}>${o.destino}>${o.cabine}`;
    const atual = melhorPorGrupo.get(chave);
    if (!atual || candidato.pontuacao.nota > atual.pontuacao.nota) {
      melhorPorGrupo.set(chave, candidato);
    }
  }

  return [...melhorPorGrupo.values()]
    .filter((f) => f.pontuacao.nota >= limiar || f.gatilho)
    .sort((a, b) => b.pontuacao.nota - a.pontuacao.nota);
}
