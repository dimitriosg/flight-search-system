"use client";

import { useEffect, useState } from "react";
import type { Alerta } from "@prisma/client";
import { getJSON, postJSON, patchJSON, delJSON } from "@/lib/client";
import { Texto, Selecao, Checkbox } from "@/components/fields";
import { Card, EmptyState, Badge } from "@/components/primitives";
import { opcoesCabine, opcoesPlataforma } from "@/lib/options";
import { rotuloCabine } from "@/lib/constants";

const str = (v: unknown) => (v == null ? "" : String(v));

function inicial(a?: Alerta | null) {
  return {
    plataforma: a?.plataforma ?? "Google Flights",
    rota: str(a?.rota),
    cabine: a?.cabine ?? "business",
    datas: str(a?.datas),
    linkAlerta: str(a?.linkAlerta),
    frequenciaDias: str(a?.frequenciaDias ?? 1),
    ativo: a?.ativo ?? true,
  };
}

export default function AlertasPage() {
  const [lista, setLista] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Alerta | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [f, setF] = useState(inicial());
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) =>
    setF((p) => ({ ...p, [k]: v }));

  async function carregar() {
    setCarregando(true);
    const r = await getJSON<Alerta[]>("/api/alertas");
    if (r.ok && r.data) setLista(r.data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrir(a?: Alerta) {
    setEditando(a ?? null);
    setF(inicial(a));
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
      ? await patchJSON(`/api/alertas/${editando.id}`, f)
      : await postJSON("/api/alertas", f);
    setSalvando(false);
    if (r.ok) {
      fechar();
      carregar();
    } else {
      setErros(r.campos ?? {});
      if (!r.campos) alert(r.error ?? "Erro ao salvar.");
    }
  }

  async function alternar(a: Alerta) {
    const r = await patchJSON(`/api/alertas/${a.id}`, { ativo: !a.ativo });
    if (r.ok) carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este alerta?")) return;
    const r = await delJSON(`/api/alertas/${id}`);
    if (r.ok) carregar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-sm text-slate-400">
            Registre os alertas que você criou em plataformas externas (Google
            Flights, Skyscanner, Seats.aero…). O sistema não acessa APIs pagas.
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={() => abrir()}
            className="shrink-0 px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm"
          >
            + Novo alerta
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
              label="Plataforma"
              value={f.plataforma}
              onChange={(v) => set("plataforma", v)}
              options={opcoesPlataforma}
              error={erros.plataforma}
            />
            <Texto
              label="Rota"
              value={f.rota}
              onChange={(v) => set("rota", v)}
              placeholder="Ex.: ATH > GRU"
              error={erros.rota}
            />
            <Selecao
              label="Cabine"
              value={f.cabine}
              onChange={(v) => set("cabine", v)}
              options={opcoesCabine}
              error={erros.cabine}
            />
            <Texto
              label="Datas"
              value={f.datas}
              onChange={(v) => set("datas", v)}
              placeholder="Ex.: Set–Nov 2026"
            />
            <Texto
              label="Frequência (dias)"
              type="number"
              value={f.frequenciaDias}
              onChange={(v) => set("frequenciaDias", v)}
            />
            <Texto
              label="Link do alerta"
              value={f.linkAlerta}
              onChange={(v) => set("linkAlerta", v)}
              placeholder="https://..."
            />
          </div>
          <Checkbox
            label="Alerta ativo"
            checked={f.ativo}
            onChange={(v) => set("ativo", v)}
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
        <EmptyState>Nenhum alerta cadastrado.</EmptyState>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {lista.map((a) => (
            <Card key={a.id} className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-100">{a.rota}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge tone="sky">{a.plataforma}</Badge>
                    <Badge tone="slate">{rotuloCabine(a.cabine)}</Badge>
                    <Badge tone={a.ativo ? "green" : "rose"}>
                      {a.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                {a.datas && <div>Datas: {a.datas}</div>}
                <div>Verificar a cada {a.frequenciaDias} dia(s)</div>
                {a.linkAlerta && (
                  <a
                    href={a.linkAlerta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    Abrir alerta ↗
                  </a>
                )}
              </div>
              <div className="flex gap-2 border-t border-slate-800 pt-2 mt-auto">
                <button
                  onClick={() => alternar(a)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  {a.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => abrir(a)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => excluir(a.id)}
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
