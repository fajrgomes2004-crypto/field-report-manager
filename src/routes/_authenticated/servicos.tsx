import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { itensQuery, sessaoQuery, type ItemServico } from "@/lib/dados";
import { moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/servicos")({
  head: () => ({
    meta: [
      { title: "Itens e serviços — Gestão de Manutenções" },
      { name: "description", content: "Catálogo de serviços de manutenção e valores unitários." },
      { property: "og:title", content: "Itens e serviços — Gestão de Manutenções" },
      {
        property: "og:description",
        content: "Catálogo de serviços de manutenção e valores unitários.",
      },
    ],
  }),
  component: Servicos,
});

type Rascunho = {
  id?: string;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  valor_unitario: string;
  descricao: string;
  ativo: boolean;
};

const VAZIO: Rascunho = {
  codigo: "",
  nome: "",
  categoria: "",
  unidade: "un",
  valor_unitario: "0",
  descricao: "",
  ativo: true,
};

function Servicos() {
  const { data: sessao } = useQuery(sessaoQuery);
  const itens = useQuery(itensQuery);
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Rascunho>(VAZIO);

  const salvar = useMutation({
    mutationFn: async (dados: Rascunho) => {
      const payload = {
        codigo: dados.codigo.trim(),
        nome: dados.nome.trim(),
        categoria: dados.categoria || null,
        unidade: dados.unidade || "un",
        valor_unitario: Number(String(dados.valor_unitario).replace(",", ".")) || 0,
        descricao: dados.descricao || null,
        ativo: dados.ativo,
      };
      const res = dados.id
        ? await supabase.from("itens_servico").update(payload).eq("id", dados.id)
        : await supabase.from("itens_servico").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itens"] });
      setAberto(false);
      toast.success("Item salvo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function editar(i: ItemServico) {
    setForm({
      id: i.id,
      codigo: i.codigo,
      nome: i.nome,
      categoria: i.categoria ?? "",
      unidade: i.unidade,
      valor_unitario: String(i.valor_unitario),
      descricao: i.descricao ?? "",
      ativo: i.ativo,
    });
    setAberto(true);
  }

  const termo = busca.trim().toLowerCase();
  const lista = (itens.data ?? []).filter((i) =>
    !termo
      ? true
      : `${i.codigo} ${i.nome} ${i.categoria ?? ""}`.toLowerCase().includes(termo),
  );

  return (
    <div>
      <PageHeader
        titulo="Itens e serviços"
        descricao="Catálogo com valores unitários usados nas manutenções"
        acao={
          sessao?.admin ? (
            <Button
              onClick={() => {
                setForm(VAZIO);
                setAberto(true);
              }}
            >
              <Plus className="size-4" /> Novo item
            </Button>
          ) : null
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por código, nome ou categoria"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item encontrado.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((i) => (
            <Card key={i.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="num text-xs text-muted-foreground">{i.codigo}</p>
                    <p className="truncate font-medium">{i.nome}</p>
                  </div>
                  <Badge variant={i.ativo ? "default" : "secondary"}>
                    {i.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="num text-sm font-semibold">
                  {moeda(Number(i.valor_unitario))}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ {i.unidade}</span>
                </p>
                {i.categoria ? (
                  <p className="text-xs text-muted-foreground">Categoria: {i.categoria}</p>
                ) : null}
                {sessao?.admin ? (
                  <Button variant="outline" size="sm" onClick={() => editar(i)}>
                    <Pencil className="size-4" /> Editar
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar item" : "Novo item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cods">Código</Label>
              <Input
                id="cods"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="noms">Nome</Label>
              <Input
                id="noms"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat">Categoria</Label>
              <Input
                id="cat"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni">Unidade</Label>
              <Input
                id="uni"
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                placeholder="un, m², h, ponto..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="val">Valor unitário (R$)</Label>
              <Input
                id="val"
                type="number"
                step="0.01"
                min="0"
                className="num"
                value={form.valor_unitario}
                onChange={(e) => setForm({ ...form, valor_unitario: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select
                value={form.ativo ? "1" : "0"}
                onValueChange={(v) => setForm({ ...form, ativo: v === "1" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ativo</SelectItem>
                  <SelectItem value="0">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="descs">Descrição</Label>
              <Textarea
                id="descs"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.codigo.trim() || !form.nome.trim()) {
                  toast.error("Informe código e nome do item.");
                  return;
                }
                salvar.mutate(form);
              }}
              disabled={salvar.isPending}
            >
              Salvar item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
