"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OportunidadeEnriquecida } from "@/lib/enrich";
import type { ForteOportunidade } from "@/lib/opportunities";
import { getJSON } from "@/lib/client";
import { OportunidadeCard } from "@/components/OportunidadeCard";
import {
  Card,
  SectionTitle,
  EmptyState,
  NotaBadge,
  Badge,
} from "@/components/primitives";
import { rotuloAeroporto, rotuloCabine } from "@/lib/constants";
import * as fmt from "@/lib/format";

interface DashboardData {
  totais: {
    oportunidades: number;
    ativas: number;
    rotas: number;
    alertasAtivos: number;
    observacoes: number;
  };
  fortesOportunidades: ForteOportunidade[];
  melhores: OportunidadeEnriquecida[];
  businessGatilho: OportunidadeEnriquecida[];
  proximasAcoes: OportunidadeEnriquecida[];
  descartadas: OportunidadeEnriquecida[];
  porNota: { nota: number; total: number }[];
  porCabine: { chave: string; total: number }[];
  porOrigem: { chave: string; total: number }[];
  rotasPotencial: {
    origem: string;
    destino: string;
    melhorNota: number;
    total: number;
  }[];
}

export default function DashboardPage() {
  const [d, setD] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    getJSON<DashboardData>("/api/dashboard").then((r) => {
      if (r.ok && r.data) setD(r.data);
      setCarregando(false);
    });
  }, []);

  if (carregando) return <EmptyState>Carregando dashboard…</EmptyState>;
  if (!d) return <EmptyState>Não foi possível carregar o dashboard.</EmptyState>;

  const semDados = d.totais.oportunidades === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Oportunidades de viagem combinando dinheiro, milhas, rotas e cabines —
          com foco em Business Class.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Stat titulo="Oportunidades" valor={d.totais.oportunidades} />
        <Stat titulo="Em aberto" valor={d.totais.ativas} />
        <Stat titulo="Rotas monitoradas" valor={d.totais.rotas} />
        <Stat titulo="Alertas ativos" valor={d.totais.alertasAtivos} />
        <Stat titulo="Observações" valor={d.totais.observacoes} />
      </div>

      {d.fortesOportunidades.length > 0 && (
        <section>
          <SectionTitle hint="Preços observados via importação de e-mail com nota ≥ 8 ou gatilho de compra">
            🔥 Ação necessária — oportunidades fortes detectadas
          </SectionTitle>
          <div className="space-y-2">
            {d.fortesOportunidades.map((f) => (
              <BannerForte key={f.observacaoId} forte={f} />
            ))}
          </div>
        </section>
      )}

      {semDados && (
        <EmptyState>
          Comece cadastrando uma{" "}
          <Link href="/rotas" className="text-sky-400 hover:underline">
            rota
          </Link>{" "}
          e registrando uma{" "}
          <Link href="/oportunidades" className="text-sky-400 hover:underline">
            oportunidade
          </Link>
          .
        </EmptyState>
      )}

      <section>
        <SectionTitle hint="Ordenadas pela nota do deal (status diferente de descartado)">
          Melhores oportunidades abertas
        </SectionTitle>
        {d.melhores.length === 0 ? (
          <EmptyState>Nenhuma oportunidade em aberto.</EmptyState>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {d.melhores.map((o) => (
              <OportunidadeCard key={o.id} opp={o} />
            ))}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <SectionTitle hint="Business com gatilho de compra atingido">
            Business deals abaixo do gatilho
          </SectionTitle>
          {d.businessGatilho.length === 0 ? (
            <EmptyState>Nenhum gatilho de business atingido.</EmptyState>
          ) : (
            <div className="space-y-2">
              {d.businessGatilho.map((o) => (
                <LinhaOpp key={o.id} opp={o} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle hint="Status “comprar” ou “comparar”">
            Próximas ações
          </SectionTitle>
          {d.proximasAcoes.length === 0 ? (
            <EmptyState>Nada pendente.</EmptyState>
          ) : (
            <div className="space-y-2">
              {d.proximasAcoes.map((o) => (
                <LinhaOpp key={o.id} opp={o} mostrarStatus />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section>
          <SectionTitle>Rotas com maior potencial</SectionTitle>
          {d.rotasPotencial.length === 0 ? (
            <EmptyState>Sem rotas.</EmptyState>
          ) : (
            <Card>
              <ul className="space-y-2">
                {d.rotasPotencial.map((r) => (
                  <li
                    key={`${r.origem}-${r.destino}`}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-slate-300">
                      {r.origem} → {r.destino}{" "}
                      <span className="text-slate-500">({r.total})</span>
                    </span>
                    <NotaBadge nota={r.melhorNota} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>

        <section>
          <SectionTitle>Ofertas por cabine</SectionTitle>
          <Distribuicao
            itens={d.porCabine.map((c) => ({
              rotulo: rotuloCabine(c.chave),
              total: c.total,
            }))}
          />
        </section>

        <section>
          <SectionTitle>Ofertas por origem</SectionTitle>
          <Distribuicao
            itens={d.porOrigem.map((c) => ({
              rotulo: rotuloAeroporto(c.chave),
              total: c.total,
            }))}
          />
        </section>
      </div>

      <section>
        <SectionTitle>Ofertas por nota</SectionTitle>
        <Card>
          <div className="space-y-1.5">
            {[...d.porNota].reverse().map((n) => (
              <BarraNota key={n.nota} nota={n.nota} total={n.total} max={d.totais.oportunidades} />
            ))}
          </div>
        </Card>
      </section>

      {d.descartadas.length > 0 && (
        <section>
          <SectionTitle>Ofertas descartadas</SectionTitle>
          <div className="space-y-2">
            {d.descartadas.map((o) => (
              <LinhaOpp key={o.id} opp={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card>
      <div className="text-3xl font-bold tabular-nums">{valor}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">
        {titulo}
      </div>
    </Card>
  );
}

function LinhaOpp({
  opp,
  mostrarStatus,
}: {
  opp: OportunidadeEnriquecida;
  mostrarStatus?: boolean;
}) {
  return (
    <Card className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="text-sm text-slate-200 truncate">
          {opp.origem} → {opp.destino}{" "}
          <span className="text-slate-500">· {rotuloCabine(opp.cabine)}</span>
        </div>
        <div className="text-xs text-slate-400">
          {fmt.euro(opp.precoCash)}
          {opp.milhasNecessarias
            ? ` · ${fmt.milhas(opp.milhasNecessarias)}`
            : ""}
          {mostrarStatus ? (
            <>
              {" "}
              · <Badge tone="sky">{opp.status}</Badge>
            </>
          ) : null}
        </div>
      </div>
      <NotaBadge nota={opp.pontuacao.nota} />
    </Card>
  );
}

function Distribuicao({
  itens,
}: {
  itens: { rotulo: string; total: number }[];
}) {
  if (itens.length === 0) return <EmptyState>Sem dados.</EmptyState>;
  return (
    <Card>
      <ul className="space-y-2">
        {itens.map((i) => (
          <li
            key={i.rotulo}
            className="flex items-center justify-between text-sm text-slate-300"
          >
            <span>{i.rotulo}</span>
            <span className="tabular-nums text-slate-400">{i.total}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function BarraNota({
  nota,
  total,
  max,
}: {
  nota: number;
  total: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 tabular-nums text-slate-400">{nota}</span>
      <div className="flex-1 h-3 rounded bg-slate-800 overflow-hidden">
        <div className="h-full bg-sky-500/60" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right tabular-nums text-slate-400">{total}</span>
    </div>
  );
}

function BannerForte({ forte }: { forte: ForteOportunidade }) {
  return (
    <Card className="border border-amber-500/40 bg-amber-500/5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-amber-300">
            {forte.origem} → {forte.destino}{" "}
            <span className="text-slate-400 font-normal">
              · {rotuloCabine(forte.cabine)}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {forte.precoCash != null ? fmt.euro(forte.precoCash) : "—"}
            {forte.fonte ? ` · ${forte.fonte}` : ""}
            {forte.gatilho ? (
              <span className="ml-2 text-amber-400">⚡ Gatilho de compra</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NotaBadge nota={forte.pontuacao.nota} />
          <Link
            href="/importar"
            className="text-xs text-sky-400 hover:underline whitespace-nowrap"
          >
            Ver importações →
          </Link>
        </div>
      </div>
    </Card>
  );
}
