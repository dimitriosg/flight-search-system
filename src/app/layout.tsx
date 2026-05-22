import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Sistema de Passagens Baratas",
  description:
    "Painel pessoal para monitorar passagens mais baratas, com foco em Business Class. Entrada manual, sem APIs pagas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-slate-500">
          Método, disciplina e monitoramento — sem promessas de “sistema
          secreto”. Confirme sempre no site oficial da companhia antes de
          comprar.
        </footer>
      </body>
    </html>
  );
}
