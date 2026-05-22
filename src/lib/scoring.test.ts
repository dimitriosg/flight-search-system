import { describe, it, expect } from "vitest";
import { pontuarDeal, rotuloNota } from "./scoring";
import type { ContextoRota, OportunidadeCore } from "./types";
import { CONTEXTO_VAZIO } from "./types";

function opp(over: Partial<OportunidadeCore> = {}): OportunidadeCore {
  return {
    origem: "ATH",
    destino: "GRU",
    cabine: "business",
    escalas: 1,
    duracaoMinutos: 960,
    precoCash: 2000,
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

describe("pontuarDeal — exemplos do documento", () => {
  it("Economy €850 + Business €2.000 → forte candidato (nota 8)", () => {
    const r = pontuarDeal(
      opp({ precoCash: 2000 }),
      ctx({ precoEconomyBaseline: 850 }),
    );
    expect(r.nota).toBe(8);
    expect(r.rotulo).toBe("Forte candidato");
  });

  it("Economy €850 + Business €4.000 → preço normal (nota 5)", () => {
    const r = pontuarDeal(
      opp({ precoCash: 4000 }),
      ctx({ precoEconomyBaseline: 850 }),
    );
    expect(r.nota).toBe(5);
    expect(r.rotulo).toBe("Preço normal");
  });
});

describe("pontuarDeal — limites e robustez", () => {
  it("mantém a nota dentro de 1..10", () => {
    const otimo = pontuarDeal(
      opp({
        precoCash: 1500,
        milhasNecessarias: 50000,
        escalas: 0,
        duracaoMinutos: 800,
        flexCancelamento: "flexivel",
      }),
      ctx({ precoMedioCabine: 3000 }),
    );
    expect(otimo.nota).toBe(10);
    expect(otimo.rotulo).toBe("Comprar agora");

    const pessimo = pontuarDeal(
      opp({
        cabine: "economy",
        precoCash: 1000,
        escalas: 3,
        duracaoMinutos: 1500,
        bagagemIncluida: false,
        compraDireta: false,
        bilhetesSeparados: true,
        conexaoHoras: 2,
        flexCancelamento: "rigida",
      }),
      ctx({ precoMedioCabine: 500 }),
    );
    expect(pessimo.nota).toBe(1);
    expect(pessimo.rotulo).toBe("Ruim ou irrelevante");
  });

  it("sem contexto de preço fica em torno do neutro", () => {
    const r = pontuarDeal(opp({ flexCancelamento: "flexivel" }), ctx());
    expect(r.nota).toBeGreaterThanOrEqual(5);
    expect(r.nota).toBeLessThanOrEqual(7);
  });

  it("inclui um fator de valor por milha quando há milhas", () => {
    const r = pontuarDeal(
      opp({ precoCash: 2500, taxas: 300, milhasNecessarias: 80000 }),
      ctx({ precoEconomyBaseline: 850 }),
    );
    expect(r.fatores.some((f) => f.fator === "Valor por milha")).toBe(true);
  });
});

describe("rotuloNota", () => {
  it("mapeia a escala da seção 7", () => {
    expect(rotuloNota(10)).toBe("Comprar agora");
    expect(rotuloNota(9)).toBe("Forte candidato");
    expect(rotuloNota(8)).toBe("Forte candidato");
    expect(rotuloNota(7)).toBe("Bom, mas comparar antes");
    expect(rotuloNota(6)).toBe("Bom, mas comparar antes");
    expect(rotuloNota(5)).toBe("Preço normal");
    expect(rotuloNota(4)).toBe("Preço normal");
    expect(rotuloNota(3)).toBe("Ruim ou irrelevante");
    expect(rotuloNota(1)).toBe("Ruim ou irrelevante");
  });
});
