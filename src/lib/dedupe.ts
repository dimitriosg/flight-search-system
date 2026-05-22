// Deduplicação de importações: hash do texto normalizado.

import { createHash } from "node:crypto";

/** Normaliza para comparação: minúsculas, espaços colapsados, sem bordas. */
export function normalizarTexto(texto: string): string {
  return texto.toLowerCase().replace(/\s+/g, " ").trim();
}

/** SHA-256 do texto normalizado — mesmo e-mail colado de novo gera o mesmo hash. */
export function hashEmail(textoBruto: string): string {
  return createHash("sha256").update(normalizarTexto(textoBruto)).digest("hex");
}
