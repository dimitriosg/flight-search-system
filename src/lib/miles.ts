// Cálculo automático do valor por milha (seção 5 / item 3 do prompt).
//
//   valor_por_milha = (preco_cash - taxas_resgate) / milhas_necessarias
//
// Interpretação (em € por milha):
//   > 0,020          excelente
//   0,015 a 0,020    bom
//   0,010 a 0,015    aceitável
//   < 0,010          fraco

export type QualidadeMilha = "excelente" | "bom" | "aceitavel" | "fraco";

export interface ResultadoMilha {
  valorPorMilha: number;
  qualidade: QualidadeMilha;
}

/**
 * Retorna o valor por milha, ou null quando não há dados suficientes
 * (sem milhas, sem preço cash de referência, ou milhas <= 0).
 */
export function valorPorMilha(
  precoCash: number | null | undefined,
  taxas: number | null | undefined,
  milhasNecessarias: number | null | undefined,
): number | null {
  if (
    precoCash == null ||
    milhasNecessarias == null ||
    milhasNecessarias <= 0
  ) {
    return null;
  }
  const taxasReais = taxas ?? 0;
  return (precoCash - taxasReais) / milhasNecessarias;
}

export function classificarValorPorMilha(
  valor: number | null,
): QualidadeMilha | null {
  if (valor == null) return null;
  if (valor > 0.02) return "excelente";
  if (valor >= 0.015) return "bom";
  if (valor >= 0.01) return "aceitavel";
  return "fraco";
}

export function calcularMilha(
  precoCash: number | null | undefined,
  taxas: number | null | undefined,
  milhasNecessarias: number | null | undefined,
): ResultadoMilha | null {
  const valor = valorPorMilha(precoCash, taxas, milhasNecessarias);
  if (valor == null) return null;
  const qualidade = classificarValorPorMilha(valor)!;
  return { valorPorMilha: valor, qualidade };
}

export const ROTULO_QUALIDADE_MILHA: Record<QualidadeMilha, string> = {
  excelente: "Excelente",
  bom: "Bom",
  aceitavel: "Aceitável",
  fraco: "Fraco",
};
