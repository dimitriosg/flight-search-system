import { describe, it, expect } from "vitest";
import { construirContexto, type AmostraPreco } from "./context";

const amostras: AmostraPreco[] = [
  { id: "o1", origem: "ATH", destino: "GRU", cabine: "business", precoCash: 2900 },
  { id: "o2", origem: "ATH", destino: "GRU", cabine: "business", precoCash: 3100 },
  { id: "o3", origem: "ATH", destino: "GRU", cabine: "economy", precoCash: 880 },
  { id: "o4", origem: "ATH", destino: "GRU", cabine: "economy", precoCash: 820 },
  { id: "x1", origem: "LIS", destino: "GRU", cabine: "business", precoCash: 2500 },
];

const alvo = { origem: "ATH", destino: "GRU", cabine: "business" };

describe("construirContexto", () => {
  it("calcula a média da cabine a partir das amostras (observações + oportunidades)", () => {
    const ctx = construirContexto(alvo, amostras);
    expect(ctx.precoMedioCabine).toBeCloseTo(3000, 5); // (2900 + 3100) / 2
    expect(ctx.precoEconomyBaseline).toBeCloseTo(850, 5); // (880 + 820) / 2
    expect(ctx.amostras).toBe(2);
  });

  it("dá prioridade ao preço médio de referência manual", () => {
    const ctx = construirContexto(alvo, amostras, 2600);
    expect(ctx.precoMedioCabine).toBe(2600);
  });

  it("exclui a própria amostra pelo id ao calcular a média", () => {
    const ctx = construirContexto({ ...alvo, id: "o1" }, amostras);
    expect(ctx.precoMedioCabine).toBe(3100); // resta apenas o2
    expect(ctx.amostras).toBe(1);
  });

  it("retorna nulos quando não há amostras para a rota", () => {
    const ctx = construirContexto(
      { origem: "FRA", destino: "GRU", cabine: "business" },
      amostras,
    );
    expect(ctx.precoMedioCabine).toBeNull();
    expect(ctx.precoEconomyBaseline).toBeNull();
  });
});
