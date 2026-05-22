import { describe, it, expect } from "vitest";
import {
  valorPorMilha,
  classificarValorPorMilha,
  calcularMilha,
} from "./miles";

describe("valorPorMilha", () => {
  it("reproduz o exemplo do documento (€2.500 / €300 / 80.000 = €0,0275)", () => {
    const v = valorPorMilha(2500, 300, 80000);
    expect(v).toBeCloseTo(0.0275, 6);
    expect(classificarValorPorMilha(v)).toBe("excelente");
  });

  it("retorna null sem milhas ou sem preço cash", () => {
    expect(valorPorMilha(2500, 300, 0)).toBeNull();
    expect(valorPorMilha(2500, 300, null)).toBeNull();
    expect(valorPorMilha(null, 300, 80000)).toBeNull();
  });

  it("trata taxas ausentes como zero", () => {
    expect(valorPorMilha(2000, null, 100000)).toBeCloseTo(0.02, 6);
  });
});

describe("classificarValorPorMilha", () => {
  it("aplica as faixas do documento", () => {
    expect(classificarValorPorMilha(0.025)).toBe("excelente"); // > 0,020
    expect(classificarValorPorMilha(0.02)).toBe("bom"); // limite 0,015–0,020
    expect(classificarValorPorMilha(0.017)).toBe("bom");
    expect(classificarValorPorMilha(0.015)).toBe("bom");
    expect(classificarValorPorMilha(0.012)).toBe("aceitavel");
    expect(classificarValorPorMilha(0.01)).toBe("aceitavel");
    expect(classificarValorPorMilha(0.009)).toBe("fraco");
    expect(classificarValorPorMilha(null)).toBeNull();
  });
});

describe("calcularMilha", () => {
  it("combina valor e qualidade", () => {
    expect(calcularMilha(2500, 300, 80000)).toEqual({
      valorPorMilha: 0.0275,
      qualidade: "excelente",
    });
    expect(calcularMilha(1000, 0, 0)).toBeNull();
  });
});
