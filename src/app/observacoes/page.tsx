"use client";

import { useEffect, useMemo, useState } from "react";
import type { Observacao } from "@prisma/client";
import { getJSON, postJSON, delJSON } from "@/lib/client";
import { Texto, Selecao, Area } from "@/components/fields";
import { Card, EmptyState, SectionTitle, Badge } from "@/components/primitives";
import { opcoesAeroporto, opcoesCabine, opcoesPlataforma } from "@/lib/options";
import { rotuloCabine } from "@/lib/constants";
import * as fmt from "@/lib/format";

const hoje = () => new Date().toISOString().slice(0, 10);

const vazio = {
  dataObservacao: hoje(),
  origem: "ATH",
  destino: "GRU",
  cabine: "business",
  precoCash: "",
  milhasNecessarias: "",
  taxas: "0",
  fonte: "Google Flights",
  observacoes: "",
};

interface Media {
  chave: string;
  cabine: string;
  media: number;
  amostras: number;
}

export default function ObservacoesPage() {
  const [lista, setLista] = useState<Observacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [f, setF] = useState(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f, v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  async function carregar() {
    setCarregando(true);
    const r = await getJSON<Observacao[]>("/api/observacoes");
    if (r.ok && r.data) setLista(r.data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErros({});
    const r = await postJSON("/api/observacoes", f);
    setSalvando(false);
    if (r.ok) {
      setF({ ...vazio, origem: f.origem, destino: f.destino, cabine: f.cabine });
      carregar();
    } else {
      setErros(r.campos ?? {});
      if (!r.campos) alert(r.error ?? "Erro ao salvar.");
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta observação?")) return;
    const r = await delJSON(`/api/observacoes/${id}`);
    if (r.ok) carregar();
  }

  // Preço médio por rota + cabine (calculado das observações com preço cash).
  const medias = useMemo<Media[]>(() => {
    const mapa = new Map<string, { soma: number; n: number; cabine: string }>();
    for (const o of lista) {
      if (o.precoCash == null) continue;
      const chave = `${o.origem} → ${o.destino} · ${o.cabine}`;
      const atual = mapa.get(chave) ?? { soma: 0, n: 0, cabine: o.cabine };
      atual.soma += o.precoCash;
      atual.n += 1;
      mapa.set(chave, atual);
    }
    return [...mapa.entries()]
      .map(([chave, v]) => ({
        chave,
        cabine: v.cabine,
        media: v.soma / v.n,
        amostras: v.n,
      }))
      .sort((a, b) => a.chave.localeCompare(b.chave));
  }, [lista]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Observações de preço</h1>
        <p className="text-sm text-slate-400">
          Log de monitoramento: registre o preço de uma rota de tempos em tempos.
          A média observada alimenta a nota das oportunidades.
        </p>
      </div>

      <form
        onSubmit={salvar}
        className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Texto
            label="Data"
            type="date"
            value={f.dataObservacao}
            onChange={(v) => set("dataObservacao", v)}
          />
          <Selecao
            label="Origem"
            value={f.origem}
            onChange={(v) => set("origem", v)}
            options={opcoesAeroporto}
            error={erros.origem}
          />
          <Selecao
            label="Destino"
            value={f.destino}
            onChange={(v) => set("destino", v)}
            options={opcoesAeroporto}
            error={erros.destino}
          />
          <Selecao
            label="Cabine"
            value={f.cabine}
            onChange={(v) => set("cabine", v)}
            options={opcoesCabine}
            error={erros.cabine}
          />
          <Texto
            label="Preço cash (€)"
            type="number"
            value={f.precoCash}
            onChange={(v) => set("precoCash", v)}
            error={erros.precoCash}
          />
          <Texto
            label="Milhas"
            type="number"
            value={f.milhasNecessarias}
            onChange={(v) => set("milhasNecessarias", v)}
          />
          <Texto
            label="Taxas (€)"
            type="number"
            value={f.taxas}
            onChange={(v) => set("taxas", v)}
          />
          <Selecao
            label="Fonte"
            value={f.fonte}
            onChange={(v) => set("fonte", v)}
            options={opcoesPlataforma}
          />
        </div>
        <Area
          label="Observações"
          value={f.observacoes}
          onChange={(v) => set("observacoes", v)}
        />
        <button
          type="submit"
          disabled={salvando}
          className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Registrar observação"}
        </button>
      </form>

      {medias.length > 0 && (
        <section>
          <SectionTitle hint="Calculado a partir das observações com preço cash">
            Preço médio por rota
          </SectionTitle>
          <Card>
            <ul className="space-y-2">
              {medias.map((m) => (
                <li
                  key={m.chave}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-300">
                    {m.chave.replace(`· ${m.cabine}`, "")}{" "}
                    <Badge tone={m.cabine === "business" ? "sky" : "slate"}>
                      {rotuloCabine(m.cabine)}
                    </Badge>
                  </span>
                  <span className="text-slate-200">
                    {fmt.euro(m.media)}{" "}
                    <span className="text-xs text-slate-500">
                      ({m.amostras} amostra{m.amostras > 1 ? "s" : ""})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>Histórico</SectionTitle>
        {carregando ? (
          <EmptyState>Carregando…</EmptyState>
        ) : lista.length === 0 ? (
          <EmptyState>Nenhuma observação registrada.</EmptyState>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-800">
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Rota</th>
                  <th className="px-3 py-2">Cabine</th>
                  <th className="px-3 py-2">Preço</th>
                  <th className="px-3 py-2">Milhas</th>
                  <th className="px-3 py-2">Fonte</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-800/60 last:border-0"
                  >
                    <td className="px-3 py-2 text-slate-400">
                      {fmt.data(o.dataObservacao)}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {o.origem} → {o.destino}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {rotuloCabine(o.cabine)}
                    </td>
                    <td className="px-3 py-2 text-slate-200">
                      {fmt.euro(o.precoCash)}
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {o.milhasNecessarias ? fmt.milhas(o.milhasNecessarias) : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{o.fonte ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => excluir(o.id)}
                        className="text-xs px-2 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
