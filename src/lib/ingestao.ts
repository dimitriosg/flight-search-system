// Ponto único de ingestão de alertas.
//
// Hoje a única fonte é o texto colado manualmente. No futuro, fontes como
// Gmail API, encaminhamento de e-mail ou webhooks chamarão `ingerirTexto`
// pela mesma porta — a lógica de parsing/dedupe/score permanece a mesma.
// Nada aqui faz scraping, acessa caixas de e-mail ou compra passagens.

import { parseEmail, type AlertaParseado, type EntradaEmail } from "./emailParser";
import { hashEmail } from "./dedupe";
import type { ObservacaoInput } from "./validation";

export interface ResultadoIngestao {
  parsed: AlertaParseado;
  hash: string;
}

export function ingerirTexto(entrada: EntradaEmail): ResultadoIngestao {
  return { parsed: parseEmail(entrada), hash: hashEmail(entrada.textoBruto) };
}

export interface CamposObservados {
  origem: string;
  destino: string;
  cabine: string;
  preco?: number | null;
  milhasNecessarias?: number | null;
  taxas?: number | null;
  fonte?: string | null;
  observacoes?: string | null;
}

/** Converte campos (parseados ou corrigidos) em dados para criar uma Observacao. */
export function montarObservacao(c: CamposObservados): ObservacaoInput {
  return {
    origem: c.origem,
    destino: c.destino,
    cabine: c.cabine,
    precoCash: c.preco ?? null,
    milhasNecessarias: c.milhasNecessarias ?? null,
    taxas: c.taxas ?? 0,
    fonte: c.fonte ?? null,
    observacoes: c.observacoes ?? null,
  };
}
