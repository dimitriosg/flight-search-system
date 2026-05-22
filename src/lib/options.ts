// Opções de <select> derivadas das constantes do domínio.

import {
  AEROPORTOS,
  CABINES,
  PROGRAMAS_MILHAS,
  PLATAFORMAS,
  STATUS_OPORTUNIDADE,
  rotuloStatus,
} from "./constants";

export const opcoesAeroporto = AEROPORTOS.map((a) => ({
  value: a.codigo,
  label: `${a.codigo} · ${a.cidade}`,
}));

export const opcoesCabine = CABINES.map((c) => ({
  value: c.valor,
  label: c.rotulo,
}));

export const opcoesPrograma = [
  { value: "", label: "—" },
  ...PROGRAMAS_MILHAS.map((p) => ({ value: p, label: p })),
];

export const opcoesPlataforma = PLATAFORMAS.map((p) => ({
  value: p,
  label: p,
}));

export const opcoesStatus = STATUS_OPORTUNIDADE.map((s) => ({
  value: s,
  label: rotuloStatus(s),
}));

export const opcoesFlex = [
  { value: "desconhecida", label: "Desconhecida" },
  { value: "flexivel", label: "Flexível" },
  { value: "rigida", label: "Rígida" },
];
