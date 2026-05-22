import type { AvisoSeguranca } from "@/lib/safety";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-slate-100">{children}</h2>
      {hint ? <p className="text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "sky" | "green" | "amber" | "rose";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-700/40 text-slate-300",
    sky: "bg-sky-500/15 text-sky-300",
    green: "bg-green-500/15 text-green-300",
    amber: "bg-amber-500/15 text-amber-300",
    rose: "bg-rose-500/15 text-rose-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function classesNota(nota: number): string {
  if (nota >= 10)
    return "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30";
  if (nota >= 8) return "bg-green-500/15 text-green-300 ring-green-500/30";
  if (nota >= 6) return "bg-sky-500/15 text-sky-300 ring-sky-500/30";
  if (nota >= 4) return "bg-amber-500/15 text-amber-300 ring-amber-500/30";
  return "bg-rose-500/15 text-rose-300 ring-rose-500/30";
}

export function NotaBadge({
  nota,
  rotulo,
}: {
  nota: number;
  rotulo?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold ring-1 ${classesNota(
        nota,
      )}`}
      title={rotulo}
    >
      <span className="tabular-nums">{nota}/10</span>
      {rotulo ? (
        <span className="font-normal opacity-90">· {rotulo}</span>
      ) : null}
    </span>
  );
}

export function Avisos({ avisos }: { avisos: AvisoSeguranca[] }) {
  if (avisos.length === 0) return null;
  const cor: Record<string, string> = {
    critico: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    aviso: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    info: "border-slate-600 bg-slate-800/40 text-slate-300",
  };
  const icone: Record<string, string> = {
    critico: "⛔",
    aviso: "⚠️",
    info: "ℹ️",
  };
  return (
    <ul className="space-y-1.5">
      {avisos.map((a, i) => (
        <li
          key={i}
          className={`flex gap-2 rounded-md border px-2.5 py-1.5 text-xs ${cor[a.nivel]}`}
        >
          <span aria-hidden>{icone[a.nivel]}</span>
          <span>{a.mensagem}</span>
        </li>
      ))}
    </ul>
  );
}
