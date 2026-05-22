// Sistema de pontuação do deal (seção 7 / item 4 do prompt). Nota de 1 a 10.
//
// Modelo aditivo e transparente: parte de uma base neutra (50) e soma/subtrai
// pontos por fator. O total (0..100) é mapeado para 1..10. Cada fator devolve
// seu detalhe para que a interface possa explicar "por que" da nota.
//
// Calibragem conferida contra os exemplos do documento:
//   Economy €850 + Business €2.000  -> nota ~8 ("forte candidato")
//   Economy €850 + Business €4.000  -> nota ~5 ("preço normal")

import type { ContextoRota, OportunidadeCore } from "./types";
import { calcularMilha } from "./miles";

export interface FatorPontuacao {
  fator: string;
  pontos: number;
  detalhe?: string;
}

export interface ResultadoPontuacao {
  nota: number; // 1..10
  pontosBrutos: number; // 0..100
  rotulo: string;
  fatores: FatorPontuacao[];
}

const BASE = 50;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const euro = (v: number) => `€${Math.round(v).toLocaleString("pt-BR")}`;

/** Pontos pelo preço cash em relação ao histórico ou à baseline da economy. */
function fatorPreco(
  opp: OportunidadeCore,
  ctx: ContextoRota,
): FatorPontuacao {
  const { precoCash } = opp;
  if (precoCash == null) {
    return { fator: "Preço vs histórico", pontos: 0, detalhe: "Sem preço cash" };
  }

  // Preferimos a média da mesma cabine quando existe histórico.
  if (ctx.precoMedioCabine != null && ctx.precoMedioCabine > 0) {
    const ratio = precoCash / ctx.precoMedioCabine;
    const pontos = clamp(Math.round((1 - ratio) * 100), -30, 40);
    const dif = Math.round((1 - ratio) * 100);
    return {
      fator: "Preço vs histórico",
      pontos,
      detalhe:
        dif >= 0
          ? `${dif}% abaixo da média (${euro(ctx.precoMedioCabine)})`
          : `${-dif}% acima da média (${euro(ctx.precoMedioCabine)})`,
    };
  }

  // Sem histórico: usa a economy como baseline (gatilhos da seção 5).
  if (ctx.precoEconomyBaseline != null && ctx.precoEconomyBaseline > 0) {
    const ratio = precoCash / ctx.precoEconomyBaseline;
    const r = ratio.toFixed(1);
    if (opp.cabine === "business") {
      let pontos = -10;
      if (ratio <= 2) pontos = 30;
      else if (ratio <= 2.5) pontos = 18;
      else if (ratio <= 3) pontos = 5;
      return {
        fator: "Preço vs economy",
        pontos,
        detalhe: `Business a ${r}× a economy (${euro(ctx.precoEconomyBaseline)})`,
      };
    }
    if (opp.cabine === "premium") {
      let pontos = -5;
      if (ratio <= 1.3) pontos = 20;
      else if (ratio <= 1.5) pontos = 10;
      return {
        fator: "Preço vs economy",
        pontos,
        detalhe: `Premium a ${r}× a economy (${euro(ctx.precoEconomyBaseline)})`,
      };
    }
    // economy comparada à própria baseline
    const pontos = clamp(Math.round((1 - ratio) * 100), -30, 40);
    return {
      fator: "Preço vs economy",
      pontos,
      detalhe: `${r}× a baseline (${euro(ctx.precoEconomyBaseline)})`,
    };
  }

  return {
    fator: "Preço vs histórico",
    pontos: 0,
    detalhe: "Sem referência (cadastre mais oportunidades nesta rota)",
  };
}

export function pontuarDeal(
  opp: OportunidadeCore,
  ctx: ContextoRota,
): ResultadoPontuacao {
  const fatores: FatorPontuacao[] = [];

  fatores.push(fatorPreco(opp, ctx));

  // Valor por milha (quando aplicável)
  const milha = calcularMilha(opp.precoCash, opp.taxas, opp.milhasNecessarias);
  if (milha) {
    const mapa = { excelente: 20, bom: 12, aceitavel: 3, fraco: -10 } as const;
    fatores.push({
      fator: "Valor por milha",
      pontos: mapa[milha.qualidade],
      detalhe: `€${milha.valorPorMilha.toFixed(4)}/milha (${milha.qualidade})`,
    });
  }

  // Compra direta com a companhia
  fatores.push({
    fator: "Compra direta",
    pontos: opp.compraDireta ? 4 : -3,
    detalhe: opp.compraDireta ? "Direto com a companhia" : "Via terceiros",
  });

  // Bagagem incluída
  fatores.push({
    fator: "Bagagem",
    pontos: opp.bagagemIncluida ? 3 : -2,
    detalhe: opp.bagagemIncluida ? "Incluída" : "Não incluída / não clara",
  });

  // Escalas
  let pontosEscala = 0;
  if (opp.escalas === 0) pontosEscala = 5;
  else if (opp.escalas === 1) pontosEscala = 0;
  else if (opp.escalas === 2) pontosEscala = -5;
  else pontosEscala = -10;
  fatores.push({
    fator: "Escalas",
    pontos: pontosEscala,
    detalhe: `${opp.escalas} escala(s)`,
  });

  // Duração total
  if (opp.duracaoMinutos != null) {
    let pontosDur = -7;
    if (opp.duracaoMinutos <= 840) pontosDur = 2;
    else if (opp.duracaoMinutos <= 1080) pontosDur = 0;
    else if (opp.duracaoMinutos <= 1440) pontosDur = -3;
    const h = Math.floor(opp.duracaoMinutos / 60);
    const m = opp.duracaoMinutos % 60;
    fatores.push({
      fator: "Duração",
      pontos: pontosDur,
      detalhe: `${h}h${m ? ` ${m}min` : ""}`,
    });
  }

  // Risco de bilhetes separados
  if (opp.bilhetesSeparados) {
    let pontos = -8;
    let detalhe = "Bilhetes separados";
    if (opp.conexaoHoras != null && opp.conexaoHoras < 6) {
      pontos -= 6;
      detalhe = `Bilhetes separados, conexão de ${opp.conexaoHoras}h (< 6h)`;
    }
    fatores.push({ fator: "Bilhetes separados", pontos, detalhe });
  }

  // Flexibilidade de cancelamento/alteração
  const flexPts =
    opp.flexCancelamento === "flexivel"
      ? 4
      : opp.flexCancelamento === "rigida"
        ? -2
        : -1;
  fatores.push({
    fator: "Flexibilidade",
    pontos: flexPts,
    detalhe: opp.flexCancelamento,
  });

  // Prioridade de cabine (business é a prioridade declarada do usuário)
  const cabinePts =
    opp.cabine === "business" ? 2 : opp.cabine === "premium" ? 1 : 0;
  fatores.push({
    fator: "Cabine",
    pontos: cabinePts,
    detalhe: opp.cabine,
  });

  const soma = fatores.reduce((acc, f) => acc + f.pontos, 0);
  const pontosBrutos = clamp(BASE + soma, 0, 100);
  const nota = clamp(Math.round(pontosBrutos / 10), 1, 10);

  return { nota, pontosBrutos, rotulo: rotuloNota(nota), fatores };
}

/** Interpretação da nota (escala da seção 7). */
export function rotuloNota(nota: number): string {
  if (nota >= 10) return "Comprar agora";
  if (nota >= 8) return "Forte candidato";
  if (nota >= 6) return "Bom, mas comparar antes";
  if (nota >= 4) return "Preço normal";
  return "Ruim ou irrelevante";
}

/** Cor semântica para a interface (Tailwind). */
export function corNota(nota: number): string {
  if (nota >= 10) return "emerald";
  if (nota >= 8) return "green";
  if (nota >= 6) return "sky";
  if (nota >= 4) return "amber";
  return "rose";
}
