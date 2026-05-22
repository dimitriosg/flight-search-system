// Formatação para a interface (pt-BR).

const fmtEuro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "EUR",
});
const fmtNum = new Intl.NumberFormat("pt-BR");

export function euro(v: number | null | undefined): string {
  return v == null ? "—" : fmtEuro.format(v);
}

export function milhas(v: number | null | undefined): string {
  return v == null ? "—" : `${fmtNum.format(v)} milhas`;
}

export function duracao(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function valorMilha(v: number | null | undefined): string {
  return v == null ? "—" : `€${v.toFixed(4)}/milha`;
}

export function data(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("pt-BR");
}
