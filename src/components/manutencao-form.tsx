import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Minus, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  contratosQuery,
  itensQuery,
  locaisQuery,
  sessaoQuery,
  enviarFoto,
  urlAssinada,
  type ManutencaoCompleta,
} from "@/lib/dados";
import { moeda, paraInputDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LinhaItem {
  itemId: string;
  codigo: string;
  nome: string;
  unidade: string;
  categoria: string | null;
  valorUnitario: number;
  quantidade: number;
}

export function ManutencaoForm({ inicial }: { inicial?: ManutencaoCompleta }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessao = useQuery(sessaoQuery);
  const contratos = useQuery(contratosQuery);
  const locais = useQuery(locaisQuery);
  const itens = useQuery(itensQuery);
  const inputFoto = useRef<HTMLInputElement>(null);

  const [id, setId] = useState<string | null>(inicial?.id ?? null);
  const [contratoId, setContratoId] = useState(inicial?.contrato_id ?? "");
  const [localId, setLocalId] = useState(inicial?.local_id ?? "");
  const [dataHoraLocal, setDataHoraLocal] = useState(
    paraInputDateTime(inicial ? new Date(inicial.data_hora) : new Date()),
  );
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [observacoes, setObservacoes] = useState(inicial?.observacoes ?? "");
  const [linhas, setLinhas] = useState<LinhaItem[]>(
    (inicial?.manutencao_itens ?? []).map((i) => ({
      itemId: i.item_id ?? "",
      codigo: i.codigo_snapshot,
      nome: i.nome_snapshot,
      unidade: i.unidade_snapshot,
      categoria: i.categoria_snapshot,
      valorUnitario: Number(i.valor_unitario_snapshot),
      quantidade: Number(i.quantidade),
    })),
  );
  const [fotos, setFotos] = useState(
    [...(inicial?.manutencao_fotos ?? [])].sort((a, b) => a.ordem - b.ordem),
  );
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const contratosDisponiveis = contratos.data ?? [];
  const locaisDoContrato = (locais.data ?? []).filter(
    (l) => l.contrato_id === contratoId && l.ativo,
  );
  const itensAtivos = (itens.data ?? []).filter((i) => i.ativo);

  const total = useMemo(
    () => linhas.reduce((s, l) => s + l.valorUnitario * l.quantidade, 0),
    [linhas],
  );

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const entradas: Record<string, string> = {};
      for (const f of fotos) {
        if (previews[f.id]) continue;
        try {
          entradas[f.id] = await urlAssinada("manutencao-fotos", f.storage_path);
        } catch {
          /* ignora */
        }
      }
      if (!cancelado && Object.keys(entradas).length) {
        setPreviews((p) => ({ ...p, ...entradas }));
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fotos]);

  function adicionarItem(itemId: string) {
    const item = itensAtivos.find((i) => i.id === itemId);
    if (!item) return;
    if (linhas.some((l) => l.itemId === itemId)) {
      setLinhas((ls) =>
        ls.map((l) => (l.itemId === itemId ? { ...l, quantidade: l.quantidade + 1 } : l)),
      );
      return;
    }
    setLinhas((ls) => [
      ...ls,
      {
        itemId: item.id,
        codigo: item.codigo,
        nome: item.nome,
        unidade: item.unidade,
        categoria: item.categoria,
        valorUnitario: Number(item.valor_unitario),
        quantidade: 1,
      },
    ]);
  }

  async function persistir(status: "rascunho" | "concluida" | "cancelada"): Promise<string | null> {
    if (!contratoId || !localId) {
      toast.error("Selecione o contrato e o local.");
      return null;
    }
    if (!sessao.data) return null;

    const payload = {
      contrato_id: contratoId,
      local_id: localId,
      tecnico_id: inicial?.tecnico_id ?? sessao.data.id,
      data_hora: new Date(dataHoraLocal).toISOString(),
      descricao,
      observacoes,
      status,
      valor_total: total,
    };

    let manutencaoId = id;
    if (manutencaoId) {
      const { error } = await supabase.from("manutencoes").update(payload).eq("id", manutencaoId);
      if (error) throw new Error(error.message);
    } else {
      const { data, error } = await supabase
        .from("manutencoes")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      manutencaoId = data.id;
      setId(data.id);
    }

    await supabase.from("manutencao_itens").delete().eq("manutencao_id", manutencaoId);
    if (linhas.length) {
      const { error } = await supabase.from("manutencao_itens").insert(
        linhas.map((l) => ({
          manutencao_id: manutencaoId,
          item_id: l.itemId || null,
          codigo_snapshot: l.codigo,
          nome_snapshot: l.nome,
          unidade_snapshot: l.unidade,
          categoria_snapshot: l.categoria,
          valor_unitario_snapshot: l.valorUnitario,
          quantidade: l.quantidade,
          valor_total: l.valorUnitario * l.quantidade,
        })),
      );
      if (error) throw new Error(error.message);
    }
    return manutencaoId;
  }

  async function salvar(status: "rascunho" | "concluida" | "cancelada") {
    setSalvando(true);
    try {
      const novoId = await persistir(status);
      if (!novoId) return;
      await queryClient.invalidateQueries();
      toast.success(status === "concluida" ? "Manutenção concluída." : "Registro salvo.");
      if (status !== "rascunho") navigate({ to: "/manutencoes" });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function anexarFotos(arquivos: FileList | null) {
    if (!arquivos?.length || !sessao.data) return;
    setEnviandoFoto(true);
    try {
      let manutencaoId = id;
      if (!manutencaoId) manutencaoId = await persistir("rascunho");
      if (!manutencaoId) return;

      const novas = [];
      for (const arquivo of Array.from(arquivos)) {
        const caminho = await enviarFoto(sessao.data.id, manutencaoId, arquivo);
        const { data, error } = await supabase
          .from("manutencao_fotos")
          .insert({
            manutencao_id: manutencaoId,
            storage_path: caminho,
            ordem: fotos.length + novas.length,
            legenda: "",
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        novas.push(data);
      }
      setFotos((f) => [...f, ...novas]);
      toast.success(`${novas.length} foto(s) anexada(s).`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
      if (inputFoto.current) inputFoto.current.value = "";
    }
  }

  async function salvarLegenda(fotoId: string, legenda: string) {
    setFotos((f) => f.map((x) => (x.id === fotoId ? { ...x, legenda } : x)));
    await supabase.from("manutencao_fotos").update({ legenda }).eq("id", fotoId);
  }

  async function removerFoto(fotoId: string, path: string) {
    setFotos((f) => f.filter((x) => x.id !== fotoId));
    await supabase.from("manutencao_fotos").delete().eq("id", fotoId);
    await supabase.storage.from("manutencao-fotos").remove([path]);
  }

  return (
    <div className="space-y-4 pb-28 md:pb-0">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Onde e quando</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Contrato</Label>
            <Select
              value={contratoId}
              onValueChange={(v) => {
                setContratoId(v);
                setLocalId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o contrato" />
              </SelectTrigger>
              <SelectContent>
                {contratosDisponiveis.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.codigo} — {c.cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Local / unidade</Label>
            <Select value={localId} onValueChange={setLocalId} disabled={!contratoId}>
              <SelectTrigger>
                <SelectValue placeholder={contratoId ? "Selecione o local" : "Escolha o contrato"} />
              </SelectTrigger>
              <SelectContent>
                {locaisDoContrato.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dh">Data e hora</Label>
            <Input
              id="dh"
              type="datetime-local"
              value={dataHoraLocal}
              onChange={(e) => setDataHoraLocal(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Serviços executados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value="" onValueChange={adicionarItem}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar item de manutenção" />
            </SelectTrigger>
            <SelectContent>
              {itensAtivos.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.codigo} — {i.nome} ({moeda(Number(i.valor_unitario))}/{i.unidade})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {linhas.map((l, idx) => (
            <div key={l.itemId || idx} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {l.codigo} · {moeda(l.valorUnitario)} / {l.unidade}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLinhas((ls) => ls.filter((_, i) => i !== idx))}
                  aria-label="Remover item"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setLinhas((ls) =>
                        ls.map((x, i) =>
                          i === idx ? { ...x, quantidade: Math.max(0.5, x.quantidade - 1) } : x,
                        ),
                      )
                    }
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    className="num w-20 text-center"
                    type="number"
                    step="0.5"
                    min="0"
                    value={l.quantidade}
                    onChange={(e) =>
                      setLinhas((ls) =>
                        ls.map((x, i) =>
                          i === idx ? { ...x, quantidade: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setLinhas((ls) =>
                        ls.map((x, i) => (i === idx ? { ...x, quantidade: x.quantidade + 1 } : x)),
                      )
                    }
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <span className="num text-sm font-semibold">
                  {moeda(l.valorUnitario * l.quantidade)}
                </span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="text-sm font-medium">Total da manutenção</span>
            <span className="num font-display text-lg font-semibold">{moeda(total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. Descrição e observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="desc">Descrição detalhada dos serviços</Label>
            <Textarea
              id="desc"
              rows={5}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que foi executado, materiais utilizados e condições encontradas."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Pendências, recomendações e próximos passos."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">4. Registro fotográfico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => anexarFotos(e.target.files)}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => inputFoto.current?.click()}
            disabled={enviandoFoto || !contratoId || !localId}
          >
            {enviandoFoto ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            Adicionar fotos (câmera ou galeria)
          </Button>
          {!contratoId || !localId ? (
            <p className="text-xs text-muted-foreground">
              Selecione contrato e local antes de anexar fotos.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {fotos.map((f, i) => (
              <div key={f.id} className="overflow-hidden rounded-md border">
                {previews[f.id] ? (
                  <img
                    src={previews[f.id]}
                    alt={f.legenda || `Foto ${i + 1} da manutenção`}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-32 w-full animate-pulse bg-muted" />
                )}
                <div className="space-y-2 p-2">
                  <Input
                    placeholder={`Legenda da foto ${i + 1}`}
                    defaultValue={f.legenda ?? ""}
                    onBlur={(e) => salvarLegenda(f.id, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive"
                    onClick={() => removerFoto(f.id, f.storage_path)}
                  >
                    <Trash2 className="size-4" /> Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-14 z-20 flex gap-2 border-t bg-card p-3 md:static md:border-0 md:bg-transparent md:p-0">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => salvar("rascunho")}
          disabled={salvando}
        >
          <Save className="size-4" /> Salvar rascunho
        </Button>
        <Button className="flex-1" onClick={() => salvar("concluida")} disabled={salvando}>
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Concluir manutenção
        </Button>
        {id ? (
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => salvar("cancelada")}
            disabled={salvando}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
