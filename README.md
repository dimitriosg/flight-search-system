# PassagensBaratas — Flight Deal Tracker

Personal tool for tracking Athens → Brazil/LATAM flight prices, with Business Class scoring, price history, and email alert import.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind CSS
- Prisma ORM · SQLite (local file)
- Vitest (unit tests)

## Setup

```bash
npm install
npx prisma db push       # create/migrate local SQLite DB
npm run dev              # http://localhost:3000
```

## Running tests

```bash
npm test                 # vitest (watch mode)
npm run test:run         # single run
```

## Building

```bash
npm run build
```

---

## Manual QA: Email Import Flow

### 1. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Create a test route first (required for scoring)

Go to **Rotas → Nova rota**:
- Origem: `ATH`
- Destino: `GRU`
- Cabine: `Business`
- Preço médio de referência: `3500` (used as scoring baseline)

Save it.

### 3. Import a Google Flights alert

Go to **Importar** and paste this text into "Corpo do e-mail":

```
From: Google Flights <noreply@google.com>
Price drop on your tracked trip
ATH -> GRU in Business is now €2,150
Departs 12 Oct 2026, returns 26 Oct 2026
```

Optional fields:
- Assunto: `Price drop on your tracked trip`
- Remetente: `noreply@google.com`

Click **Analisar e-mail →**

Expected preview:
- Fonte: `Google Flights`
- Origem: `ATH`, Destino: `GRU`
- Cabine: `business`, Preço: `2150`, Moeda: `EUR`
- Confiança: `≥ 70%`
- Datas preenchidas

Click **Salvar + criar observação de preço**.

### 4. Verify Observação was created

Go to **Observações** — should show the imported price for ATH → GRU Business.

### 5. Verify dashboard "Ação necessária" banner

Go to **Dashboard**. If the imported price is ≥28% below the route average,
the amber "🔥 Ação necessária" banner appears with nota ≥ 8.

> With `precoMedioReferencia = 3500` and imported price `2150`, the deal scores
> roughly 38% below average → nota 9 → banner fires.

### 6. Test duplicate detection

Go to **Importar** again and paste the same email text.
Expected: preview shows `⚠️ Este e-mail já foi importado` and import buttons are disabled.

### 7. Test Skyscanner format

```
Skyscanner: queda de preço!
Lisboa para São Paulo em Classe Executiva por R$ 9.800.
Ida 05/11/2026.
```

Expected: Fonte = Skyscanner, Origem = LIS, Destino = GRU, Cabine = business, Preço = 9800, Moeda = BRL.

### 8. Test "price dropped from X to Y" format

```
KAYAK Alert: Athens to GRU Business Class
Price dropped from €3.200 para €2.100
Departs 20 Apr 2026
```

Expected: Parser returns `2100` (current/lower price), not `3200` (old price).

### 9. Test empty/invalid input

- Leave email body empty → "Analisar" button is disabled.
- After preview, clear Origem field → "Salvar + criar observação" button is disabled.

---

## Architecture notes

See [`docs/RISCOS-E-ROADMAP.md`](docs/RISCOS-E-ROADMAP.md) for:
- Why v1 is manual (no scraping, no paid APIs)
- Future email automation path via `ingerirTexto()` (no OAuth yet)
- Risks and limitations
