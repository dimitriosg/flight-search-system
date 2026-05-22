import { describe, it, expect } from "vitest";
import { hashEmail, normalizarTexto } from "./dedupe";

describe("dedupe", () => {
  it("normaliza maiúsculas e espaços", () => {
    expect(normalizarTexto("  ATH  →   GRU  ")).toBe("ath → gru");
  });

  it("gera o mesmo hash para o mesmo conteúdo (ignorando caixa/espaços)", () => {
    const a = hashEmail("ATH -> GRU Business €2150");
    const b = hashEmail("  ath ->   gru   business   €2150 ");
    expect(a).toBe(b);
  });

  it("gera hashes diferentes para conteúdos diferentes", () => {
    expect(hashEmail("ATH -> GRU €2150")).not.toBe(hashEmail("ATH -> GRU €2200"));
  });
});
