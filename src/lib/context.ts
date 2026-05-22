// Constrói o contexto histórico de uma rota a partir das oportunidades já
// cadastradas: média de preço por cabine e baseline de economy.
// Lógica pura (sem Prisma) para permitir testes isolados.

import type { ContextoRota } from "./types";

export interface AmostraPreco {
  id?: string;
  origem: string;
  destino: string;
  cabine: string;
  precoCash: number | null;
}

interface Alvo {
  id?: string;
  origem: string;
  destino: string;
  cabine: string;
}

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function precosDe(
  amostras: AmostraPreco[],
  origem: string,
  destino: string,
  cabine: string,
  excluirId?: string,
): number[] {
  return amostras
    .filter(
      (a) =>
        a.origem === origem &&
        a.destino === destino &&
        a.cabine === cabine &&
        a.precoCash != null &&
        (excluirId == null || a.id !== excluirId),
    )
    .map((a) => a.precoCash as number);
}

/**
 * @param precoMedioReferencia média manual definida na rota (tem prioridade).
 */
export function construirContexto(
  alvo: Alvo,
  amostras: AmostraPreco[],
  precoMedioReferencia?: number | null,
): ContextoRota {
  const precosCabine = precosDe(
    amostras,
    alvo.origem,
    alvo.destino,
    alvo.cabine,
    alvo.id,
  );
  const precoMedioCabine =
    precoMedioReferencia != null && precoMedioReferencia > 0
      ? precoMedioReferencia
      : media(precosCabine);

  const precosEconomy = precosDe(
    amostras,
    alvo.origem,
    alvo.destino,
    "economy",
    alvo.cabine === "economy" ? alvo.id : undefined,
  );

  return {
    precoMedioCabine,
    precoEconomyBaseline: media(precosEconomy),
    amostras: precosCabine.length,
  };
}
