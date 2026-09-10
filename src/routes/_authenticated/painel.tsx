import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, ClipboardList, MapPin, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contratosQuery, locaisQuery, manutencoesQuery } from "@/lib/dados";
import { dataHora, hojeISO, moeda, primeiroDiaDoMes, rotuloStatusManutencao } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Gestão de Manutenções" },
      { name: "description", content: "Indicadores de contratos, locais e manutenções do período." },
      { property: "og:title", content: "Painel — Gestão de Manutenções" },
      {
        property: "og:description",
        content: "Indicadores de contratos, locais e manutenções do período.",
      },
    ],
  }),
  component: Painel,
});

function Painel() {
  const [de, setDe] = useState(primeiroDiaDoMes());
  const [ate, setAte] = useState(hojeISO());

  const contratos = useQuery(contratosQuery);
  const locais = useQuery(locaisQuery);
  const manutencoes = useQuery(manutencoesQuery({ de, ate }));

  const totais = useMemo(() => {
    const lista = manutencoes.data ?? [];
    const validas = lista.filter((m) => m.status !== "cancelada");
    return {
      quantidade: lista.length,
      concluidas: lista.filter((m) => m.status === "concluida").length,
      valor: validas.reduce((s, m) => s + Number(m.valor_total ?? 0), 0),
    };
  }, [manutencoes.data]);

  const contratosAtivos = (contratos.data ?? []).filter((c) => c.status === "ativo").length;

  const cards = [
    { titulo: "Contratos ativos", valor: String(contratosAtivos), icon: Building2 },
    { titulo: "Locais cadastrados", valor: String(locais.data?.length ?? 0), icon: MapPin },
    {
      titulo: "Manutenções no período",
      valor: `${totais.quantidade}`,
      detalhe: `${totais.concluidas} concluídas`,
      icon: ClipboardList,
    },
    { titulo: "Valor acumulado", valor: moeda(totais.valor), icon: Wallet },
  ];

  return (
    <div>
      <PageHeader titulo="Painel" descricao="Visão geral das operações de manutenção" />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="de">Início</Label>
          <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ate">Fim</Label>
          <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.titulo}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{c.titulo}</p>
                <c.icon className="size-4 text-muted-foreground" />
              </div>
              <p className="num mt-2 font-display text-2xl font-semibold">{c.valor}</p>
              {c.detalhe ? (
                <p className="mt-1 text-xs text-muted-foreground">{c.detalhe}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Manutenções recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(manutencoes.data ?? []).slice(0, 8).map((m) => (
            <Link
              key={m.id}
              to="/manutencoes/$id"
              params={{ id: m.id }}
              className="flex items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.contratos?.codigo} · {m.locais?.nome}
                </p>
                <p className="text-xs text-muted-foreground">{dataHora(m.data_hora)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={m.status === "concluida" ? "default" : "secondary"}>
                  {rotuloStatusManutencao[m.status]}
                </Badge>
                <span className="num text-sm font-medium">{moeda(Number(m.valor_total))}</span>
              </div>
            </Link>
          ))}
          {manutencoes.data && manutencoes.data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma manutenção registrada no período.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
