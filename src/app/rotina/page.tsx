"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/primitives";

const DIARIA = [
  "Ver alertas recebidos",
  "Abrir apenas quedas relevantes",
  "Registrar oportunidades interessantes",
  "Ignorar ofertas fracas",
];

const SEMANAL = [
  "Busca manual no Google Flights",
  "Testar datas 2 a 5 dias antes e depois",
  "Testar hubs europeus alternativos",
  "Ver disponibilidade com milhas (Seats.aero / AwardFares)",
  "Atualizar o preço médio por rota",
  "Marcar rotas promissoras",
];

const ANTES_DE_COMPRAR = [
  "Confirmar no site oficial da companhia",
  "Verificar bagagem",
  "Verificar política de alteração e cancelamento",
  "Verificar duração total",
  "Verificar aeroportos de conexão",
  "Verificar se o preço é final com taxas",
  "Comprar direto com a companhia sempre que possível",
];

const EVITAR = [
  "Sites que prometem 80–90% de desconto garantido",
  "Páginas com contador regressivo artificial",
  "Pix para pessoa física desconhecida",
  "“Acesso secreto” sem explicar a lógica",
  "Agências sem reputação clara",
  "Bilhetes com conexão separada curta",
  "Ofertas que não dá para confirmar no site oficial",
  "Comprar por ansiedade — ou continuar procurando depois de comprar",
];

export default function RotinaPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Rotina de uso</h1>
        <p className="text-sm text-slate-400">
          Flexibilidade + alertas + aeroportos alternativos + milhas + gatilho de
          compra. As marcações abaixo são apenas para a sua sessão.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section>
          <SectionTitle hint="5 minutos por dia">Diariamente</SectionTitle>
          <Checklist itens={DIARIA} chave="diaria" />
        </section>
        <section>
          <SectionTitle hint="30 minutos por semana">Semanalmente</SectionTitle>
          <Checklist itens={SEMANAL} chave="semanal" />
        </section>
        <section>
          <SectionTitle hint="Confirmações finais">
            Quando aparecer um deal
          </SectionTitle>
          <Checklist itens={ANTES_DE_COMPRAR} chave="compra" />
        </section>
      </div>

      <section>
        <SectionTitle>Referência rápida</SectionTitle>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <h3 className="font-semibold text-slate-100 mb-2 text-sm">
              Escala da nota
            </h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>
                <b className="text-emerald-300">10</b> — Comprar agora
              </li>
              <li>
                <b className="text-green-300">8–9</b> — Forte candidato
              </li>
              <li>
                <b className="text-sky-300">6–7</b> — Bom, mas comparar antes
              </li>
              <li>
                <b className="text-amber-300">4–5</b> — Preço normal
              </li>
              <li>
                <b className="text-rose-300">1–3</b> — Ruim ou irrelevante
              </li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-100 mb-2 text-sm">
              Valor por milha
            </h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>&gt; €0,020 — excelente</li>
              <li>€0,015 a €0,020 — bom</li>
              <li>€0,010 a €0,015 — aceitável</li>
              <li>&lt; €0,010 — fraco</li>
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">
              valor = (preço cash − taxas) / milhas
            </p>
          </Card>
          <Card>
            <h3 className="font-semibold text-slate-100 mb-2 text-sm">
              Gatilhos em dinheiro
            </h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>Economy 20% abaixo da média</li>
              <li>Premium até 1,5× a economy</li>
              <li>Business até 2,5× a economy</li>
              <li>Business até 3× em rota longa</li>
              <li>Preço claramente anormal</li>
            </ul>
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle hint="Seção 9 do método">O que evitar</SectionTitle>
        <Card>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-slate-300">
            {EVITAR.map((e) => (
              <li key={e} className="flex gap-2">
                <span className="text-rose-400" aria-hidden>
                  ✕
                </span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Checklist({ itens, chave }: { itens: string[]; chave: string }) {
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const toggle = (i: number) =>
    setMarcados((p) => ({ ...p, [`${chave}-${i}`]: !p[`${chave}-${i}`] }));

  return (
    <Card>
      <ul className="space-y-2">
        {itens.map((item, i) => {
          const ok = marcados[`${chave}-${i}`];
          return (
            <li key={i}>
              <label className="flex items-start gap-2 cursor-pointer select-none m-0">
                <input
                  type="checkbox"
                  checked={!!ok}
                  onChange={() => toggle(i)}
                  className="w-auto mt-0.5"
                />
                <span
                  className={`text-sm ${
                    ok ? "text-slate-500 line-through" : "text-slate-300"
                  }`}
                >
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
