export function moeda(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : (valor ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(n) ? n : 0,
  );
}

export function numero(valor: number | string | null | undefined, casas = 2): string {
  const n = typeof valor === "string" ? Number(valor) : (valor ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  }).format(Number.isFinite(n) ? n : 0);
}

export function dataHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dataCurta(valor: string | null | undefined): string {
  if (!valor) return "—";
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T12:00:00` : valor;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function paraInputDateTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function primeiroDiaDoMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function hojeISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const rotuloStatusManutencao: Record<string, string> = {
  rascunho: "Rascunho",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const rotuloStatusContrato: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  encerrado: "Encerrado",
};
