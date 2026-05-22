// Gatilhos de compra (seção 5 do documento).
// Avalia condições objetivas de compra para passagem em dinheiro e milhas.

import type { ContextoRota, OportunidadeCore } from "./types";
import { calcularMilha } from "./miles";

export interface Gatilho {
  codigo: string;
  descricao: string;
  atingido: boolean;
  /** Quando atingido, representa um sinal objetivo de compra. */
  deCompra: boolean;
  detalhe?: string;
}

export interface ResultadoGatilhos {
  gatilhos: Gatilho[];
  algumDeCompra: boolean;
}

const euro = (v: number) => `€${Math.round(v).toLocaleString("pt-BR")}`;

/** Rota longa = voo de longo curso (Europa → Brasil). Assume longa se duração desconhecida. */
export function rotaLonga(duracaoMinutos: number | null | undefined): boolean {
  if (duracaoMinutos == null) return true;
  return duracaoMinutos >= 600; // >= 10h
}

export function avaliarGatilhos(
  opp: OportunidadeCore,
  ctx: ContextoRota,
): ResultadoGatilhos {
  const gatilhos: Gatilho[] = [];
  const { precoCash } = opp;
  const { precoMedioCabine, precoEconomyBaseline } = ctx;

  // ---- Gatilhos em dinheiro ----
  if (precoCash != null) {
    if (opp.cabine === "economy" && precoMedioCabine != null) {
      const alvo = precoMedioCabine * 0.8;
      gatilhos.push({
        codigo: "economy_abaixo_media",
        descricao: "Economy 20% abaixo do preço médio observado",
        atingido: precoCash <= alvo,
        deCompra: true,
        detalhe: `Alvo ≤ ${euro(alvo)} (média ${euro(precoMedioCabine)})`,
      });
    }

    if (opp.cabine === "premium" && precoEconomyBaseline != null) {
      const alvo = precoEconomyBaseline * 1.5;
      gatilhos.push({
        codigo: "premium_ate_50",
        descricao: "Premium Economy até 50% acima da Economy",
        atingido: precoCash <= alvo,
        deCompra: true,
        detalhe: `Alvo ≤ ${euro(alvo)} (economy ${euro(precoEconomyBaseline)})`,
      });
    }

    if (opp.cabine === "business" && precoEconomyBaseline != null) {
      const alvo25 = precoEconomyBaseline * 2.5;
      gatilhos.push({
        codigo: "business_ate_2_5x",
        descricao: "Business até 2,5× o preço da Economy",
        atingido: precoCash <= alvo25,
        deCompra: true,
        detalhe: `Alvo ≤ ${euro(alvo25)} (economy ${euro(precoEconomyBaseline)})`,
      });

      if (rotaLonga(opp.duracaoMinutos)) {
        const alvo3 = precoEconomyBaseline * 3;
        gatilhos.push({
          codigo: "business_ate_3x_longa",
          descricao: "Business até 3× a Economy em rota longa",
          atingido: precoCash <= alvo3,
          deCompra: true,
          detalhe: `Alvo ≤ ${euro(alvo3)} em rota longa`,
        });
      }
    }

    if (precoMedioCabine != null) {
      const alvoAnormal = precoMedioCabine * 0.6;
      gatilhos.push({
        codigo: "preco_anormal",
        descricao: "Preço claramente anormal (muito abaixo da média)",
        atingido: precoCash <= alvoAnormal,
        deCompra: true,
        detalhe: `Alvo ≤ ${euro(alvoAnormal)} (40% abaixo da média)`,
      });
    }
  }

  // Condição de compra favorável (preço com gatilho + conexão aceitável + compra direta).
  const precoComGatilho = gatilhos.some((g) => g.atingido && g.deCompra);
  gatilhos.push({
    codigo: "compra_segura",
    descricao: "Conexão aceitável e compra direta com a companhia",
    atingido:
      precoComGatilho &&
      opp.compraDireta &&
      !opp.bilhetesSeparados &&
      opp.escalas <= 1,
    deCompra: false,
    detalhe: "Reforça a decisão quando o preço já é bom",
  });

  // ---- Gatilhos com milhas ----
  if (opp.milhasNecessarias != null && opp.milhasNecessarias > 0) {
    const milha = calcularMilha(opp.precoCash, opp.taxas, opp.milhasNecessarias);
    if (milha) {
      const v = `€${milha.valorPorMilha.toFixed(4)}/milha`;
      gatilhos.push({
        codigo: "milhas_valor",
        descricao: "Valor por milha bom ou excelente",
        atingido:
          milha.qualidade === "excelente" || milha.qualidade === "bom",
        deCompra: true,
        detalhe: `${v} (${milha.qualidade})`,
      });
    } else {
      gatilhos.push({
        codigo: "milhas_valor",
        descricao: "Valor por milha bom ou excelente",
        atingido: false,
        deCompra: true,
        detalhe: "Informe o preço cash equivalente para calcular",
      });
    }
  }

  return {
    gatilhos,
    algumDeCompra: gatilhos.some((g) => g.atingido && g.deCompra),
  };
}
