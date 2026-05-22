import { describe, it, expect } from "vitest";
import { avaliarGatilhos, rotaLonga } from "./triggers";
import type { ContextoRota, OportunidadeCore } from "./types";
import { CONTEXTO_VAZIO } from "./types";

function opp(over: Partial<OportunidadeCore> = {}): OportunidadeCore {
  return {
    origem: "ATH",
    destino: "GRU",
    cabine: "business",
    escalas: 1,
    duracaoMinutos: 960,
    precoCash: null,
    milhasNecessarias: null,
    taxas: 0,
    bagagemIncluida: true,
    compraDireta: true,
    bilhetesSeparados: false,
    conexaoHoras: null,
    flexCancelamento: "desconhecida",
    linkOferta: "https://x",
    ...over,
  };
}

function ctx(over: Partial<ContextoRota> = {}): ContextoRota {
  return { ...CONTEXTO_VAZIO, ...over };
}

const pegar = (r: ReturnType<typeof avaliarGatilhos>, codigo: string) =>
  r.gatilhos.find((g) => g.codigo === codigo);

describe("avaliarGatilhos — dinheiro", () => {
  it("dispara business até 2,5× a economy (€2.000 vs €850)", () => {
    const r = avaliarGatilhos(
      opp({ precoCash: 2000 }),
      ctx({ precoEconomyBaseline: 850 }),
    );
    expect(pegar(r, "business_ate_2_5x")?.atingido).toBe(true);
    expect(r.algumDeCompra).toBe(true);
  });

  it("não dispara gatilho de business com preço normal alto (€4.000 vs €850)", () => {
    const r = avaliarGatilhos(
      opp({ precoCash: 4000 }),
      ctx({ precoEconomyBaseline: 850 }),
    );
    expect(pegar(r, "business_ate_2_5x")?.atingido).toBe(false);
    expect(pegar(r, "business_ate_3x_longa")?.atingido).toBe(false);
    expect(r.algumDeCompra).toBe(false);
  });

  it("dispara economy 20% abaixo da média", () => {
    const r = avaliarGatilhos(
      opp({ cabine: "economy", precoCash: 750 }),
      ctx({ precoMedioCabine: 1000 }),
    );
    expect(pegar(r, "economy_abaixo_media")?.atingido).toBe(true);
  });

  it("marca preço claramente anormal", () => {
    const r = avaliarGatilhos(
      opp({ precoCash: 1100 }),
      ctx({ precoMedioCabine: 2000 }),
    );
    expect(pegar(r, "preco_anormal")?.atingido).toBe(true);
  });
});

describe("avaliarGatilhos — milhas", () => {
  it("dispara quando o valor por milha é excelente", () => {
    const r = avaliarGatilhos(
      opp({ precoCash: 2500, taxas: 300, milhasNecessarias: 80000 }),
      ctx(),
    );
    expect(pegar(r, "milhas_valor")?.atingido).toBe(true);
    expect(r.algumDeCompra).toBe(true);
  });
});

describe("rotaLonga", () => {
  it("assume longa quando a duração é desconhecida", () => {
    expect(rotaLonga(null)).toBe(true);
    expect(rotaLonga(960)).toBe(true);
    expect(rotaLonga(120)).toBe(false);
  });
});
