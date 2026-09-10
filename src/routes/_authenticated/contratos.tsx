import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { contratosQuery, sessaoQuery, type Contrato } from "@/lib/dados";
import { dataCurta, rotuloStatusContrato } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — Gestão de Manutenções" },
      { name: "description", content: "Cadastro e manutenção da carteira de contratos." },
      { property: "og:title", content: "Contratos — Gestão de Manutenções" },
      { property: "og:description", content: "Cadastro e manutenção da carteira de contratos." },
    ],
  }),
  component: Contratos,
});

type Rascunho = {
  id?: string;
  codigo: string;
  cliente: string;
  cnpj: string;
  data_inicio: string;
  data_fim: string;
  status: Contrato["status"];
  responsavel: string;
  contato: string;
  observacoes: string;
};

const VAZIO: Rascunho = {
  codigo: "",
  cliente: "",
  cnpj: "",
  data_inicio: "",
  data_fim: "",
  status: "ativo",
  responsavel: "",
  contato: "",
  observacoes: "",
};

function Contratos() {
  const { data: sessao } = useQuery(sessaoQuery);
  const contratos = useQuery(contratosQuery);
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Rascunho>(VAZIO);

  const salvar = useMutation({
    mutationFn: async (dados: Rascunho) => {
      const payload = {
        codigo: dados.codigo.trim(),
        cliente: dados.cliente.trim(),
        cnpj: dados.cnpj || null,
        data_inicio: dados.data_inicio || null,
        data_fim: dados.data_fim || null,
        status: dados.status,
        responsavel: dados.responsavel || null,
        contato: dados.contato || null,
        observacoes: dados.observacoes || null,
      };
      const res = dados.id
        ? await supabase.from("contratos").update(payload).eq("id", dados.id)
        : await supabase.from("contratos").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      setAberto(false);
      toast.success("Contrato salvo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function editar(c: Contrato) {
    setForm({
      id: c.id,
      codigo: c.codigo,
      cliente: c.cliente,
      cnpj: c.cnpj ?? "",
      data_inicio: c.data_inicio ?? "",
      data_fim: c.data_fim ?? "",
      status: c.status,
      responsavel: c.responsavel ?? "",
      contato: c.contato ?? "",
      observacoes: c.observacoes ?? "",
    });
    setAberto(true);
  }

  const lista = contratos.data ?? [];

  return (
    <div>
      <PageHeader
        titulo="Contratos"
        descricao="Carteira de contratos e clientes atendidos"
        acao={
          sessao?.admin ? (
            <Button
              onClick={() => {
                setForm(VAZIO);
                setAberto(true);
              }}
            >
              <Plus className="size-4" /> Novo contrato
            </Button>
          ) : null
        }
      />

      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado ainda.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="num text-xs text-muted-foreground">{c.codigo}</p>
                    <p className="truncate font-medium">{c.cliente}</p>
                  </div>
                  <Badge variant={c.status === "ativo" ? "default" : "secondary"}>
                    {rotuloStatusContrato[c.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.cnpj ? `CNPJ ${c.cnpj} · ` : ""}
                  {dataCurta(c.data_inicio)} a {dataCurta(c.data_fim)}
                </p>
                {c.responsavel ? (
                  <p className="text-xs text-muted-foreground">
                    Responsável: {c.responsavel}
                    {c.contato ? ` · ${c.contato}` : ""}
                  </p>
                ) : null}
                {sessao?.admin ? (
                  <Button variant="outline" size="sm" onClick={() => editar(c)}>
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
            <DialogTitle>{form.id ? "Editar contrato" : "Novo contrato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as Contrato["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ini">Início</Label>
              <Input
                id="ini"
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fim">Término</Label>
              <Input
                id="fim"
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resp">Responsável</Label>
              <Input
                id="resp"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cont">Contato</Label>
              <Input
                id="cont"
                value={form.contato}
                onChange={(e) => setForm({ ...form, contato: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.codigo.trim() || !form.cliente.trim()) {
                  toast.error("Informe código e cliente.");
                  return;
                }
                salvar.mutate(form);
              }}
              disabled={salvar.isPending}
            >
              Salvar contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
