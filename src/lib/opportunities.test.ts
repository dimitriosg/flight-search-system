import { describe, it, expect } from "vitest";
import type { Observacao } from "@prisma/client";
import { detectarFortesOportunidades } from "./opportunities";
import { ingerirTexto, montarObservacao } from "./ingestao";
import { construirContexto, type AmostraPreco } from "./context";
import { pontuarObservado } from "./scoring";

function obs(
  id: string,
  origem: string,
  destino: string,
  cabine: string,
  precoCash: number | null,
): Observacao {
  return {
    id,
    dataObservacao: new Date(),
    origem,
    destino,
    cabine,
    precoCash,
    milhasNecessarias: null,
    taxas: 0,
    fonte: null,
    observacoes: null,
    createdAt: new Date(),
  };
}

describe("detectarFortesOportunidades", () => {
  const observacoes = [
    obs("b1", "ATH", "GRU", "business", 2000), // forte (barato)
    obs("b2", "ATH", "GRU", "business", 3000),
    obs("b3", "ATH", "GRU", "business", 3100),
    obs("e1", "ATH", "GRU", "economy", 850),
    obs("e2", "ATH", "GRU", "economy", 850),
    obs("x1", "FRA", "GRU", "business", 4500), // sem baseline → não forte
  ];

  it("sobe ao dashboard a melhor oportunidade forte por rota+cabine", () => {
    const fortes = detectarFortesOportunidades(observacoes, []);
    expect(fortes).toHaveLength(1);
    expect(fortes[0].origem).toBe("ATH");
    expect(fortes[0].destino).toBe("GRU");
    expect(fortes[0].cabine).toBe("business");
    expect(fortes[0].pontuacao.nota).toBeGreaterThanOrEqual(8);
    expect(fortes[0].gatilho).toBe(true);
  });

  it("não marca como forte um preço sem referência histórica", () => {
    const fortes = detectarFortesOportunidades(observacoes, []);
    expect(fortes.some((f) => f.origem === "FRA")).toBe(false);
  });
});

describe("ingestão de e-mail cria Observacao e afeta a pontuação", () => {
  const email = `Google Flights
ATH -> GRU in Business is now €2,150`;

  it("parseia o e-mail e monta os dados da Observacao", () => {
    const { parsed, hash } = ingerirTexto({ textoBruto: email });
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
    expect(parsed.preco).toBe(2150);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    const dados = montarObservacao({
      origem: parsed.origem!,
      destino: parsed.destino!,
      cabine: parsed.cabine!,
      preco: parsed.preco,
    });
    expect(dados.precoCash).toBe(2150);
  });

  it("o preço importado, contra um histórico mais alto, pontua forte", () => {
    const amostras: AmostraPreco[] = [
      { id: "h1", origem: "ATH", destino: "GRU", cabine: "business", precoCash: 3000 },
      { id: "h2", origem: "ATH", destino: "GRU", cabine: "business", precoCash: 3000 },
      { id: "nova", origem: "ATH", destino: "GRU", cabine: "business", precoCash: 2150 },
    ];
    const ctx = construirContexto(
      { id: "nova", origem: "ATH", destino: "GRU", cabine: "business" },
      amostras,
    );
    const score = pontuarObservado(
      { cabine: "business", precoCash: 2150, milhasNecessarias: null, taxas: 0 },
      ctx,
    );
    expect(score.nota).toBeGreaterThanOrEqual(8);
  });
});
