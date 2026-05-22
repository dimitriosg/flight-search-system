"use client";

import { useState } from "react";
import Link from "next/link";
import { postJSON } from "@/lib/client";
import {
  Card,
  SectionTitle,
  EmptyState,
  NotaBadge,
  Badge,
} from "@/components/primitives";
import { rotuloCabine, CABINES } from "@/lib/constants";
import * as fmt from "@/lib/format";
import type { AlertaParseado } from "@/lib/emailParser";
import type { ForteOportunidade } from "@/lib/opportunities";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewResp {
  parsed: AlertaParseado;
  hash: string;
  duplicado: boolean;
}

interface ImportResp {
  importacao: { id: string; status: string };
  observacaoId: string | null;
}

type Etapa = "colar" | "revisar" | "concluido";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ImportarPage() {
  const [etapa, setEtapa] = useState<Etapa>("colar");

  // Step 1 fields
  const [textoBruto, setTextoBruto] = useState("");
  const [assunto, setAssunto] = useState("");
  const [remetente, setRemetente] = useState("");

  // Preview result
  const [preview, setPreview] = useState<PreviewResp | null>(null);

  // Step 2 corrections (override parsed values)
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [cabine, setCabine] = useState("");
  const [preco, setPreco] = useState("");

  // Feedback
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ImportResp | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handlePreview() {
    if (!textoBruto.trim()) {
      setErro("Cole o texto do e-mail primeiro.");
      return;
    }
    setCarregando(true);
    setErro(null);
    const r = await postJSON<PreviewResp>("/api/importacoes/preview", {
      textoBruto,
      assunto: assunto || null,
      remetente: remetente || null,
    });
    setCarregando(false);
    if (!r.ok || !r.data) {
      setErro(r.error ?? "Falha ao analisar e-mail.");
      return;
    }
    const p = r.data;
    setPreview(p);
    setOrigem(p.parsed.origem ?? "");
    setDestino(p.parsed.destino ?? "");
    setCabine(p.parsed.cabine ?? "");
    setPreco(p.parsed.preco != null ? String(p.parsed.preco) : "");
    setEtapa("revisar");
  }

  async function handleImportar(criarObservacao: boolean) {
    if (!preview) return;
    setCarregando(true);
    setErro(null);

    const body: Record<string, unknown> = {
      textoBruto,
      assunto: assunto || null,
      remetente: remetente || null,
      fonte: preview.parsed.fonte ?? null,
      origem: origem || null,
      destino: destino || null,
      cabine: cabine || null,
      preco: preco !== "" ? Number(preco) : null,
      moeda: preview.parsed.moeda ?? null,
      dataIda: preview.parsed.dataIda ?? null,
      dataVolta: preview.parsed.dataVolta ?? null,
      confianca: preview.parsed.confianca,
      status: "pendente",
      criarObservacao,
    };

    const r = await postJSON<ImportResp>("/api/importacoes", body);
    setCarregando(false);
    if (!r.ok || !r.data) {
      setErro(r.error ?? "Falha ao importar.");
      return;
    }
    setResultado(r.data);
    setEtapa("concluido");
  }

  function reiniciar() {
    setEtapa("colar");
    setTextoBruto("");
    setAssunto("");
    setRemetente("");
    setPreview(null);
    setOrigem("");
    setDestino("");
    setCabine("");
    setPreco("");
    setErro(null);
    setResultado(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Importar e-mail de alerta</h1>
        <p className="text-sm text-slate-400 mt-1">
          Cole o texto de um e-mail do Google Flights, Skyscanner ou similar.
          O sistema extrai rota, cabine e preço automaticamente — você revisa
          antes de salvar.
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {/* ---- Etapa 1: colar ---- */}
      {etapa === "colar" && (
        <Card className="space-y-4">
          <SectionTitle>1. Cole o texto do e-mail</SectionTitle>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Assunto (opcional)
              </label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Price drop on your tracked trip"
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Remetente (opcional)
              </label>
              <input
                type="text"
                value={remetente}
                onChange={(e) => setRemetente(e.target.value)}
                placeholder="noreply@google.com"
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Corpo do e-mail <span className="text-red-400">*</span>
              </label>
              <textarea
                value={textoBruto}
                onChange={(e) => setTextoBruto(e.target.value)}
                rows={10}
                placeholder={`ATH -> GRU in Business is now €2,150\nDeparts 12 Oct 2026, returns 26 Oct 2026`}
                className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono resize-y"
              />
            </div>
          </div>
          <button
            onClick={handlePreview}
            disabled={carregando}
            className="w-full rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {carregando ? "Analisando…" : "Analisar e-mail →"}
          </button>
        </Card>
      )}

      {/* ---- Etapa 2: revisar ---- */}
      {etapa === "revisar" && preview && (
        <div className="space-y-4">
          {preview.duplicado && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
              ⚠️ Este e-mail já foi importado anteriormente (conteúdo idêntico).
              Para registrar um preço desta rota novamente, cole um e-mail
              diferente ou registre a observação manualmente em{" "}
              <a href="/observacoes" className="underline">Observações</a>.
            </div>
          )}

          <Card className="space-y-4">
            <SectionTitle>2. Revise os dados extraídos</SectionTitle>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="Fonte" valor={preview.parsed.fonte ?? "—"} />
              <InfoRow
                label="Confiança"
                valor={`${Math.round(preview.parsed.confianca * 100)}%`}
                destaque={preview.parsed.confianca >= 0.7}
              />
              <InfoRow label="Data ida" valor={preview.parsed.dataIda ?? "—"} />
              <InfoRow
                label="Data volta"
                valor={preview.parsed.dataVolta ?? "—"}
              />
              <InfoRow label="Moeda" valor={preview.parsed.moeda ?? "—"} />
            </div>

            <hr className="border-slate-700" />

            <p className="text-xs text-slate-500">
              Corrija os campos abaixo se o parser errou. Estes valores são
              usados para criar a observação de preço.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Origem (IATA)
                </label>
                <input
                  type="text"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="ATH"
                  className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Destino (IATA)
                </label>
                <input
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value.toUpperCase())}
                  maxLength={3}
                  placeholder="GRU"
                  className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Cabine
                </label>
                <select
                  value={cabine}
                  onChange={(e) => setCabine(e.target.value)}
                  className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="">— selecione —</option>
                  {CABINES.map((c) => (
                    <option key={c.valor} value={c.valor}>
                      {c.rotulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Preço (número)
                </label>
                <input
                  type="number"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="2150"
                  min={0}
                  className="w-full rounded bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleImportar(true)}
                disabled={carregando || preview.duplicado || !origem || !destino || !cabine || !preco}
                className="flex-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                {carregando ? "Salvando…" : "Salvar + criar observação de preço"}
              </button>
              <button
                onClick={() => handleImportar(false)}
                disabled={carregando || preview.duplicado}
                className="rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-50 px-4 py-2 text-sm text-slate-300 transition-colors"
              >
                Salvar só o e-mail
              </button>
            </div>

            <button
              onClick={() => setEtapa("colar")}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Voltar e editar texto
            </button>
          </Card>
        </div>
      )}

      {/* ---- Etapa 3: concluído ---- */}
      {etapa === "concluido" && resultado && (
        <Card className="space-y-4 text-center">
          <div className="text-3xl">✅</div>
          <div>
            <p className="font-medium text-slate-100">E-mail importado!</p>
            {resultado.observacaoId ? (
              <p className="text-sm text-slate-400 mt-1">
                Observação de preço criada e incluída no histórico de scoring.
              </p>
            ) : (
              <p className="text-sm text-slate-400 mt-1">
                E-mail salvo sem criar observação.
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={reiniciar}
              className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Importar outro
            </button>
            <Link
              href="/"
              className="rounded border border-slate-700 hover:bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors"
            >
              Ver dashboard
            </Link>
            {resultado.observacaoId && (
              <Link
                href="/observacoes"
                className="rounded border border-slate-700 hover:bg-slate-800 px-4 py-2 text-sm text-slate-300 transition-colors"
              >
                Ver observações
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-slate-500">{label}: </span>
      <span className={`text-sm ${destaque ? "text-green-400" : "text-slate-300"}`}>
        {valor}
      </span>
    </div>
  );
}
