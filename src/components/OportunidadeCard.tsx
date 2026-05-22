"use client";

import type { OportunidadeEnriquecida } from "@/lib/enrich";
import {
  rotuloAeroporto,
  rotuloCabine,
  STATUS_OPORTUNIDADE,
  rotuloStatus,
} from "@/lib/constants";
import { ROTULO_QUALIDADE_MILHA } from "@/lib/miles";
import * as fmt from "@/lib/format";
import { Badge, NotaBadge, Avisos } from "./primitives";

interface Props {
  opp: OportunidadeEnriquecida;
  onStatus?: (id: string, status: string) => void;
  onEditar?: (opp: OportunidadeEnriquecida) => void;
  onExcluir?: (id: string) => void;
  detalhado?: boolean;
}

const toneCabine = (c: string) =>
  c === "business" ? "sky" : c === "premium" ? "green" : "slate";

export function OportunidadeCard({
  opp,
  onStatus,
  onEditar,
  onExcluir,
  detalhado = false,
}: Props) {
  const milhaQual = opp.qualidadeMilha
    ? ROTULO_QUALIDADE_MILHA[opp.qualidadeMilha]
    : null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-100">
            {rotuloAeroporto(opp.origem)}{" "}
            <span className="text-slate-500">→</span>{" "}
            {rotuloAeroporto(opp.destino)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <Badge tone={toneCabine(opp.cabine)}>
              {rotuloCabine(opp.cabine)}
            </Badge>
            {opp.companhia ? (
              <span className="text-slate-400">{opp.companhia}</span>
            ) : null}
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">
              {opp.escalas === 0 ? "Direto" : `${opp.escalas} escala(s)`}
            </span>
            {opp.duracaoMinutos != null ? (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  {fmt.duracao(opp.duracaoMinutos)}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <NotaBadge nota={opp.pontuacao.nota} rotulo={opp.pontuacao.rotulo} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Campo titulo="Preço cash" valor={fmt.euro(opp.precoCash)} />
        <Campo titulo="Milhas" valor={fmt.milhas(opp.milhasNecessarias)} />
        <Campo
          titulo="Valor/milha"
          valor={fmt.valorMilha(opp.valorPorMilha)}
          sub={milhaQual ?? undefined}
        />
        <Campo titulo="Taxas" valor={fmt.euro(opp.taxas)} />
      </div>

      {(opp.contexto.precoMedioCabine != null ||
        opp.contexto.precoEconomyBaseline != null) && (
        <div className="text-xs text-slate-400">
          {opp.contexto.precoMedioCabine != null && (
            <span>
              Média da cabine: {fmt.euro(opp.contexto.precoMedioCabine)}{" "}
            </span>
          )}
          {opp.contexto.precoEconomyBaseline != null && (
            <span>· Economy base: {fmt.euro(opp.contexto.precoEconomyBaseline)}</span>
          )}
        </div>
      )}

      {/* Gatilhos atingidos */}
      {opp.gatilhos.gatilhos.some((g) => g.atingido) && (
        <div className="flex flex-wrap gap-1.5">
          {opp.gatilhos.gatilhos
            .filter((g) => g.atingido)
            .map((g) => (
              <Badge key={g.codigo} tone={g.deCompra ? "green" : "slate"}>
                ✓ {g.descricao}
              </Badge>
            ))}
        </div>
      )}

      <Avisos avisos={opp.avisos} />

      {detalhado && (
        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-300">
            Como a nota foi calculada
          </summary>
          <ul className="mt-2 space-y-1">
            {opp.pontuacao.fatores.map((f, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {f.fator}
                  {f.detalhe ? (
                    <span className="text-slate-500"> — {f.detalhe}</span>
                  ) : null}
                </span>
                <span
                  className={`tabular-nums ${
                    f.pontos >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {f.pontos >= 0 ? "+" : ""}
                  {f.pontos}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {opp.linkOferta ? (
        <a
          href={opp.linkOferta}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-sky-400 hover:underline w-fit"
        >
          Abrir oferta ↗
        </a>
      ) : null}

      {(onStatus || onEditar || onExcluir) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
          {onStatus && (
            <label className="flex items-center gap-2 text-xs text-slate-400 m-0">
              <span>Status</span>
              <select
                value={opp.status}
                onChange={(e) => onStatus(opp.id, e.target.value)}
                className="w-auto py-1"
              >
                {STATUS_OPORTUNIDADE.map((s) => (
                  <option key={s} value={s}>
                    {rotuloStatus(s)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="ml-auto flex gap-2">
            {onEditar && (
              <button
                onClick={() => onEditar(opp)}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Editar
              </button>
            )}
            {onExcluir && (
              <button
                onClick={() => onExcluir(opp.id)}
                className="text-xs px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  titulo,
  valor,
  sub,
}: {
  titulo: string;
  valor: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {titulo}
      </div>
      <div className="text-slate-100">{valor}</div>
      {sub ? <div className="text-[11px] text-slate-400">{sub}</div> : null}
    </div>
  );
}
