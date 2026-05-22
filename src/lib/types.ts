// Tipos compartilhados pela lógica pura (gatilhos, pontuação, segurança).
// Mantidos independentes do Prisma para permitir testes sem banco de dados.

/** Subconjunto dos campos de uma oportunidade usados pelos cálculos. */
export interface OportunidadeCore {
  origem: string;
  destino: string;
  cabine: string;
  escalas: number;
  duracaoMinutos: number | null;
  precoCash: number | null;
  milhasNecessarias: number | null;
  taxas: number;
  bagagemIncluida: boolean;
  compraDireta: boolean;
  bilhetesSeparados: boolean;
  conexaoHoras: number | null;
  flexCancelamento: string;
  linkOferta: string | null;
}

/** Contexto histórico para uma rota + cabine (médias observadas). */
export interface ContextoRota {
  /** Média de preço cash observada para a mesma origem/destino/cabine. */
  precoMedioCabine: number | null;
  /** Preço economy de referência (baseline) para a mesma origem/destino. */
  precoEconomyBaseline: number | null;
  /** Quantidade de oportunidades que sustentam a média da cabine. */
  amostras: number;
}

export const CONTEXTO_VAZIO: ContextoRota = {
  precoMedioCabine: null,
  precoEconomyBaseline: null,
  amostras: 0,
};
