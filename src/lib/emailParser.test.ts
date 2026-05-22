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

describe("parseEmail — e-mail estilo KAYAK (EN, USD)", () => {
  const kayakEmail = `From: deals@kayak.com
Subject: Price Alert: Athens to São Paulo

Fare Alert — Business Class
Athens (ATH) → São Paulo (GRU)
Book now for just $2,150
Departs Oct 12, 2026 — Returns Oct 26, 2026`;

  const r = parseEmail({
    textoBruto: kayakEmail,
    remetente: "deals@kayak.com",
  });

  it("identifica fonte KAYAK, rota e cabine", () => {
    expect(r.fonte).toBe("KAYAK");
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(2150);
    expect(r.moeda).toBe("USD");
  });

  it("extrai datas em formato EN", () => {
    expect(r.dataIda).toBe("2026-10-12");
    expect(r.dataVolta).toBe("2026-10-26");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("parseEmail — KAYAK sem códigos IATA explícitos", () => {
  const r = parseEmail({
    textoBruto:
      "KAYAK Price Drop: Athens to Guarulhos, Business Class from €1.980. Departs 15 Mar 2026.",
  });

  it("resolve cidades para IATA via aliases", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.preco).toBe(1980);
    expect(r.cabine).toBe("business");
  });
});

describe("detectarPreco — e-mail com preço antigo e preço atual", () => {
  it("retorna o preço após 'para' (PT) em 'de X para Y'", () => {
    expect(
      detectarPreco("Preço caiu de R$ 12.000 para R$ 9.800"),
    ).toEqual({ preco: 9800, moeda: "BRL" });
  });

  it("retorna o preço após 'now' (EN) em 'was X now Y'", () => {
    expect(
      detectarPreco("was €3.500, now €2.150"),
    ).toEqual({ preco: 2150, moeda: "EUR" });
  });

  it("não quebra e-mail com preço único após 'por'", () => {
    expect(
      detectarPreco("em Executiva por R$ 9.800"),
    ).toEqual({ preco: 9800, moeda: "BRL" });
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

// ─────────────────────────────────────────────────────────────────────────────
// Real-world fixture hardening
// ─────────────────────────────────────────────────────────────────────────────

describe("parseEmail — Google Flights PT (LIS→GIG Business, EUR)", () => {
  const email = [
    "Google Flights: queda de preço detectada",
    "De Lisboa para o Rio de Janeiro em Business por €2.800.",
    "Parte em 15 nov 2026. Volta em 30 nov 2026.",
  ].join("\n");
  const r = parseEmail({ textoBruto: email });

  it("identifica fonte, rota, cabine e preço", () => {
    expect(r.fonte).toBe("Google Flights");
    expect(r.origem).toBe("LIS");
    expect(r.destino).toBe("GIG");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(2800);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai datas em formato PT abreviado", () => {
    expect(r.dataIda).toBe("2026-11-15");
    expect(r.dataVolta).toBe("2026-11-30");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("parseEmail — TAP promo PT (LIS→GRU Business, EUR)", () => {
  const email = [
    "TAP Air Portugal: Tarifa especial em Business Class",
    "De Lisboa para São Paulo (Guarulhos) a partir de €1.950.",
    "Ida: 10 de fevereiro de 2027. Volta: 24 de fevereiro de 2027.",
  ].join("\n");
  const r = parseEmail({ textoBruto: email });

  it("identifica rota e preço corretamente", () => {
    expect(r.origem).toBe("LIS");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(1950);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai datas em formato PT estendido (dia de mês de ano)", () => {
    expect(r.dataIda).toBe("2027-02-10");
    expect(r.dataVolta).toBe("2027-02-24");
  });
});

describe("parseEmail — Iberia promo EN (MAD→GRU Business, EUR)", () => {
  const email = [
    "Iberia special offer: Madrid to São Paulo",
    "Business Class — only €2,300",
    "Depart 8 March 2027, Return 22 March 2027",
  ].join("\n");
  const r = parseEmail({ textoBruto: email });

  it("identifica rota, cabine e preço", () => {
    expect(r.origem).toBe("MAD");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(2300);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai datas EN (dia mês ano)", () => {
    expect(r.dataIda).toBe("2027-03-08");
    expect(r.dataVolta).toBe("2027-03-22");
  });
});

describe("parseEmail — Skyscanner EN (ATH→GRU Business, GBP)", () => {
  const email = [
    "Skyscanner price alert!",
    "Athens to São Paulo, Business Class",
    "£1,850",
    "Depart 3 Nov 2026",
  ].join("\n");
  const r = parseEmail({ textoBruto: email });

  it("identifica fonte, rota, cabine e preço em GBP", () => {
    expect(r.fonte).toBe("Skyscanner");
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(1850);
    expect(r.moeda).toBe("GBP");
  });

  it("extrai data EN (dia mês ano)", () => {
    expect(r.dataIda).toBe("2026-11-03");
  });
});

describe("detectarPreco — 'from X to Y' (EN price drop, keyword 'to')", () => {
  it("retorna preço após 'to' em 'from X to Y' com EUR", () => {
    expect(
      detectarPreco("Price dropped from €3,200 to €2,100"),
    ).toEqual({ preco: 2100, moeda: "EUR" });
  });

  it("retorna preço após 'to' com USD", () => {
    expect(
      detectarPreco("fare went from $4,500 to $2,800"),
    ).toEqual({ preco: 2800, moeda: "USD" });
  });

  it("retorna preço após 'to' com BRL", () => {
    expect(
      detectarPreco("foi de R$ 14.000 to R$ 9.800"),
    ).toEqual({ preco: 9800, moeda: "BRL" });
  });
});

describe("detectarPreco — múltiplos preços, escolher o atual", () => {
  it("três preços: escolhe preço após 'para'", () => {
    expect(
      detectarPreco(
        "Preço caiu de R$ 14.000 para R$ 9.800. Reserva dupla: R$ 19.600.",
      ),
    ).toEqual({ preco: 9800, moeda: "BRL" });
  });

  it("três preços: escolhe preço após 'now'", () => {
    expect(
      detectarPreco("Business was €4,200, now €2,150. Economy from €450."),
    ).toEqual({ preco: 2150, moeda: "EUR" });
  });
});

describe("parseEmail — texto misto EN/PT, KAYAK (ATH→GRU)", () => {
  const email = [
    "KAYAK Price Alert",
    "ATH → GRU Business Class",
    "Preço caiu de €3.500 para €2.200",
    "Partida 20 abr 2026",
  ].join("\n");
  const r = parseEmail({ textoBruto: email });

  it("fonte KAYAK, rota e cabine corretos", () => {
    expect(r.fonte).toBe("KAYAK");
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
  });

  it("escolhe preço novo (após 'para'), não o antigo", () => {
    expect(r.preco).toBe(2200);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai data em PT abreviado", () => {
    expect(r.dataIda).toBe("2026-04-20");
  });
});

describe("parseEmail — e-mail sem cabine mencionada", () => {
  const r = parseEmail({
    textoBruto: "Price alert: ATH → GRU, now €1.990. Departs 10 Apr 2026.",
  });

  it("retorna cabine null", () => {
    expect(r.cabine).toBeNull();
  });

  it("ainda extrai rota e preço corretamente", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.preco).toBe(1990);
    expect(r.moeda).toBe("EUR");
  });

  it("confiança < 1 por falta de cabine", () => {
    expect(r.confianca).toBeLessThan(1);
  });
});

describe("parseEmail — e-mail sem datas", () => {
  const r = parseEmail({
    textoBruto: "ATH → GRU Business Class — fare alert €2.050",
  });

  it("retorna datas null", () => {
    expect(r.dataIda).toBeNull();
    expect(r.dataVolta).toBeNull();
  });

  it("ainda extrai rota, cabine e preço", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
    expect(r.preco).toBe(2050);
  });
});

describe("detectarAeroportos — aliases de cidades adicionais", () => {
  it("resolve Rio → GIG", () => {
    const r = parseEmail({
      textoBruto: "ATH to Rio Business €1.900. Departs 10 Jan 2027.",
    });
    expect(r.destino).toBe("GIG");
    expect(r.origem).toBe("ATH");
  });

  it("resolve Istanbul → IST", () => {
    const r = parseEmail({
      textoBruto: "Istanbul to GRU Business €1.400. Departs 5 Feb 2027.",
    });
    expect(r.origem).toBe("IST");
    expect(r.destino).toBe("GRU");
  });

  it("resolve Rome → FCO", () => {
    const r = parseEmail({
      textoBruto: "Rome to São Paulo Business €2.000. Departs 1 Mar 2027.",
    });
    expect(r.origem).toBe("FCO");
    expect(r.destino).toBe("GRU");
  });

  it("resolve Paris → CDG", () => {
    const r = parseEmail({
      textoBruto: "Paris to GRU Economy €700. Departs 20 Apr 2027.",
    });
    expect(r.origem).toBe("CDG");
    expect(r.destino).toBe("GRU");
  });

  it("resolve London → LHR", () => {
    const r = parseEmail({
      textoBruto: "London to GRU Business £1.500. Departs 12 May 2027.",
    });
    expect(r.origem).toBe("LHR");
    expect(r.destino).toBe("GRU");
  });

  it("resolve Madrid → MAD", () => {
    const r = parseEmail({
      textoBruto: "Madrid to São Paulo Business €1.800. Departs 3 Jun 2027.",
    });
    expect(r.origem).toBe("MAD");
    expect(r.destino).toBe("GRU");
  });
});

describe("detectarDatas — formato PT estendido (dia de mês de ano)", () => {
  it("'10 de fevereiro de 2027' → 2027-02-10", () => {
    const [dataIda] = parseEmail({
      textoBruto: "Partida: 10 de fevereiro de 2027",
    }).dataIda
      ? [parseEmail({ textoBruto: "Partida: 10 de fevereiro de 2027" }).dataIda]
      : [];
    expect(dataIda).toBe("2027-02-10");
  });

  it("'5 de outubro de 2026' → 2026-10-05", () => {
    const r = parseEmail({ textoBruto: "Ida 5 de outubro de 2026." });
    expect(r.dataIda).toBe("2026-10-05");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Google Flights real alert — date range + metadata timestamp regression
// ─────────────────────────────────────────────────────────────────────────────

const googleFlightsRealAlert = `Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Tue 22 Dec–Fri 8 Jan
Round trip · Business · 1 adult

↓ R$20,423
R$22,879

15:50 – 19:00+1
Iberia · 1 stop · ATH–GRU
R$20,423

06:00 – 18:40
ITA · 1 stop · ATH–GRU
R$22,737

16:55 – 06:00+1
British Airways · 1 stop · ATH–GRU
R$23,155

Show all flights

Prices updated 18 May 2026 at 21:11 GMT`;

describe("parseEmail — Google Flights real alert (intervalo de datas + timestamp)", () => {
  const r = parseEmail({
    textoBruto: googleFlightsRealAlert,
    remetente: "noreply@google.com",
  });

  it("identifica fonte Google Flights via remetente", () => {
    expect(r.fonte).toBe("Google Flights");
  });

  it("extrai rota ATH → GRU", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
  });

  it("identifica Business Class", () => {
    expect(r.cabine).toBe("business");
  });

  it("retorna o menor preço listado (R$20,423 — primeiro na lista)", () => {
    expect(r.preco).toBe(20423);
    expect(r.moeda).toBe("BRL");
  });

  it("usa a data de viagem 'Tue 22 Dec', não o timestamp 'Prices updated'", () => {
    expect(r.dataIda).toBe("2026-12-22");
  });

  it("infere ano de volta como 2027 (Jan < Dec → cruzamento de ano)", () => {
    expect(r.dataVolta).toBe("2027-01-08");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("detectarDatas — intervalo sem ano (reRange) e inferência de ano", () => {
  it("intervalo cruzando ano: Dec→Jan usa anchorAno + 1 para volta", () => {
    const r = parseEmail({
      textoBruto:
        "ATH → GRU Business. Tue 22 Dec–Fri 8 Jan. Prices updated 18 May 2026.",
    });
    expect(r.dataIda).toBe("2026-12-22");
    expect(r.dataVolta).toBe("2027-01-08");
  });

  it("intervalo no mesmo ano: Jun→Jun não cruza", () => {
    const r = parseEmail({
      textoBruto:
        "ATH → GRU Business. Tue 10 Jun–Tue 24 Jun. Prices updated 18 May 2026.",
    });
    expect(r.dataIda).toBe("2026-06-10");
    expect(r.dataVolta).toBe("2026-06-24");
  });

  it("intervalo Nov→Dez no mesmo ano não cruza", () => {
    const r = parseEmail({
      textoBruto:
        "ATH → GRU Business. Mon 20 Nov–Fri 5 Dec. Prices updated 18 May 2026.",
    });
    expect(r.dataIda).toBe("2026-11-20");
    expect(r.dataVolta).toBe("2026-12-05");
  });
});

describe("detectarDatas — 'Prices updated' não contamina datas de viagem", () => {
  it("suprime timestamp de footer (linha própria)", () => {
    const r = parseEmail({
      textoBruto:
        "ATH → GRU Business €2.100.\n\nPrices updated 18 May 2026 at 21:11 GMT",
    });
    expect(r.dataIda).toBeNull();
  });

  it("suprime timestamp inline na mesma linha", () => {
    const r = parseEmail({
      textoBruto:
        "ATH → GRU Business €2.100. Prices updated 18 May 2026.",
    });
    expect(r.dataIda).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Real Google Flights email fixtures — parser-real-email-fixtures-2
// ─────────────────────────────────────────────────────────────────────────────

describe("parseEmail — Sample 1: Google Flights route deal (Economy, multi-option, EUR)", () => {
  const assunto = "Your tracked route: Athens to São Paulo flights from €796";
  const textoBruto = `Hello,

We've found some great prices for one-week trips in August, from Athens to São Paulo.

1-week trips in August
6–9 days · Round trip · 1 adult · Economy

Mon 31 Aug - Tue 8 Sept
SAVE 20% From €796
Qatar Airways · 1 stop · ATH–GRU · 21 hrs
View

Thu 20 Aug - Wed 26 Aug
SAVE 11% From €878
Air Canada · 1 stop · ATH–GRU · 26 hrs
View

Mon 17 Aug - Wed 26 Aug
SAVE 8% From €907
Turkish Airlines · 1 stop · ATH–GRU · 20 hrs
View

Prices are currently low for August
€796 is low
Prices are cheaper than usual. The least expensive flights for similar trips to São Paulo usually cost between €850–1,300. Anything less is considered a deal.

View more flights

Prices updated 21 May 2026 at 04:38 GMT`;

  const r = parseEmail({ textoBruto, remetente: "noreply@google.com" });

  it("identifica fonte Google Flights", () => {
    expect(r.fonte).toBe("Google Flights");
  });

  it("extrai rota ATH → GRU e cabine Economy", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("economy");
  });

  it("retorna o menor preço listado (€796, primeiro candidato)", () => {
    expect(r.preco).toBe(796);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai primeira data de ida (31 Aug 2026), ignora 'Prices updated'", () => {
    expect(r.dataIda).toBe("2026-08-31");
  });

  it("extrai primeira data de volta (8 Sept 2026, mesmo ano)", () => {
    expect(r.dataVolta).toBe("2026-09-08");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("parseEmail — Sample 2: Google Flights BRL price drop (Business, Dec–Jan rollover)", () => {
  const assunto = "Your tracked flight to São Paulo is now R$20,423 (was R$22,879)";
  const textoBruto = `Google Flights

Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Tue 22 Dec – Fri 8 Jan
Round trip · Business · 1 adult
R$20,423 (dropped from R$22,879)

Prices updated 18 May 2026 at 21:11 GMT`;

  const r = parseEmail({ textoBruto, remetente: "noreply@google.com" });

  it("identifica fonte Google Flights", () => {
    expect(r.fonte).toBe("Google Flights");
  });

  it("extrai rota ATH → GRU e Business", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
  });

  it("retorna preço atual R$20,423 (não o antigo)", () => {
    expect(r.preco).toBe(20423);
    expect(r.moeda).toBe("BRL");
  });

  it("extrai data de ida (22 Dec 2026), ignora 'Prices updated'", () => {
    expect(r.dataIda).toBe("2026-12-22");
  });

  it("infere data de volta como 2027-01-08 (Jan < Dec → cruzamento de ano)", () => {
    expect(r.dataVolta).toBe("2027-01-08");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("parseEmail — Sample 3: Google Flights EUR price increase (Business, Dec–Jan rollover)", () => {
  const assunto = "Your tracked flight to São Paulo is now €4,545 (was €4,021)";
  const textoBruto = `Google Flights

Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Wed 30 Dec – Fri 15 Jan
Round trip · Business · 1 adult

Your tracked flight
––––––––––––––––––––––––––––––––––––––––
06:05 – 19:00
KLM · 1 stop · ATH–GRU
€4,545 (increased from €4,021)

Prices updated 18 May 2026 at 04:06 GMT`;

  const r = parseEmail({ textoBruto, remetente: "noreply@google.com" });

  it("identifica fonte Google Flights", () => {
    expect(r.fonte).toBe("Google Flights");
  });

  it("extrai rota ATH → GRU e Business", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
  });

  it("retorna preço atual €4,545 (não o antigo €4,021)", () => {
    expect(r.preco).toBe(4545);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai data de ida (30 Dec 2026), ignora 'Prices updated'", () => {
    expect(r.dataIda).toBe("2026-12-30");
  });

  it("infere data de volta como 2027-01-15 (Jan < Dec → cruzamento de ano)", () => {
    expect(r.dataVolta).toBe("2027-01-15");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});

describe("parseEmail — Sample 4: Google Flights EUR price drop (cabin omitted, Oct–Oct)", () => {
  const assunto = "Your tracked flight to São Paulo is now €1,063 (was €1,173)";
  const textoBruto = `Google Flights

Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Sat 24 Oct – Sat 31 Oct
Round trip · 1 adult

Your tracked flight
––––––––––––––––––––––––––––––––––––––––
06:05 – 16:55
ITA · 1 stop · ATH–GRU
€1,063 (dropped from €1,173)

Prices updated 15 May 2026 at 14:28 GMT`;

  const r = parseEmail({ textoBruto, remetente: "noreply@google.com" });

  it("identifica fonte Google Flights", () => {
    expect(r.fonte).toBe("Google Flights");
  });

  it("extrai rota ATH → GRU", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
  });

  it("cabine null quando não mencionada no corpo", () => {
    expect(r.cabine).toBeNull();
  });

  it("retorna preço atual €1,063 (não o antigo €1,173)", () => {
    expect(r.preco).toBe(1063);
    expect(r.moeda).toBe("EUR");
  });

  it("extrai data de ida (24 Oct 2026), ignora 'Prices updated'", () => {
    expect(r.dataIda).toBe("2026-10-24");
  });

  it("extrai data de volta (31 Oct 2026, mesmo mês sem cruzamento de ano)", () => {
    expect(r.dataVolta).toBe("2026-10-31");
  });
});

describe("parseEmail — Sample 5: Google Flights BRL drop (Business, same route/dates, different price)", () => {
  const assunto = "Your tracked flight to São Paulo is now R$20,390 (was R$22,077)";
  const textoBruto = `Google Flights

Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Tue 22 Dec – Fri 8 Jan
Round trip · Business · 1 adult
R$20,390 (dropped from R$22,077)

Prices updated 15 May 2026 at 04:57 GMT`;

  const r = parseEmail({ textoBruto, remetente: "noreply@google.com" });

  it("identifica fonte Google Flights", () => {
    expect(r.fonte).toBe("Google Flights");
  });

  it("extrai rota ATH → GRU e Business", () => {
    expect(r.origem).toBe("ATH");
    expect(r.destino).toBe("GRU");
    expect(r.cabine).toBe("business");
  });

  it("retorna preço atual R$20,390 (não o antigo)", () => {
    expect(r.preco).toBe(20390);
    expect(r.moeda).toBe("BRL");
  });

  it("extrai data de ida (22 Dec 2026), ignora 'Prices updated'", () => {
    expect(r.dataIda).toBe("2026-12-22");
  });

  it("infere data de volta como 2027-01-08 (Jan < Dec → cruzamento de ano)", () => {
    expect(r.dataVolta).toBe("2027-01-08");
  });

  it("tem confiança alta", () => {
    expect(r.confianca).toBeGreaterThanOrEqual(LIMIAR_CONFIANCA);
  });
});
