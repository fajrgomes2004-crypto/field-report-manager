import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  contratosQuery,
  itensQuery,
  locaisQuery,
  manutencoesQuery,
  sessaoQuery,
  tecnicosQuery,
  type FiltroManutencoes,
} from "@/lib/dados";
import { dataHora, moeda, rotuloStatusManutencao } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/manutencoes/")({
  head: () => ({
    meta: [
      { title: "Histórico de manutenções" },
      { name: "description", content: "Pesquise e filtre todas as manutenções registradas." },
      { property: "og:title", content: "Histórico de manutenções" },
      {
        property: "og:description",
        content: "Pesquise e filtre todas as manutenções registradas.",
      },
    ],
  }),
  component: Historico,
});

const TODOS = "__todos__";

function Historico() {
  const [filtro, setFiltro] = useState<FiltroManutencoes>({});
  const [busca, setBusca] = useState("");

  const sessao = useQuery(sessaoQuery);
  const contratos = useQuery(contratosQuery);
  const locais = useQuery(locaisQuery);
  const itens = useQuery(itensQuery);
  const tecnicos = useQuery(tecnicosQuery);
  const manutencoes = useQuery(manutencoesQuery(filtro));

  const locaisFiltrados = (locais.data ?? []).filter(
    (l) => !filtro.contratoId || l.contrato_id === filtro.contratoId,
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = manutencoes.data ?? [];
    if (!termo) return base;
    return base.filter((m) =>
      [
        m.contratos?.codigo,
        m.contratos?.cliente,
        m.locais?.nome,
        m.descricao,
        m.observacoes,
        ...m.manutencao_itens.map((i) => i.nome_snapshot),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termo),
    );
  }, [manutencoes.data, busca]);

  const total = lista
    .filter((m) => m.status !== "cancelada")
    .reduce((s, m) => s + Number(m.valor_total ?? 0), 0);

  function set(campo: keyof FiltroManutencoes, valor: string) {
    setFiltro((f) => ({ ...f, [campo]: valor === TODOS || valor === "" ? undefined : valor }));
  }

  const nomeTecnico = (id: string) =>
    tecnicos.data?.find((t) => t.id === id)?.nome ?? (id === sessao.data?.id ? "Você" : "—");

  return (
    <div>
      <PageHeader
        titulo="Histórico de manutenções"
        descricao="Todas as manutenções registradas, com filtros avançados"
        acao={
          <Button asChild>
            <Link to="/manutencoes/nova">
              <PlusCircle className="size-4" /> Nova manutenção
            </Link>
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-5 md:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1.5 md:col-span-3 lg:col-span-4">
            <Label htmlFor="busca">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                id="busca"
                className="pl-9"
                placeholder="Cliente, local, serviço ou descrição"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <Campo label="Contrato">
            <Select
              value={filtro.contratoId ?? TODOS}
              onValueChange={(v) => {
                set("contratoId", v);
                set("localId", TODOS);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os contratos</SelectItem>
                {(contratos.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} — {c.cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>

          <Campo label="Local">
            <Select value={filtro.localId ?? TODOS} onValueChange={(v) => set("localId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os locais</SelectItem>
                {locaisFiltrados.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>

          <Campo label="Técnico">
            <Select value={filtro.tecnicoId ?? TODOS} onValueChange={(v) => set("tecnicoId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os técnicos</SelectItem>
                {(tecnicos.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome || t.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>

          <Campo label="Item de serviço">
            <Select value={filtro.itemId ?? TODOS} onValueChange={(v) => set("itemId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os itens</SelectItem>
                {(itens.data ?? []).map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.codigo} — {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>

          <Campo label="Status">
            <Select value={filtro.status ?? TODOS} onValueChange={(v) => set("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </Campo>

          <Campo label="De">
            <Input
              type="date"
              value={filtro.de ?? ""}
              onChange={(e) => set("de", e.target.value)}
            />
          </Campo>
          <Campo label="Até">
            <Input
              type="date"
              value={filtro.ate ?? ""}
              onChange={(e) => set("ate", e.target.value)}
            />
          </Campo>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{lista.length} registro(s)</span>
        <span className="num font-medium">Total: {moeda(total)}</span>
      </div>

      {/* Lista em cartões no celular */}
      <div className="space-y-2 md:hidden">
        {lista.map((m) => (
          <Link
            key={m.id}
            to="/manutencoes/$id"
            params={{ id: m.id }}
            className="block rounded-md border bg-card p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.locais?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {m.contratos?.codigo} · {dataHora(m.data_hora)}
                </p>
              </div>
              <Badge variant={m.status === "concluida" ? "default" : "secondary"}>
                {rotuloStatusManutencao[m.status]}
              </Badge>
            </div>
            <p className="num mt-2 text-sm font-semibold">{moeda(Number(m.valor_total))}</p>
          </Link>
        ))}
      </div>

      {/* Tabela no desktop */}
      <div className="hidden overflow-x-auto rounded-md border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Técnico</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((m) => (
              <TableRow key={m.id} className="cursor-pointer">
                <TableCell className="whitespace-nowrap">
                  <Link to="/manutencoes/$id" params={{ id: m.id }}>
                    {dataHora(m.data_hora)}
                  </Link>
                </TableCell>
                <TableCell>{m.contratos?.codigo}</TableCell>
                <TableCell>{m.locais?.nome}</TableCell>
                <TableCell>{nomeTecnico(m.tecnico_id)}</TableCell>
                <TableCell>{m.manutencao_itens.length}</TableCell>
                <TableCell>
                  <Badge variant={m.status === "concluida" ? "default" : "secondary"}>
                    {rotuloStatusManutencao[m.status]}
                  </Badge>
                </TableCell>
                <TableCell className="num text-right">{moeda(Number(m.valor_total))}</TableCell>
              </TableRow>
            ))}
            {lista.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Nenhuma manutenção encontrada com os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
