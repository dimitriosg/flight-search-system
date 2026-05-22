// Regras de segurança (item 7 do prompt + seção 9 "O que evitar").
// Geram avisos objetivos antes da compra.

import type { ContextoRota, OportunidadeCore } from "./types";

export type NivelAviso = "info" | "aviso" | "critico";

export interface AvisoSeguranca {
  nivel: NivelAviso;
  mensagem: string;
}

export function avaliarSeguranca(
  opp: OportunidadeCore,
  ctx: ContextoRota,
): AvisoSeguranca[] {
  const avisos: AvisoSeguranca[] = [];

  if (opp.bilhetesSeparados) {
    avisos.push({
      nivel: "aviso",
      mensagem:
        "Rota com bilhetes separados: nenhuma proteção da companhia em caso de atraso ou perda de conexão.",
    });
    if (opp.conexaoHoras != null && opp.conexaoHoras < 6) {
      avisos.push({
        nivel: "critico",
        mensagem: `Conexão separada de ${opp.conexaoHoras}h — abaixo do mínimo recomendado de 6h.`,
      });
    }
  }

  if (!opp.compraDireta) {
    avisos.push({
      nivel: "aviso",
      mensagem:
        "Compra não é direta com a companhia. Confirme a tarifa no site oficial antes de pagar.",
    });
  }

  if (
    opp.precoCash != null &&
    ctx.precoMedioCabine != null &&
    ctx.precoMedioCabine > 0 &&
    opp.precoCash <= ctx.precoMedioCabine * 0.5
  ) {
    avisos.push({
      nivel: "aviso",
      mensagem:
        "Preço bom demais para ser verdade (mais de 50% abaixo da média). Pode ser erro tarifário ou golpe — confirme no site oficial.",
    });
  }

  if (!opp.linkOferta || opp.linkOferta.trim() === "") {
    avisos.push({
      nivel: "aviso",
      mensagem: "Oferta sem link verificável.",
    });
  }

  if (!opp.bagagemIncluida) {
    avisos.push({
      nivel: "info",
      mensagem: "Bagagem não incluída ou não esclarecida.",
    });
  }

  if (opp.flexCancelamento === "desconhecida") {
    avisos.push({
      nivel: "info",
      mensagem: "Política de cancelamento/alteração não esclarecida.",
    });
  }

  return avisos;
}
