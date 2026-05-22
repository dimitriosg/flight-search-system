"use client";

import { useEffect, useState } from "react";
import type { OportunidadeEnriquecida } from "@/lib/enrich";
import { getJSON, postJSON, patchJSON, delJSON } from "@/lib/client";
import { OportunidadeCard } from "@/components/OportunidadeCard";
import { OportunidadeForm } from "@/components/OportunidadeForm";
import { EmptyState } from "@/components/primitives";
import { opcoesCabine, opcoesStatus } from "@/lib/options";

export default function OportunidadesPage() {
  const [lista, setLista] = useState<OportunidadeEnriquecida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<OportunidadeEnriquecida | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [fStatus, setFStatus] = useState("todos");
  const [fCabine, setFCabine] = useState("todos");

  async function carregar() {
    setCarregando(true);
    const r = await getJSON<OportunidadeEnriquecida[]>("/api/oportunidades");
    if (r.ok && r.data) setLista(r.data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(payload: Record<string, unknown>) {
    setSalvando(true);
    setErros({});
    const r = editando
      ? await patchJSON(`/api/oportunidades/${editando.id}`, payload)
      : await postJSON("/api/oportunidades", payload);
    setSalvando(false);
    if (r.ok) {
      fecharForm();
      carregar();
    } else {
      setErros(r.campos ?? {});
      if (!r.campos) alert(r.error ?? "Erro ao salvar.");
    }
  }

  async function mudarStatus(id: string, status: string) {
    const r = await patchJSON(`/api/oportunidades/${id}`, { status });
    if (r.ok) carregar();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta oportunidade?")) return;
    const r = await delJSON(`/api/oportunidades/${id}`);
    if (r.ok) carregar();
  }

  function abrirNovo() {
    setEditando(null);
    setErros({});
    setMostrarForm(true);
  }

  function editar(opp: OportunidadeEnriquecida) {
    setEditando(opp);
    setErros({});
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharForm() {
    setMostrarForm(false);
    setEditando(null);
    setErros({});
  }

  const filtrada = lista
    .filter((o) => fStatus === "todos" || o.status === fStatus)
    .filter((o) => fCabine === "todos" || o.cabine === fCabine)
    .sort((a, b) => b.pontuacao.nota - a.pontuacao.nota);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Oportunidades</h1>
          <p className="text-sm text-slate-400">
            Registre ofertas encontradas em qualquer site. A nota, o valor por
            milha e os avisos são calculados automaticamente.
          </p>
        </div>
        {!mostrarForm && (
          <button
            onClick={abrirNovo}
            className="shrink-0 px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm"
          >
            + Nova oportunidade
          </button>
        )}
      </div>

      {mostrarForm && (
        <OportunidadeForm
          inicial={editando}
          erros={erros}
          salvando={salvando}
          onSubmit={salvar}
          onCancelar={fecharForm}
        />
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2 m-0 text-slate-400">
          Status
          <select
            className="w-auto py-1"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
          >
            <option value="todos">Todos</option>
            {opcoesStatus.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 m-0 text-slate-400">
          Cabine
          <select
            className="w-auto py-1"
            value={fCabine}
            onChange={(e) => setFCabine(e.target.value)}
          >
            <option value="todos">Todas</option>
            {opcoesCabine.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-slate-500">{filtrada.length} oportunidade(s)</span>
      </div>

      {carregando ? (
        <EmptyState>Carregando…</EmptyState>
      ) : filtrada.length === 0 ? (
        <EmptyState>
          Nenhuma oportunidade. Clique em “Nova oportunidade” para registrar a
          primeira.
        </EmptyState>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtrada.map((opp) => (
            <OportunidadeCard
              key={opp.id}
              opp={opp}
              detalhado
              onStatus={mudarStatus}
              onEditar={editar}
              onExcluir={excluir}
            />
          ))}
        </div>
      )}
    </div>
  );
}
