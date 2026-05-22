/**
 * Sanitized real Google Flights alert fixtures shared between
 * emailParser.test.ts and ingestao.test.ts.
 *
 * All PII removed. Route and price values are real.
 */

import type { EntradaEmail } from "../emailParser";

// ─── Main regression fixture (original date-range + metadata bug) ─────────────

export const mainGoogleFlightsAlert: EntradaEmail = {
  remetente: "noreply@google.com",
  textoBruto: `Hello,

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

Prices updated 18 May 2026 at 21:11 GMT`,
};

// ─── Sample 1: route deal, Economy, multi-option, EUR ────────────────────────

export const sample1RouteEconomyEur: EntradaEmail = {
  assunto: "Your tracked route: Athens to São Paulo flights from €796",
  remetente: "noreply@google.com",
  textoBruto: `Hello,

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

Prices updated 21 May 2026 at 04:38 GMT`,
};

// ─── Sample 2: BRL price drop, Business, Dec–Jan year rollover ───────────────

export const sample2BrlDropDecJan: EntradaEmail = {
  assunto: "Your tracked flight to São Paulo is now R$20,423 (was R$22,879)",
  remetente: "noreply@google.com",
  textoBruto: `Google Flights

Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Tue 22 Dec – Fri 8 Jan
Round trip · Business · 1 adult
R$20,423 (dropped from R$22,879)

Prices updated 18 May 2026 at 21:11 GMT`,
};

// ─── Sample 3: EUR price increase, Business, Dec–Jan year rollover ───────────

export const sample3EurIncreaseDecJan: EntradaEmail = {
  assunto: "Your tracked flight to São Paulo is now €4,545 (was €4,021)",
  remetente: "noreply@google.com",
  textoBruto: `Google Flights

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

Prices updated 18 May 2026 at 04:06 GMT`,
};

// ─── Sample 4: EUR price drop, cabin omitted, Oct–Oct same year ──────────────

export const sample4EurDropCabinOmitted: EntradaEmail = {
  assunto: "Your tracked flight to São Paulo is now €1,063 (was €1,173)",
  remetente: "noreply@google.com",
  textoBruto: `Google Flights

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

Prices updated 15 May 2026 at 14:28 GMT`,
};

// ─── Sample 5: BRL price drop, Business, same route/dates as S2 ─────────────

export const sample5BrlDropSameRoute: EntradaEmail = {
  assunto: "Your tracked flight to São Paulo is now R$20,390 (was R$22,077)",
  remetente: "noreply@google.com",
  textoBruto: `Google Flights

Hello,

There's been a price change on the following destinations and dates:

Athens to São Paulo
Tue 22 Dec – Fri 8 Jan
Round trip · Business · 1 adult
R$20,390 (dropped from R$22,077)

Prices updated 15 May 2026 at 04:57 GMT`,
};
