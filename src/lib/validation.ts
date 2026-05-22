// Validação e coerção de dados nos limites do sistema (entrada manual).
// Sem dependências externas: coerção explícita + mensagens por campo.

import {
  CABINES,
  FLEX_CANCELAMENTO,
  STATUS_OPORTUNIDADE,
} from "./constants";

export class ErroValidacao extends Error {
  campos: Record<string, string>;
  constructor(campos: Record<string, string>) {
    super("Dados inválidos");
    this.name = "ErroValidacao";
    this.campos = campos;
  }
}

type Raw = Record<string, unknown>;

const CABINES_VALIDAS = CABINES.map((c) => c.valor) as string[];

function toStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toInt(v: unknown): number | null {
  const n = toNum(v);
  return n == null ? null : Math.trunc(n);
}

function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === "on" || v === 1 || v === "1";
}

function has(raw: Raw, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(raw, key);
}

// ---------- Rota ----------

export interface RotaInput {
  origem: string;
  destino: string;
  cabine: string;
  datasDesejadas: string | null;
  flexibilidadeDias: number;
  precoMaximo: number | null;
  companhiaPreferida: string | null;
  programaMilhas: string | null;
  precoMedioReferencia: number | null;
  observacoes: string | null;
  ativa: boolean;
}

export function validarRota(raw: Raw): RotaInput {
  const erros: Record<string, string> = {};
  const origem = toStr(raw.origem);
  const destino = toStr(raw.destino);
  const cabine = toStr(raw.cabine);

  if (!origem) erros.origem = "Informe a origem.";
  if (!destino) erros.destino = "Informe o destino.";
  if (!cabine || !CABINES_VALIDAS.includes(cabine))
    erros.cabine = "Cabine inválida.";

  if (Object.keys(erros).length) throw new ErroValidacao(erros);

  return {
    origem: origem!,
    destino: destino!,
    cabine: cabine!,
    datasDesejadas: toStr(raw.datasDesejadas) ?? null,
    flexibilidadeDias: toInt(raw.flexibilidadeDias) ?? 0,
    precoMaximo: toNum(raw.precoMaximo),
    companhiaPreferida: toStr(raw.companhiaPreferida) ?? null,
    programaMilhas: toStr(raw.programaMilhas) ?? null,
    precoMedioReferencia: toNum(raw.precoMedioReferencia),
    observacoes: toStr(raw.observacoes) ?? null,
    ativa: has(raw, "ativa") ? toBool(raw.ativa) : true,
  };
}

// ---------- Oportunidade ----------

export interface OportunidadeInput {
  dataBusca?: Date;
  origem: string;
  destino: string;
  cabine: string;
  companhia: string | null;
  escalas: number;
  duracaoMinutos: number | null;
  precoCash: number | null;
  milhasNecessarias: number | null;
  taxas: number;
  bagagemIncluida: boolean;
  linkOferta: string | null;
  compraDireta: boolean;
  bilhetesSeparados: boolean;
  conexaoHoras: number | null;
  flexCancelamento: string;
  observacoes: string | null;
  status: string;
}

export function validarOportunidade(raw: Raw): OportunidadeInput {
  const erros: Record<string, string> = {};
  const origem = toStr(raw.origem);
  const destino = toStr(raw.destino);
  const cabine = toStr(raw.cabine);

  if (!origem) erros.origem = "Informe a origem.";
  if (!destino) erros.destino = "Informe o destino.";
  if (!cabine || !CABINES_VALIDAS.includes(cabine))
    erros.cabine = "Cabine inválida.";

  const precoCash = toNum(raw.precoCash);
  const milhas = toInt(raw.milhasNecessarias);
  if (precoCash == null && milhas == null)
    erros.precoCash = "Informe ao menos o preço cash ou as milhas.";

  const flex = toStr(raw.flexCancelamento) ?? "desconhecida";
  if (!(FLEX_CANCELAMENTO as readonly string[]).includes(flex))
    erros.flexCancelamento = "Flexibilidade inválida.";

  const status = toStr(raw.status) ?? "observar";
  if (!(STATUS_OPORTUNIDADE as readonly string[]).includes(status))
    erros.status = "Status inválido.";

  if (Object.keys(erros).length) throw new ErroValidacao(erros);

  const out: OportunidadeInput = {
    origem: origem!,
    destino: destino!,
    cabine: cabine!,
    companhia: toStr(raw.companhia) ?? null,
    escalas: toInt(raw.escalas) ?? 0,
    duracaoMinutos: toInt(raw.duracaoMinutos),
    precoCash,
    milhasNecessarias: milhas,
    taxas: toNum(raw.taxas) ?? 0,
    bagagemIncluida: toBool(raw.bagagemIncluida),
    linkOferta: toStr(raw.linkOferta) ?? null,
    compraDireta: toBool(raw.compraDireta),
    bilhetesSeparados: toBool(raw.bilhetesSeparados),
    conexaoHoras: toNum(raw.conexaoHoras),
    flexCancelamento: flex,
    observacoes: toStr(raw.observacoes) ?? null,
    status,
  };

  const data = toStr(raw.dataBusca);
  if (data) {
    const d = new Date(data);
    if (!Number.isNaN(d.getTime())) out.dataBusca = d;
  }
  return out;
}

// Atualização parcial de status (usada na lista de oportunidades).
export function validarStatus(raw: Raw): { status: string } {
  const status = toStr(raw.status);
  if (!status || !(STATUS_OPORTUNIDADE as readonly string[]).includes(status))
    throw new ErroValidacao({ status: "Status inválido." });
  return { status };
}

// ---------- Observação de preço ----------

export interface ObservacaoInput {
  dataObservacao?: Date;
  origem: string;
  destino: string;
  cabine: string;
  precoCash: number | null;
  milhasNecessarias: number | null;
  taxas: number;
  fonte: string | null;
  observacoes: string | null;
}

export function validarObservacao(raw: Raw): ObservacaoInput {
  const erros: Record<string, string> = {};
  const origem = toStr(raw.origem);
  const destino = toStr(raw.destino);
  const cabine = toStr(raw.cabine);

  if (!origem) erros.origem = "Informe a origem.";
  if (!destino) erros.destino = "Informe o destino.";
  if (!cabine || !CABINES_VALIDAS.includes(cabine))
    erros.cabine = "Cabine inválida.";

  const precoCash = toNum(raw.precoCash);
  const milhas = toInt(raw.milhasNecessarias);
  if (precoCash == null && milhas == null)
    erros.precoCash = "Informe o preço cash ou as milhas observadas.";

  if (Object.keys(erros).length) throw new ErroValidacao(erros);

  const out: ObservacaoInput = {
    origem: origem!,
    destino: destino!,
    cabine: cabine!,
    precoCash,
    milhasNecessarias: milhas,
    taxas: toNum(raw.taxas) ?? 0,
    fonte: toStr(raw.fonte) ?? null,
    observacoes: toStr(raw.observacoes) ?? null,
  };

  const data = toStr(raw.dataObservacao);
  if (data) {
    const d = new Date(data);
    if (!Number.isNaN(d.getTime())) out.dataObservacao = d;
  }
  return out;
}

// ---------- Alerta ----------

export interface AlertaInput {
  plataforma: string;
  rota: string;
  cabine: string;
  datas: string | null;
  linkAlerta: string | null;
  frequenciaDias: number;
  ativo: boolean;
}

export function validarAlerta(raw: Raw): AlertaInput {
  const erros: Record<string, string> = {};
  const plataforma = toStr(raw.plataforma);
  const rota = toStr(raw.rota);
  const cabine = toStr(raw.cabine);

  if (!plataforma) erros.plataforma = "Informe a plataforma.";
  if (!rota) erros.rota = "Informe a rota.";
  if (!cabine || !CABINES_VALIDAS.includes(cabine))
    erros.cabine = "Cabine inválida.";

  if (Object.keys(erros).length) throw new ErroValidacao(erros);

  return {
    plataforma: plataforma!,
    rota: rota!,
    cabine: cabine!,
    datas: toStr(raw.datas) ?? null,
    linkAlerta: toStr(raw.linkAlerta) ?? null,
    frequenciaDias: toInt(raw.frequenciaDias) ?? 1,
    ativo: has(raw, "ativo") ? toBool(raw.ativo) : true,
  };
}
