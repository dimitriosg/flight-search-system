"use client";

import { useEffect, useState } from "react";
import type { Rota } from "@prisma/client";
import { getJSON, postJSON, patchJSON, delJSON } from "@/lib/client";
import { Texto, Selecao, Area, Checkbox } from "@/components/fields";
import { Card, EmptyState, Badge } from "@/components/primitives";
import { opcoesAeroporto, opcoesCabine, opcoesPrograma } from "@/lib/options";
import { rotuloAeroporto, rotuloCabine } from "@/lib/constants";
import * as fmt from "@/lib/format";

const str = (v: unknown) => (v == null ? "" : String(v));

function inicial(r?: Rota | null) {
  return {
    origem: r?.origem ?? "ATH",
    destino: r?.destino ?? "GRU",
    cabine: r?.cabine ?? "business",
    datasDesejadas: str(r?.datasDesejadas),
    flexibilidadeDias: str(r?.flexibilidadeDias ?? 0),
    precoMaximo: str(r?.precoMaximo),
    companhiaPreferida: str(r?.companhiaPreferida),
    programaMilhas: str(r?.programaMilhas),
    precoMedioReferencia: str(r?.precoMedioReferencia),
    observacoes: str(r?.observacoes),
    ativa: r?.ativa ?? true,
  };
}

export default function RotasPage() {
  const [lista, setLista] = useState<Rota[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Rota | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [f, setF] = useState(inicial());
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) =>
    setF((p) => ({ ...p, [k]: v }));

  async function carregar() {
    setCarregando(true);
    const r = await getJSON<Rota[]>("/api/rotas");
    if (r.ok && r.data) setLista(r.data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrir(r?: Rota) {
    setEditando(r ?? null);
    setF(inicial(r));
    setErros({});
    setMostrarForm(true);
  }

  function fechar() {
    setMostrarForm(false);
    setEditando(null);
    setErros({});
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErros({});
    const r = editando
      ? await patchJSON(`/api/rotas/${editando.id}`, f)
      : await postJSON("/api/rotas", f);
    setSalvando(false);
    if (r.ok) {
      fechar();
      carregar();
    } else {
      setErros(r.campos ?? {});
      if (!r.campos) alert(r.error ?? "Erro ao salvar.");
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta rota?")) return;
    const r = await delJSON(`/api/rotas/${id}`);
    if (r.ok) carregar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rotas</h1>
          <p className="text-sm text-slate-400">
            Cadastre as rotas que quer monitorar. Não procure só ATH → GRU:
            cadastre também hubs europeus → Brasil.
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => abrir()}
            className="shrink-0 px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm"
          >
            + Nova rota
          </button>
        )}
      </div>

      {mostrarForm && (
        <form
          onSubmit={salvar}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              label="Datas desejadas"
              value={f.datasDesejadas}
              onChange={(v) => set("datasDesejadas", v)}
              placeholder="Ex.: Set–Nov 2026"
            />
            <Texto
              label="Flexibilidade (dias)"
              type="number"
              value={f.flexibilidadeDias}
              onChange={(v) => set("flexibilidadeDias", v)}
            />
            <Texto
              label="Preço máximo (€)"
              type="number"
              value={f.precoMaximo}
              onChange={(v) => set("precoMaximo", v)}
            />
            <Texto
              label="Companhia preferida"
              value={f.companhiaPreferida}
              onChange={(v) => set("companhiaPreferida", v)}
            />
            <Selecao
              label="Programa de milhas"
              value={f.programaMilhas}
              onChange={(v) => set("programaMilhas", v)}
              options={opcoesPrograma}
            />
            <Texto
              label="Preço médio de referência (€)"
              type="number"
              value={f.precoMedioReferencia}
              onChange={(v) => set("precoMedioReferencia", v)}
              hint="Usado como base para a nota"
            />
          </div>
          <Area
            label="Observações"
            value={f.observacoes}
            onChange={(v) => set("observacoes", v)}
          />
          <Checkbox
            label="Rota ativa"
            checked={f.ativa}
            onChange={(v) => set("ativa", v)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm disabled:opacity-50"
            >
              {salvando ? "Salvando…" : editando ? "Salvar" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={fechar}
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <EmptyState>Carregando…</EmptyState>
      ) : lista.length === 0 ? (
        <EmptyState>Nenhuma rota cadastrada.</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {lista.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-100">
                    {rotuloAeroporto(r.origem)}{" "}
                    <span className="text-slate-500">→</span>{" "}
                    {rotuloAeroporto(r.destino)}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={r.cabine === "business" ? "sky" : "slate"}>
                      {rotuloCabine(r.cabine)}
                    </Badge>
                    {!r.ativa && <Badge tone="rose">Inativa</Badge>}
                  </div>
                </div>
              </div>
              <dl className="text-xs text-slate-400 space-y-0.5">
                {r.datasDesejadas && <div>Datas: {r.datasDesejadas}</div>}
                <div>Flexibilidade: ±{r.flexibilidadeDias} dia(s)</div>
                {r.precoMaximo != null && (
                  <div>Preço máximo: {fmt.euro(r.precoMaximo)}</div>
                )}
                {r.precoMedioReferencia != null && (
                  <div>Referência: {fmt.euro(r.precoMedioReferencia)}</div>
                )}
                {r.companhiaPreferida && (
                  <div>Companhia: {r.companhiaPreferida}</div>
                )}
                {r.programaMilhas && <div>Milhas: {r.programaMilhas}</div>}
                {r.observacoes && (
                  <div className="text-slate-500">{r.observacoes}</div>
                )}
              </dl>
              <div className="flex gap-2 border-t border-slate-800 pt-2 mt-auto">
                <button
                  onClick={() => abrir(r)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluir(r.id)}
                  className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                >
                  Excluir
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
