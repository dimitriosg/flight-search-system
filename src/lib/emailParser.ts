// Parser de alertas de e-mail (isolado, sem rede e sem scraping).
// Opera apenas sobre o texto que o usuário cola. Extrai rota, cabine, preço,
// moeda e datas, e estima uma confiança 0..1.

import { AEROPORTOS } from "./constants";

export interface EntradaEmail {
  textoBruto: string;
  assunto?: string | null;
  remetente?: string | null;
}

export interface AlertaParseado {
  fonte: string | null;
  origem: string | null;
  destino: string | null;
  cabine: string | null;
  preco: number | null;
  moeda: string | null;
  dataIda: string | null; // ISO yyyy-mm-dd
  dataVolta: string | null;
  confianca: number; // 0..1
  camposExtraidos: string[];
}

/** Acima deste valor a confiança é considerada alta (auto-criar Observação). */
export const LIMIAR_CONFIANCA = 0.7;

const CODIGOS = new Set(AEROPORTOS.map((a) => a.codigo));

// Aliases de cidade (inglês + português) → código IATA.
const ALIASES_EXTRA: Record<string, string> = {
  athens: "ATH",
  atenas: "ATH",
  istanbul: "IST",
  belgrade: "BEG",
  lisbon: "LIS",
  rome: "FCO",
  milan: "MXP",
  munich: "MUC",
  zurich: "ZRH",
  vienna: "VIE",
  london: "LHR",
  "sao paulo": "GRU",
  guarulhos: "GRU",
  rio: "GIG",
  "rio de janeiro": "GIG",
};

const ALIASES: Record<string, string> = (() => {
  const m: Record<string, string> = { ...ALIASES_EXTRA };
  for (const a of AEROPORTOS) m[a.cidade.toLowerCase()] = a.codigo;
  return m;
})();

const PROVEDORES: { nome: string; padrao: RegExp }[] = [
  { nome: "Google Flights", padrao: /google\s*flights|google\.com/i },
  { nome: "Skyscanner", padrao: /skyscanner/i },
  { nome: "KAYAK", padrao: /kayak/i },
  { nome: "Momondo", padrao: /momondo/i },
  { nome: "Seats.aero", padrao: /seats\.aero/i },
  { nome: "AwardFares", padrao: /awardfares/i },
];

const MESES: Record<string, number> = {
  jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, may: 5, mai: 5,
  jun: 6, jul: 7, aug: 8, ago: 8, sep: 9, set: 9, oct: 10, out: 10,
  nov: 11, dec: 12, dez: 12,
};

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function detectarFonte(texto: string): string | null {
  for (const p of PROVEDORES) if (p.padrao.test(texto)) return p.nome;
  return null;
}

/** Códigos de aeroporto encontrados, na ordem em que aparecem no texto. */
export function detectarAeroportos(texto: string): string[] {
  const achados: { code: string; idx: number }[] = [];

  const reIata = /\b([A-Z]{3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = reIata.exec(texto))) {
    if (CODIGOS.has(m[1])) achados.push({ code: m[1], idx: m.index });
  }

  for (const [alias, code] of Object.entries(ALIASES)) {
    const re = new RegExp(`\\b${escapar(alias)}\\b`, "i");
    const mm = re.exec(texto);
    if (mm) achados.push({ code, idx: mm.index });
  }

  const primeiroIndice = new Map<string, number>();
  for (const a of achados) {
    const atual = primeiroIndice.get(a.code);
    if (atual == null || a.idx < atual) primeiroIndice.set(a.code, a.idx);
  }
  return [...primeiroIndice.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([code]) => code);
}

export function detectarCabine(texto: string): string | null {
  const t = texto.toLowerCase();
  if (/\b(business|executiv\w*)\b/.test(t)) return "business";
  if (/premium\s*economy|\bpremium\b/.test(t)) return "premium";
  if (/\b(economy|econ[oô]mic\w*|coach)\b/.test(t)) return "economy";
  return null;
}

function codigoMoeda(simbolo: string): string | null {
  const s = simbolo.toLowerCase();
  if (/r\$|brl|reais/.test(s)) return "BRL";
  if (/€|eur|euro/.test(s)) return "EUR";
  if (/£|gbp/.test(s)) return "GBP";
  if (/\$|usd/.test(s)) return "USD";
  return null;
}

/** Normaliza "2.150,00" / "2,150.00" / "2.150" / "12,500" para número. */
export function normalizarNumero(entrada: string): number | null {
  let s = entrada.replace(/\s/g, "");
  const temPonto = s.includes(".");
  const temVirgula = s.includes(",");

  if (temPonto && temVirgula) {
    const decimal = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    const milhar = decimal === "." ? "," : ".";
    s = s.split(milhar).join("").replace(decimal, ".");
  } else if (temVirgula) {
    const dec = s.split(",").pop() ?? "";
    s = dec.length === 1 || dec.length === 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (temPonto) {
    const dec = s.split(".").pop() ?? "";
    if (dec.length === 3) s = s.replace(/\./g, ""); // milhar (ex.: 2.150)
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function detectarPreco(
  texto: string,
): { preco: number; moeda: string | null } | null {
  interface Candidato { preco: number; moeda: string | null; idx: number }
  const candidatos: Candidato[] = [];

  // Moeda antes do número: €2,150  R$ 9.800  EUR 2150
  const patAntes = /(R\$|US\$|€|£|\$|EUR|USD|BRL|GBP)\s*([\d][\d.,]*\d|\d)/gi;
  let m: RegExpExecArray | null;
  while ((m = patAntes.exec(texto))) {
    const preco = normalizarNumero(m[2]);
    if (preco != null) candidatos.push({ preco, moeda: codigoMoeda(m[1]), idx: m.index });
  }

  // Moeda depois do número: 2150 EUR  9.800 reais (só se ainda não capturado)
  const cobertos = new Set(candidatos.map((c) => c.idx));
  const patDepois = /([\d][\d.,]*\d|\d)\s*(€|£|EUR|USD|BRL|GBP|reais|euros?)/gi;
  while ((m = patDepois.exec(texto))) {
    if (!cobertos.has(m.index)) {
      const preco = normalizarNumero(m[1]);
      if (preco != null) candidatos.push({ preco, moeda: codigoMoeda(m[2]), idx: m.index });
    }
  }

  if (candidatos.length === 0) return null;

  candidatos.sort((a, b) => a.idx - b.idx);
  if (candidatos.length === 1) return { preco: candidatos[0].preco, moeda: candidatos[0].moeda };

  // E-mails "de X para Y" / "was X now Y": preferir preço após palavra de transição.
  // Só ativa quando há mais de um candidato, para não afetar casos simples.
  const kwRe = /\b(?:now|to|para|caiu\s+para|baixou\s+para|por)\s*(R\$|US\$|€|£|\$|EUR|USD|BRL|GBP)/gi;
  while ((m = kwRe.exec(texto))) {
    const idxMoeda = m.index + m[0].length - m[1].length;
    const pref = candidatos.find((c) => c.idx >= idxMoeda - 1 && c.idx <= idxMoeda + 3);
    if (pref) return { preco: pref.preco, moeda: pref.moeda };
  }

  return { preco: candidatos[0].preco, moeda: candidatos[0].moeda };
}

/**
 * Remove "Prices updated …" footer timestamps so they are not treated as
 * travel dates. Handles both own-line and inline occurrences.
 */
function stripMetaTimestamps(texto: string): string {
  return texto.replace(/\bprices?\s+updated\b[^\n]*/gi, "");
}

/**
 * Finds the first 4-digit year in the text (e.g. from the update timestamp)
 * to use as an anchor when inferring years for yearless date ranges.
 */
function inferirAnoBase(texto: string): number {
  const m = /\b(20\d{2})\b/.exec(texto);
  return m ? +m[1] : new Date().getFullYear();
}

function isoValido(ano: number, mes: number, dia: number): boolean {
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 && ano >= 2000 && ano <= 2100;
}

export function detectarDatas(texto: string): string[] {
  // Read anchor year from the ORIGINAL text (may include update timestamps).
  const anchorAno = inferirAnoBase(texto);

  // Strip "Prices updated …" and similar metadata lines so their dates are
  // not mistaken for travel departure/return dates.
  const textoViagem = stripMetaTimestamps(texto);

  const achados: { iso: string; idx: number }[] = [];
  const add = (a: number, m2: number, d: number, idx: number) => {
    if (isoValido(a, m2, d)) {
      achados.push({
        iso: `${a}-${String(m2).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        idx,
      });
    }
  };

  let m: RegExpExecArray | null;

  // yyyy-mm-dd
  const reIso = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while ((m = reIso.exec(textoViagem))) add(+m[1], +m[2], +m[3], m.index);

  // dd/mm/yyyy
  const reDmy = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g;
  while ((m = reDmy.exec(textoViagem))) {
    const ano = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    add(ano, +m[2], +m[1], m.index);
  }

  // "10 fevereiro 2027" or "10 de fevereiro de 2027"
  const reDiaMes = /\b(\d{1,2})(?:\s+de)?\s+([a-zç]{3,9})\.?(?:\s+de)?\s+(\d{4})\b/gi;
  while ((m = reDiaMes.exec(textoViagem))) {
    const mes = MESES[m[2].slice(0, 3).toLowerCase()];
    if (mes) add(+m[3], mes, +m[1], m.index);
  }

  // "Oct 12, 2026" or "March 8 2027"
  const reMesDia = /\b([a-zç]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/gi;
  while ((m = reMesDia.exec(textoViagem))) {
    const mes = MESES[m[1].slice(0, 3).toLowerCase()];
    if (mes) add(+m[3], mes, +m[2], m.index);
  }

  // "Tue 22 Dec–Fri 8 Jan" — date range without year (Google Flights style).
  // Year is inferred from anchorAno; if return month < departure month the
  // return year rolls over to anchorAno + 1.
  const reRange =
    /\b(?:[a-z]{2,3}\.?\s+)?(\d{1,2})\s+([a-z]{3,9})[–\-]\s*(?:[a-z]{2,3}\.?\s+)?(\d{1,2})\s+([a-z]{3,9})\b/gi;
  while ((m = reRange.exec(textoViagem))) {
    const mesPartida = MESES[m[2].slice(0, 3).toLowerCase()];
    const mesVolta   = MESES[m[4].slice(0, 3).toLowerCase()];
    if (!mesPartida || !mesVolta) continue;
    const diaPartida = +m[1];
    const diaVolta   = +m[3];
    const anoPartida = anchorAno;
    const anoVolta   = mesVolta < mesPartida ? anchorAno + 1 : anchorAno;
    add(anoPartida, mesPartida, diaPartida, m.index);
    add(anoVolta,   mesVolta,   diaVolta,   m.index + 1); // +1 → sorts after departure
  }

  achados.sort((a, b) => a.idx - b.idx);
  const unicas: string[] = [];
  for (const a of achados) if (!unicas.includes(a.iso)) unicas.push(a.iso);
  return unicas.slice(0, 2);
}

const PESOS: Record<string, number> = {
  origem: 0.25,
  destino: 0.25,
  preco: 0.3,
  cabine: 0.15,
  dataIda: 0.05,
};

export function parseEmail(entrada: EntradaEmail): AlertaParseado {
  const texto = [entrada.assunto, entrada.remetente, entrada.textoBruto]
    .filter(Boolean)
    .join("\n");

  const aeroportos = detectarAeroportos(texto);
  const origem = aeroportos[0] ?? null;
  const destino = aeroportos[1] ?? null;
  const cabine = detectarCabine(texto);
  const precoInfo = detectarPreco(texto);
  const datas = detectarDatas(texto);

  const camposExtraidos: string[] = [];
  if (origem) camposExtraidos.push("origem");
  if (destino) camposExtraidos.push("destino");
  if (cabine) camposExtraidos.push("cabine");
  if (precoInfo) camposExtraidos.push("preco");
  if (datas[0]) camposExtraidos.push("dataIda");

  const confianca = Math.min(
    1,
    camposExtraidos.reduce((s, c) => s + (PESOS[c] ?? 0), 0),
  );

  return {
    fonte: detectarFonte(texto),
    origem,
    destino,
    cabine,
    preco: precoInfo?.preco ?? null,
    moeda: precoInfo?.moeda ?? null,
    dataIda: datas[0] ?? null,
    dataVolta: datas[1] ?? null,
    confianca: Math.round(confianca * 100) / 100,
    camposExtraidos,
  };
}
