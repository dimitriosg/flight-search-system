// Constantes do domínio, derivadas diretamente do documento do sistema.
// Aeroportos, cabines, programas de milhas e plataformas de busca.

export type GrupoAeroporto =
  | "Origem principal"
  | "Origens alternativas"
  | "Hubs europeus"
  | "Destinos no Brasil";

export interface Aeroporto {
  codigo: string;
  cidade: string;
  grupo: GrupoAeroporto;
}

export const AEROPORTOS: Aeroporto[] = [
  // Origem principal
  { codigo: "ATH", cidade: "Atenas", grupo: "Origem principal" },
  // Origens alternativas próximas
  { codigo: "SKG", cidade: "Thessaloniki", grupo: "Origens alternativas" },
  { codigo: "IST", cidade: "Istanbul", grupo: "Origens alternativas" },
  { codigo: "SOF", cidade: "Sofia", grupo: "Origens alternativas" },
  { codigo: "BEG", cidade: "Belgrade", grupo: "Origens alternativas" },
  { codigo: "TIA", cidade: "Tirana", grupo: "Origens alternativas" },
  { codigo: "LCA", cidade: "Larnaca", grupo: "Origens alternativas" },
  // Hubs europeus fortes para Brasil/LATAM
  { codigo: "LIS", cidade: "Lisboa", grupo: "Hubs europeus" },
  { codigo: "MAD", cidade: "Madrid", grupo: "Hubs europeus" },
  { codigo: "BCN", cidade: "Barcelona", grupo: "Hubs europeus" },
  { codigo: "FCO", cidade: "Roma", grupo: "Hubs europeus" },
  { codigo: "MXP", cidade: "Milão", grupo: "Hubs europeus" },
  { codigo: "CDG", cidade: "Paris", grupo: "Hubs europeus" },
  { codigo: "AMS", cidade: "Amsterdam", grupo: "Hubs europeus" },
  { codigo: "FRA", cidade: "Frankfurt", grupo: "Hubs europeus" },
  { codigo: "MUC", cidade: "Munich", grupo: "Hubs europeus" },
  { codigo: "ZRH", cidade: "Zurich", grupo: "Hubs europeus" },
  { codigo: "VIE", cidade: "Vienna", grupo: "Hubs europeus" },
  { codigo: "LHR", cidade: "London", grupo: "Hubs europeus" },
  // Destinos principais no Brasil
  { codigo: "GRU", cidade: "São Paulo", grupo: "Destinos no Brasil" },
  { codigo: "GIG", cidade: "Rio de Janeiro", grupo: "Destinos no Brasil" },
  { codigo: "VCP", cidade: "Campinas", grupo: "Destinos no Brasil" },
  { codigo: "CNF", cidade: "Belo Horizonte", grupo: "Destinos no Brasil" },
  { codigo: "SSA", cidade: "Salvador", grupo: "Destinos no Brasil" },
  { codigo: "FOR", cidade: "Fortaleza", grupo: "Destinos no Brasil" },
  { codigo: "REC", cidade: "Recife", grupo: "Destinos no Brasil" },
];

export function rotuloAeroporto(codigo: string): string {
  const a = AEROPORTOS.find((x) => x.codigo === codigo);
  return a ? `${a.codigo} · ${a.cidade}` : codigo;
}

export type Cabine = "economy" | "premium" | "business";

export const CABINES: { valor: Cabine; rotulo: string; prioridade: number }[] = [
  { valor: "business", rotulo: "Business", prioridade: 1 },
  { valor: "premium", rotulo: "Premium Economy", prioridade: 2 },
  { valor: "economy", rotulo: "Economy", prioridade: 3 },
];

export function rotuloCabine(valor: string): string {
  return CABINES.find((c) => c.valor === valor)?.rotulo ?? valor;
}

// Programas de milhas recomendados (Caminho B)
export const PROGRAMAS_MILHAS = [
  "Aegean Miles+Bonus",
  "TAP Miles&Go",
  "LATAM Pass",
  "Smiles",
  "Azul",
  "Iberia Plus",
  "LifeMiles",
  "British Airways Executive Club",
  "Air France KLM Flying Blue",
] as const;

// Plataformas para busca e alertas (Caminho A + ferramentas de milhas)
export const PLATAFORMAS = [
  "Google Flights",
  "Skyscanner",
  "KAYAK",
  "Momondo",
  "Site da companhia",
  "Seats.aero",
  "AwardFares",
] as const;

export const STATUS_OPORTUNIDADE = [
  "observar",
  "comparar",
  "comprar",
  "descartado",
] as const;
export type StatusOportunidade = (typeof STATUS_OPORTUNIDADE)[number];

export const FLEX_CANCELAMENTO = [
  "flexivel",
  "rigida",
  "desconhecida",
] as const;
export type FlexCancelamento = (typeof FLEX_CANCELAMENTO)[number];

export function rotuloStatus(status: string): string {
  const mapa: Record<string, string> = {
    observar: "Observar",
    comparar: "Comparar",
    comprar: "Comprar",
    descartado: "Descartado",
  };
  return mapa[status] ?? status;
}
