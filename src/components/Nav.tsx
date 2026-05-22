"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", rotulo: "Dashboard" },
  { href: "/oportunidades", rotulo: "Oportunidades" },
  { href: "/observacoes", rotulo: "Observações" },
  { href: "/rotas", rotulo: "Rotas" },
  { href: "/alertas", rotulo: "Alertas" },
  { href: "/rotina", rotulo: "Rotina" },
  { href: "/importar", rotulo: "Importar" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto max-w-6xl px-4 flex items-center gap-1 h-14">
        <Link href="/" className="font-semibold text-slate-100 mr-4 shrink-0">
          ✈ Passagens<span className="text-sky-400">Baratas</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const ativo =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                  ativo
                    ? "bg-sky-500/15 text-sky-300"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
              >
                {l.rotulo}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
