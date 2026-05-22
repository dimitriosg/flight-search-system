"use client";

import { useState } from "react";
import type { OportunidadeEnriquecida } from "@/lib/enrich";
import { Texto, Selecao, Area, Checkbox } from "./fields";
import {
  opcoesAeroporto,
  opcoesCabine,
  opcoesStatus,
  opcoesFlex,
} from "@/lib/options";

interface Props {
  inicial?: OportunidadeEnriquecida | null;
  erros?: Record<string, string>;
  salvando?: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancelar: () => void;
}

const hoje = () => new Date().toISOString().slice(0, 10);
const str = (v: unknown) => (v == null ? "" : String(v));

function estadoInicial(o?: OportunidadeEnriquecida | null) {
  if (!o) {
    return {
      dataBusca: hoje(),
      origem: "ATH",
      destino: "GRU",
      companhia: "",
      cabine: "business",
      escalas: "1",
      duracaoMinutos: "",
      precoCash: "",
      milhasNecessarias: "",
      taxas: "0",
      bagagemIncluida: true,
      linkOferta: "",
      compraDireta: true,
      bilhetesSeparados: false,
      conexaoHoras: "",
      flexCancelamento: "desconhecida",
      observacoes: "",
      status: "observar",
    };
  }
  return {
    dataBusca: str(o.dataBusca).slice(0, 10) || hoje(),
    origem: o.origem,
    destino: o.destino,
    companhia: str(o.companhia),
    cabine: o.cabine,
    escalas: str(o.escalas),
    duracaoMinutos: str(o.duracaoMinutos),
    precoCash: str(o.precoCash),
    milhasNecessarias: str(o.milhasNecessarias),
    taxas: str(o.taxas),
    bagagemIncluida: o.bagagemIncluida,
    linkOferta: str(o.linkOferta),
    compraDireta: o.compraDireta,
    bilhetesSeparados: o.bilhetesSeparados,
    conexaoHoras: str(o.conexaoHoras),
    flexCancelamento: o.flexCancelamento,
    observacoes: str(o.observacoes),
    status: o.status,
  };
}

export function OportunidadeForm({
  inicial,
  erros = {},
  salvando,
  onSubmit,
  onCancelar,
}: Props) {
  const [f, setF] = useState(estadoInicial(inicial));
  const set = (k: keyof typeof f, v: string | boolean) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4"
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Texto
          label="Data da busca"
          type="date"
          value={f.dataBusca}
          onChange={(v) => set("dataBusca", v)}
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
        <Texto
          label="Companhia"
          value={f.companhia}
          onChange={(v) => set("companhia", v)}
          placeholder="Ex.: Lufthansa"
        />
        <Selecao
          label="Cabine"
          value={f.cabine}
          onChange={(v) => set("cabine", v)}
          options={opcoesCabine}
          error={erros.cabine}
        />
        <Texto
          label="Escalas"
          type="number"
          value={f.escalas}
          onChange={(v) => set("escalas", v)}
        />
        <Texto
          label="Duração total (min)"
          type="number"
          value={f.duracaoMinutos}
          onChange={(v) => set("duracaoMinutos", v)}
          hint="Ex.: 960 = 16h"
        />
        <Texto
          label="Preço cash (€)"
          type="number"
          value={f.precoCash}
          onChange={(v) => set("precoCash", v)}
          error={erros.precoCash}
        />
        <Texto
          label="Milhas necessárias"
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
        <Texto
          label="Conexão entre voos (h)"
          type="number"
          value={f.conexaoHoras}
          onChange={(v) => set("conexaoHoras", v)}
          hint="Para bilhetes separados"
        />
        <Selecao
          label="Cancelamento/alteração"
          value={f.flexCancelamento}
          onChange={(v) => set("flexCancelamento", v)}
          options={opcoesFlex}
        />
        <Selecao
          label="Status"
          value={f.status}
          onChange={(v) => set("status", v)}
          options={opcoesStatus}
        />
        <Texto
          label="Link da oferta"
          value={f.linkOferta}
          onChange={(v) => set("linkOferta", v)}
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <Checkbox
          label="Bagagem incluída"
          checked={f.bagagemIncluida}
          onChange={(v) => set("bagagemIncluida", v)}
        />
        <Checkbox
          label="Compra direta com a companhia"
          checked={f.compraDireta}
          onChange={(v) => set("compraDireta", v)}
        />
        <Checkbox
          label="Bilhetes separados"
          checked={f.bilhetesSeparados}
          onChange={(v) => set("bilhetesSeparados", v)}
        />
      </div>

      <Area
        label="Observações"
        value={f.observacoes}
        onChange={(v) => set("observacoes", v)}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm disabled:opacity-50"
        >
          {salvando ? "Salvando…" : inicial ? "Salvar alterações" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
