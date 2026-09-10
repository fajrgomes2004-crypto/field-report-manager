import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { empresaQuery, sessaoQuery, urlAssinada, comprimirImagem } from "@/lib/dados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/empresa")({
  head: () => ({
    meta: [
      { title: "Dados da empresa — Gestão de Manutenções" },
      { name: "description", content: "Dados da prestadora usados nos relatórios técnicos." },
      { property: "og:title", content: "Dados da empresa — Gestão de Manutenções" },
      { property: "og:description", content: "Dados da prestadora usados nos relatórios técnicos." },
    ],
  }),
  component: EmpresaConfig,
});

const CAMPOS = [
  ["razao_social", "Razão social"],
  ["nome_fantasia", "Nome fantasia"],
  ["cnpj", "CNPJ"],
  ["endereco", "Endereço"],
  ["cidade", "Cidade"],
  ["uf", "UF"],
  ["cep", "CEP"],
  ["telefone", "Telefone"],
  ["email", "E-mail"],
  ["site", "Site"],
  ["responsavel_tecnico", "Responsável técnico"],
  ["conselho", "Conselho (ex.: CREA)"],
  ["registro_conselho", "Registro no conselho"],
] as const;

type Campo = (typeof CAMPOS)[number][0];

function EmpresaConfig() {
  const { data: sessao } = useQuery(sessaoQuery);
  const { data: empresa } = useQuery(empresaQuery);
  const queryClient = useQueryClient();
  const inputLogo = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    const inicial: Record<string, string> = {};
    for (const [campo] of CAMPOS) inicial[campo] = (empresa[campo as Campo] as string) ?? "";
    setForm(inicial);
    if (empresa.logo_path) {
      urlAssinada("empresa-arquivos", empresa.logo_path)
        .then(setLogoUrl)
        .catch(() => setLogoUrl(null));
    }
  }, [empresa]);

  const salvar = useMutation({
    mutationFn: async (extra?: { logo_path: string }) => {
      const payload: Record<string, unknown> = { ...form, ...(extra ?? {}) };
      if (!empresa) {
        const res = await supabase.from("empresa").insert(payload as { razao_social: string });
        if (res.error) throw new Error(res.error.message);
        return;
      }
      const res = await supabase.from("empresa").update(payload).eq("id", empresa.id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa"] });
      toast.success("Dados da empresa salvos.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function enviarLogo(arquivo: File | undefined) {
    if (!arquivo || !empresa) return;
    setEnviando(true);
    try {
      const blob = await comprimirImagem(arquivo, 600, 0.9);
      const caminho = `logo/${empresa.id}-${Date.now()}.jpg`;
      const up = await supabase.storage
        .from("empresa-arquivos")
        .upload(caminho, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw new Error(up.error.message);
      await salvar.mutateAsync({ logo_path: caminho });
      setLogoUrl(await urlAssinada("empresa-arquivos", caminho));
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao enviar o logo.");
    } finally {
      setEnviando(false);
      if (inputLogo.current) inputLogo.current.value = "";
    }
  }

  if (!sessao?.admin) {
    return (
      <p className="text-sm text-muted-foreground">
        Apenas administradores podem alterar os dados da empresa.
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Dados da empresa"
        descricao="Usados automaticamente no cabeçalho dos relatórios técnicos"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {CAMPOS.map(([campo, rotulo]) => (
              <div key={campo} className="space-y-1.5">
                <Label htmlFor={campo}>{rotulo}</Label>
                <Input
                  id={campo}
                  value={form[campo] ?? ""}
                  onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button onClick={() => salvar.mutate(undefined)} disabled={salvar.isPending}>
                {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Salvar dados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo da empresa"
                className="h-28 w-full rounded-md border object-contain p-2"
              />
            ) : (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                Nenhum logo enviado
              </div>
            )}
            <input
              ref={inputLogo}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => enviarLogo(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={enviando}
              onClick={() => inputLogo.current?.click()}
            >
              {enviando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImageUp className="size-4" />
              )}
              Enviar logo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
