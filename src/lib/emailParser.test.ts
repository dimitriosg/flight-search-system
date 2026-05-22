import { describe, it, expect } from "vitest";
import {
  parseEmail,
  detectarPreco,
  normalizarNumero,
  LIMIAR_CONFIANCA,
} from "./emailParser";

const googleEmail = `From: Google Flights <noreply@google.com>
Price drop on your tracked trip
ATH -> GRU in Business is now €2,150
Departs 12 Oct 2026, returns 26 Oct 2026`;

const skyscannerEmail = `Skyscanner: queda de preço!
Lisboa para São Paulo em Classe Executiva por R$ 9.800.
Ida 05/11/2026.`;

const vagoEmail = `Weekly deals newsletter — lots of great fares! From $499.`;

describe("parseEmail — e-mail do Google Flights (EN, EUR)", () => {
  const r = parseEmail({ textoBruto: googleEmail });
  it("identifica fonte, rota, cabine e preço", () => {
    expect(r.fonte).toBe("Google Flights");
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(2150);
    expect(r.moeda).toBe("EUR");
  });
  it("extrai datas de ida e volta", () => {
    expect(r.dataIda).toBe("2026-10-12");
    expect(r.dataVolta).toBe("2026-10-26");
  });
  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("parseEmail — e-mail do Skyscanner (PT, BRL)", () => {
  const r = parseEmail({ textoBruto: skyscannerEmail });
  it("entende cidades em português e cabine executiva", () => {
    expect(r.fonte).toBe("Skyscanner");
    expect(r.origem).toBe("LIS");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(9800);
    expect(r.moeda).toBe("BRL");
    expect(r.dataIda).toBe("2026-11-05");
  });
});

describe("parseEmail — e-mail vago (baixa confiança)", () => {
  const r = parseEmail({ textoBruto: vagoEmail });
  it("marca confiança baixa e não inventa rota", () => {
    expect(r.origem).toBeNull();
    expect(r.destino).toBeNull();
    expect(r.preco).toBe(499);
    expect(r.moeda).toBe("USD");
    expect(r.confianca).toBeLessThan(LIMIAR_CONFIANCA);
  });
});

describe("detectarPreco / normalizarNumero — formatos de número", () => {
  it("lida com separadores europeus e americanos", () => {
    expect(detectarPreco("€2.150,00")).toEqual({ preco: 2150, moeda: "EUR" });
    expect(detectarPreco("$2,150.00")).toEqual({ preco: 2150, moeda: "USD" });
    expect(detectarPreco("EUR 2150")).toEqual({ preco: 2150, moeda: "EUR" });
    expect(detectarPreco("custa R$ 12.500 ida")).toEqual({
      preco: 12500,
      moeda: "BRL",
    });
  });
  it("normaliza decimais", () => {
    expect(normalizarNumero("2150.50")).toBe(2150.5);
    expect(normalizarNumero("2.150")).toBe(2150);
    expect(normalizarNumero("1.234,56")).toBe(1234.56);
  });
});
