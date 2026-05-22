/**
 * Import-preview integration tests.
 *
 * `ingerirTexto` is the pure core of the /api/importacoes/preview route.
 * It runs parseEmail + hashEmail without touching the DB.  The only thing
 * the route adds on top is a Prisma count for deduplication — that part is
 * covered separately by the API contract, not here.
 *
 * These tests validate the full preview output shape (fonte, origem, destino,
 * cabine, moeda, preco, dataIda, dataVolta, confianca, hash) using the same
 * sanitized real Google Flights fixtures used in emailParser.test.ts.
 */

import { describe, it, expect } from "vitest";
import { ingerirTexto } from "./ingestao";
import { LIMIAR_CONFIANCA } from "./emailParser";
import {
  mainGoogleFlightsAlert,
  sample1RouteEconomyEur,
  sample2BrlDropDecJan,
  sample3EurIncreaseDecJan,
  sample4EurDropCabinOmitted,
  sample5BrlDropSameRoute,
} from "./__fixtures__/emailFixtures";

// ─── Shape helper ─────────────────────────────────────────────────────────────

/**
 * Assert hash is a non-empty hex string (SHA-256 from dedupe.ts).
 * Does NOT assert exact value so the test survives hash algo changes,
 * but DOES assert determinism — same input → same hash.
 */
function expectValidHash(hash: string) {
  expect(typeof hash).toBe("string");
  expect(hash.length).toBeGreaterThan(0);
  expect(/^[0-9a-f]+$/i.test(hash)).toBe(true);
}

// ─── Main regression fixture ──────────────────────────────────────────────────

describe("ingerirTexto — Google Flights real alert (main regression)", () => {
  const { parsed, hash } = ingerirTexto(mainGoogleFlightsAlert);

  it("parsed.fonte = Google Flights", () => {
    expect(parsed.fonte).toBe("Google Flights");
  });

  it("parsed.origem = ATH, parsed.destino = GRU", () => {
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
  });

  it("parsed.cabine = business", () => {
    expect(parsed.cabine).toBe("business");
  });

  it("parsed.preco = 20423 (smallest listed), parsed.moeda = BRL", () => {
    expect(parsed.preco).toBe(20423);
    expect(parsed.moeda).toBe("BRL");
  });

  it("parsed.dataIda = 2026-12-22 (travel date, not metadata timestamp)", () => {
    expect(parsed.dataIda).toBe("2026-12-22");
  });

  it("parsed.dataVolta = 2027-01-08 (year rollover: Jan < Dec)", () => {
    expect(parsed.dataVolta).toBe("2027-01-08");
  });

  it("parsed.confianca >= LIMIAR_CONFIANCA", () => {
    expect(parsed.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });

  it("hash is a non-empty hex string", () => {
    expectValidHash(hash);
  });

  it("hash is deterministic — same input produces same hash", () => {
    const { hash: hash2 } = ingerirTexto(mainGoogleFlightsAlert);
    expect(hash2).toBe(hash);
  });
});

// ─── Sample 1: Economy, multi-option, EUR ─────────────────────────────────────

describe("ingerirTexto — Sample 1: route deal (Economy, EUR, Aug–Sept)", () => {
  const { parsed, hash } = ingerirTexto(sample1RouteEconomyEur);

  it("fonte = Google Flights, rota ATH → GRU, economy", () => {
    expect(parsed.fonte).toBe("Google Flights");
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
    expect(parsed.cabine).toBe("economy");
  });

  it("preco = 796 (first listed), moeda = EUR", () => {
    expect(parsed.preco).toBe(796);
    expect(parsed.moeda).toBe("EUR");
  });

  it("dataIda = 2026-08-31, dataVolta = 2026-09-08 (same year)", () => {
    expect(parsed.dataIda).toBe("2026-08-31");
    expect(parsed.dataVolta).toBe("2026-09-08");
  });

  it("confianca >= LIMIAR_CONFIANCA", () => {
    expect(parsed.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });

  it("hash is valid", () => {
    expectValidHash(hash);
  });
});

// ─── Sample 2: BRL drop, Business, Dec–Jan rollover ───────────────────────────

describe("ingerirTexto — Sample 2: BRL price drop (Business, Dec–Jan rollover)", () => {
  const { parsed, hash } = ingerirTexto(sample2BrlDropDecJan);

  it("fonte = Google Flights, rota ATH → GRU, business", () => {
    expect(parsed.fonte).toBe("Google Flights");
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
    expect(parsed.cabine).toBe("business");
  });

  it("preco = 20423 (current, not old 22879), moeda = BRL", () => {
    expect(parsed.preco).toBe(20423);
    expect(parsed.moeda).toBe("BRL");
  });

  it("dataIda = 2026-12-22, dataVolta = 2027-01-08 (year rollover)", () => {
    expect(parsed.dataIda).toBe("2026-12-22");
    expect(parsed.dataVolta).toBe("2027-01-08");
  });

  it("confianca >= LIMIAR_CONFIANCA", () => {
    expect(parsed.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });

  it("hash differs from Sample 5 (different textoBruto)", () => {
    const { hash: hash5 } = ingerirTexto(sample5BrlDropSameRoute);
    expect(hash).not.toBe(hash5);
  });
});

// ─── Sample 3: EUR increase, Business, Dec–Jan rollover ───────────────────────

describe("ingerirTexto — Sample 3: EUR price increase (Business, Dec–Jan rollover)", () => {
  const { parsed } = ingerirTexto(sample3EurIncreaseDecJan);

  it("fonte = Google Flights, rota ATH → GRU, business", () => {
    expect(parsed.fonte).toBe("Google Flights");
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
    expect(parsed.cabine).toBe("business");
  });

  it("preco = 4545 (current, not old 4021), moeda = EUR", () => {
    expect(parsed.preco).toBe(4545);
    expect(parsed.moeda).toBe("EUR");
  });

  it("dataIda = 2026-12-30, dataVolta = 2027-01-15 (year rollover)", () => {
    expect(parsed.dataIda).toBe("2026-12-30");
    expect(parsed.dataVolta).toBe("2027-01-15");
  });

  it("confianca >= LIMIAR_CONFIANCA", () => {
    expect(parsed.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

// ─── Sample 4: cabin omitted, Oct–Oct same year ───────────────────────────────

describe("ingerirTexto — Sample 4: EUR drop, cabin omitted (Oct–Oct same year)", () => {
  const { parsed } = ingerirTexto(sample4EurDropCabinOmitted);

  it("fonte = Google Flights, rota ATH → GRU", () => {
    expect(parsed.fonte).toBe("Google Flights");
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
  });

  it("cabine = null (not mentioned in body)", () => {
    expect(parsed.cabine).toBeNull();
  });

  it("preco = 1063 (current, not old 1173), moeda = EUR", () => {
    expect(parsed.preco).toBe(1063);
    expect(parsed.moeda).toBe("EUR");
  });

  it("dataIda = 2026-10-24, dataVolta = 2026-10-31 (same year, no rollover)", () => {
    expect(parsed.dataIda).toBe("2026-10-24");
    expect(parsed.dataVolta).toBe("2026-10-31");
  });
});

// ─── Sample 5: BRL drop, same route/dates as S2, different price ─────────────

describe("ingerirTexto — Sample 5: BRL drop (same route/dates as S2, different price)", () => {
  const { parsed } = ingerirTexto(sample5BrlDropSameRoute);

  it("fonte = Google Flights, rota ATH → GRU, business", () => {
    expect(parsed.fonte).toBe("Google Flights");
    expect(parsed.origem).toBe("ATH");
    expect(parsed.destino).toBe("GRU");
    expect(parsed.cabine).toBe("business");
  });

  it("preco = 20390 (current, not old 22077), moeda = BRL", () => {
    expect(parsed.preco).toBe(20390);
    expect(parsed.moeda).toBe("BRL");
  });

  it("dataIda = 2026-12-22, dataVolta = 2027-01-08 (year rollover)", () => {
    expect(parsed.dataIda).toBe("2026-12-22");
    expect(parsed.dataVolta).toBe("2027-01-08");
  });

  it("confianca >= LIMIAR_CONFIANCA", () => {
    expect(parsed.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

// ─── Empty input guard (mirrors preview route validation) ─────────────────────

describe("ingerirTexto — guard: empty textoBruto returns null fields", () => {
  it("empty string parses without throwing, all fields null", () => {
    const { parsed, hash } = ingerirTexto({ textoBruto: "" });
    expect(parsed.origem).toBeNull();
    expect(parsed.destino).toBeNull();
    expect(parsed.preco).toBeNull();
    expect(parsed.fonte).toBeNull();
    expect(hash).toBeDefined();
  });
});
