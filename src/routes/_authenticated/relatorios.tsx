import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  contratosQuery,
  empresaQuery,
  locaisQuery,
  manutencoesQuery,
  tecnicosQuery,
  urlAssinada,
  type ManutencaoCompleta,
  type FiltroManutencoes,
} from "@/lib/dados";
import { dataCurta, dataHora, moeda, numero, hojeISO, primeiroDiaDoMes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios técnicos — Gestão de Manutenções" },
      {
        name: "description",
        content: "Gere relatórios técnicos em PDF por contrato, local e período com fotos e valores.",
      },
      { property: "og:title", content: "Relatórios técnicos — Gestão de Manutenções" },
      {
        property: "og:description",
        content: "Gere relatórios técnicos em PDF por contrato, local e período com fotos e valores.",
      },
    ],
  }),
  component: Relatorios,
});

const TODOS = "todos";

const ESTILO_IMPRESSAO = `
@media print {
  body { background: #fff; }
  .no-print, aside, header, nav { display: none !important; }
  main { padding: 0 !important; }
  .pagina-relatorio { box-shadow: none !important; border: 0 !important; }
  .quebra { break-before: page; }
  .evitar-quebra { break-inside: avoid; }
}
@page { size: A4; margin: 14mm; }
`;

function Relatorios() {
  const contratos = useQuery(contratosQuery);
  const locais = useQuery(locaisQuery);
  const tecnicos = useQuery(tecnicosQuery);
  const { data: empresa } = useQuery(empresaQuery);

  const [contratoId, setContratoId] = useState<string>("");
  const [localId, setLocalId] = useState<string>(TODOS);
  const [de, setDe] = useState(primeiroDiaDoMes());
  const [ate, setAte] = useState(hojeISO());

  const filtro: FiltroManutencoes = {
    de,
    ate,
    status: "concluida",
    ...(contratoId ? { contratoId } : {}),
    ...(localId !== TODOS ? { localId } : {}),
  };
  const manutencoes = useQuery({
    ...manutencoesQuery(filtro),
    enabled: Boolean(contratoId),
  });

  const lista = (manutencoes.data ?? []) as ManutencaoCompleta[];
  const contrato = contratos.data?.find((c) => c.id === contratoId) ?? null;
  const locaisDoContrato = (locais.data ?? []).filter((l) => l.contrato_id === contratoId);
  const nomeTecnico = (id: string | null) =>
    tecnicos.data?.find((t) => t.id === id)?.nome ?? "Não informado";

  const fotos = useMemo(
    () => lista.flatMap((m) => m.manutencao_fotos.map((f) => ({ ...f, manutencao: m }))),
    [lista],
  );

  const urls = useQueries({
    queries: fotos.map((f) => ({
      queryKey: ["foto-url", f.storage_path],
      queryFn: () => urlAssinada("manutencao-fotos", f.storage_path, 7200),
      staleTime: 60 * 60 * 1000,
    })),
  });

  const total = lista.reduce((s, m) => s + Number(m.valor_total ?? 0), 0);

  const consolidado = useMemo(() => {
    const mapa = new Map<
      string,
      { codigo: string; nome: string; unidade: string; qtd: number; total: number }
    >();
    for (const m of lista) {
      for (const i of m.manutencao_itens) {
        const chave = `${i.codigo_snapshot}|${i.nome_snapshot}`;
        const atual = mapa.get(chave) ?? {
          codigo: i.codigo_snapshot,
          nome: i.nome_snapshot,
          unidade: i.unidade_snapshot,
          qtd: 0,
          total: 0,
        };
        atual.qtd += Number(i.quantidade);
        atual.total += Number(i.valor_total);
        mapa.set(chave, atual);
      }
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
  }, [lista]);

  return (
    <div>
      <style>{ESTILO_IMPRESSAO}</style>
      <div className="no-print">
        <PageHeader
          titulo="Relatórios técnicos"
          descricao="Filtre por contrato, local e período e exporte o relatório em PDF"
          acao={
            <Button onClick={() => window.print()} disabled={!contratoId || lista.length === 0}>
              <Printer className="size-4" /> Exportar PDF
            </Button>
          }
        />

        <Card className="mb-6">
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Contrato</Label>
              <Select
                value={contratoId}
                onValueChange={(v) => {
                  setContratoId(v);
                  setLocalId(TODOS);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {(contratos.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Local</Label>
              <Select value={localId} onValueChange={setLocalId} disabled={!contratoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os locais</SelectItem>
                  {locaisDoContrato.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="de">Início</Label>
              <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ate">Fim</Label>
              <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!contratoId ? (
        <p className="text-sm text-muted-foreground">Selecione um contrato para gerar o relatório.</p>
      ) : manutencoes.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando manutenções…</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma manutenção concluída no período selecionado.
        </p>
      ) : (
        <div className="pagina-relatorio mx-auto max-w-4xl space-y-8 rounded-lg border bg-card p-6 text-card-foreground md:p-10">
          {/* Capa */}
          <header className="evitar-quebra space-y-2 border-b pb-6">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {empresa?.razao_social ?? "Prestadora de serviços"}
              {empresa?.cnpj ? ` · CNPJ ${empresa.cnpj}` : ""}
            </p>
            <h1 className="font-display text-2xl font-semibold">Relatório Técnico de Manutenções</h1>
            <div className="grid gap-1 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Cliente:</span> {contrato?.cliente}
              </p>
              <p>
                <span className="text-muted-foreground">Contrato:</span> {contrato?.codigo}
              </p>
              <p>
                <span className="text-muted-foreground">Local:</span>{" "}
                {localId === TODOS
                  ? "Todos os locais"
                  : (locaisDoContrato.find((l) => l.id === localId)?.nome ?? "—")}
              </p>
              <p className="num">
                <span className="text-muted-foreground">Período:</span> {dataCurta(de)} a{" "}
                {dataCurta(ate)}
              </p>
              {empresa?.responsavel_tecnico ? (
                <p>
                  <span className="text-muted-foreground">Responsável técnico:</span>{" "}
                  {empresa.responsavel_tecnico}
                  {empresa.conselho ? ` · ${empresa.conselho}` : ""}
                </p>
              ) : null}
            </div>
          </header>

          {/* Resumo executivo */}
          <section className="evitar-quebra space-y-3">
            <h2 className="font-display text-lg font-semibold">Resumo executivo</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Manutenções", numero(lista.length, 0)],
                ["Locais atendidos", numero(new Set(lista.map((m) => m.local_id)).size, 0)],
                ["Itens executados", numero(consolidado.reduce((s, c) => s + c.qtd, 0))],
                ["Valor total", moeda(total)],
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{rotulo}</p>
                  <p className="num mt-1 font-semibold">{valor}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Detalhamento */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Manutenções realizadas</h2>
            {lista.map((m, indice) => (
              <article key={m.id} className="evitar-quebra space-y-2 rounded-md border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium">
                    {indice + 1}. {m.locais?.nome ?? "Local não informado"}
                  </h3>
                  <p className="num text-xs text-muted-foreground">{dataHora(m.data_hora)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Técnico: {nomeTecnico(m.tecnico_id)}
                </p>
                {m.descricao ? <p className="text-sm whitespace-pre-wrap">{m.descricao}</p> : null}
                {m.observacoes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    Observações: {m.observacoes}
                  </p>
                ) : null}
                {m.manutencao_itens.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-right">Qtd</th>
                        <th className="py-1 text-right">Unit.</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.manutencao_itens.map((i) => (
                        <tr key={i.id} className="border-b last:border-0">
                          <td className="py-1">
                            {i.codigo_snapshot} — {i.nome_snapshot}
                          </td>
                          <td className="num py-1 text-right">
                            {numero(i.quantidade)} {i.unidade_snapshot}
                          </td>
                          <td className="num py-1 text-right">
                            {moeda(i.valor_unitario_snapshot)}
                          </td>
                          <td className="num py-1 text-right">{moeda(i.valor_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
                <p className="num text-right text-sm font-medium">Subtotal: {moeda(m.valor_total)}</p>
              </article>
            ))}
          </section>

          {/* Registro fotográfico */}
          {fotos.length > 0 ? (
            <section className="quebra space-y-3">
              <h2 className="font-display text-lg font-semibold">Registro fotográfico</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {fotos.map((f, i) => (
                  <figure key={f.id} className="evitar-quebra space-y-1">
                    {urls[i]?.data ? (
                      <img
                        src={urls[i]!.data as string}
                        alt={f.legenda ?? `Foto ${i + 1} da manutenção`}
                        className="aspect-4/3 w-full rounded-md border object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-4/3 w-full rounded-md border bg-muted" />
                    )}
                    <figcaption className="text-[11px] text-muted-foreground">
                      Foto {i + 1} · {dataCurta(f.manutencao.data_hora)} ·{" "}
                      {f.manutencao.locais?.nome ?? "—"}
                      {f.legenda ? ` — ${f.legenda}` : ""}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {/* Financeiro consolidado */}
          <section className="quebra space-y-3">
            <h2 className="font-display text-lg font-semibold">Consolidação financeira do período</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1">Código</th>
                  <th className="py-1">Serviço</th>
                  <th className="py-1 text-right">Qtd</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {consolidado.map((c) => (
                  <tr key={c.codigo + c.nome} className="border-b last:border-0">
                    <td className="num py-1">{c.codigo}</td>
                    <td className="py-1">{c.nome}</td>
                    <td className="num py-1 text-right">
                      {numero(c.qtd)} {c.unidade}
                    </td>
                    <td className="num py-1 text-right">{moeda(c.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-medium">
                    Valor total do período
                  </td>
                  <td className="num py-2 text-right font-semibold">{moeda(total)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          <footer className="border-t pt-4 text-[11px] text-muted-foreground">
            {empresa?.razao_social ?? ""}
            {empresa?.telefone ? ` · ${empresa.telefone}` : ""}
            {empresa?.email ? ` · ${empresa.email}` : ""}
          </footer>
        </div>
      )}
    </div>
  );
}
