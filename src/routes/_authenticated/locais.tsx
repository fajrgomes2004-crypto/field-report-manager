import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { contratosQuery, locaisQuery, sessaoQuery, type Local } from "@/lib/dados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/_authenticated/locais")({
  head: () => ({
    meta: [
      { title: "Locais — Gestão de Manutenções" },
      { name: "description", content: "Unidades e locais atendidos por contrato." },
      { property: "og:title", content: "Locais — Gestão de Manutenções" },
      { property: "og:description", content: "Unidades e locais atendidos por contrato." },
    ],
  }),
  component: Locais,
});

type Rascunho = {
  id?: string;
  contrato_id: string;
  nome: string;
  codigo: string;
  endereco: string;
  cidade: string;
  uf: string;
  responsavel: string;
  ativo: boolean;
};

const VAZIO: Rascunho = {
  contrato_id: "",
  nome: "",
  codigo: "",
  endereco: "",
  cidade: "",
  uf: "",
  responsavel: "",
  ativo: true,
};

const TODOS = "todos";

function Locais() {
  const { data: sessao } = useQuery(sessaoQuery);
  const contratos = useQuery(contratosQuery);
  const locais = useQuery(locaisQuery);
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState(TODOS);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<Rascunho>(VAZIO);

  const salvar = useMutation({
    mutationFn: async (dados: Rascunho) => {
      const payload = {
        contrato_id: dados.contrato_id,
        nome: dados.nome.trim(),
        codigo: dados.codigo || null,
        endereco: dados.endereco || null,
        cidade: dados.cidade || null,
        uf: dados.uf || null,
        responsavel: dados.responsavel || null,
        ativo: dados.ativo,
      };
      const res = dados.id
        ? await supabase.from("locais").update(payload).eq("id", dados.id)
        : await supabase.from("locais").insert(payload);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locais"] });
      setAberto(false);
      toast.success("Local salvo.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function editar(l: Local) {
    setForm({
      id: l.id,
      contrato_id: l.contrato_id,
      nome: l.nome,
      codigo: l.codigo ?? "",
      endereco: l.endereco ?? "",
      cidade: l.cidade ?? "",
      uf: l.uf ?? "",
      responsavel: l.responsavel ?? "",
      ativo: l.ativo,
    });
    setAberto(true);
  }

  const listaContratos = contratos.data ?? [];
  const lista = (locais.data ?? []).filter(
    (l) => filtro === TODOS || l.contrato_id === filtro,
  );
  const contratoNome = (id: string) => {
    const c = listaContratos.find((x) => x.id === id);
    return c ? `${c.codigo} — ${c.cliente}` : "—";
  };

  return (
    <div>
      <PageHeader
        titulo="Locais"
        descricao="Unidades vinculadas a cada contrato"
        acao={
          sessao?.admin ? (
            <Button
              onClick={() => {
                setForm({ ...VAZIO, contrato_id: filtro === TODOS ? "" : filtro });
                setAberto(true);
              }}
            >
              <Plus className="size-4" /> Novo local
            </Button>
          ) : null
        }
      />

      <div className="mb-4 max-w-sm space-y-1.5">
        <Label>Filtrar por contrato</Label>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os contratos</SelectItem>
            {listaContratos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.codigo} — {c.cliente}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum local cadastrado para este filtro.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((l) => (
            <Card key={l.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{l.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {contratoNome(l.contrato_id)}
                    </p>
                  </div>
                  <Badge variant={l.ativo ? "default" : "secondary"}>
                    {l.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {[l.endereco, l.cidade, l.uf].filter(Boolean).join(" · ") || "Sem endereço"}
                </p>
                {sessao?.admin ? (
                  <Button variant="outline" size="sm" onClick={() => editar(l)}>
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
            <DialogTitle>{form.id ? "Editar local" : "Novo local"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Contrato</Label>
              <Select
                value={form.contrato_id}
                onValueChange={(v) => setForm({ ...form, contrato_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {listaContratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.codigo} — {c.cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do local</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cod">Código</Label>
              <Input
                id="cod"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="end">Endereço</Label>
              <Input
                id="end"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cid">Cidade</Label>
              <Input
                id="cid"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                maxLength={2}
                value={form.uf}
                onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="respl">Responsável no local</Label>
              <Input
                id="respl"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
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
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!form.contrato_id || !form.nome.trim()) {
                  toast.error("Informe o contrato e o nome do local.");
                  return;
                }
                salvar.mutate(form);
              }}
              disabled={salvar.isPending}
            >
              Salvar local
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
