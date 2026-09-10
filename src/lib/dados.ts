import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Contrato = Database["public"]["Tables"]["contratos"]["Row"];
export type Local = Database["public"]["Tables"]["locais"]["Row"];
export type ItemServico = Database["public"]["Tables"]["itens_servico"]["Row"];
export type Manutencao = Database["public"]["Tables"]["manutencoes"]["Row"];
export type ManutencaoItem = Database["public"]["Tables"]["manutencao_itens"]["Row"];
export type ManutencaoFoto = Database["public"]["Tables"]["manutencao_fotos"]["Row"];
export type Empresa = Database["public"]["Tables"]["empresa"]["Row"];
export type Perfil = Database["public"]["Tables"]["profiles"]["Row"];

function ok<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const sessaoQuery = queryOptions({
  queryKey: ["sessao"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const [perfil, papeis] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    const roles = (papeis.data ?? []).map((r) => r.role);
    return {
      id: user.id,
      email: user.email ?? "",
      perfil: perfil.data ?? null,
      admin: roles.includes("administrador"),
      roles,
    };
  },
});

export const empresaQuery = queryOptions({
  queryKey: ["empresa"],
  queryFn: async () =>
    ok(await supabase.from("empresa").select("*").order("updated_at").limit(1).maybeSingle()),
});

export const contratosQuery = queryOptions({
  queryKey: ["contratos"],
  queryFn: async () =>
    ok(await supabase.from("contratos").select("*").order("codigo")) as Contrato[],
});

export const locaisQuery = queryOptions({
  queryKey: ["locais"],
  queryFn: async () => ok(await supabase.from("locais").select("*").order("nome")) as Local[],
});

export const itensQuery = queryOptions({
  queryKey: ["itens"],
  queryFn: async () =>
    ok(await supabase.from("itens_servico").select("*").order("codigo")) as ItemServico[],
});

export const tecnicosQuery = queryOptions({
  queryKey: ["tecnicos"],
  queryFn: async () => ok(await supabase.from("profiles").select("*").order("nome")) as Perfil[],
});

export type ManutencaoCompleta = Manutencao & {
  contratos: Pick<Contrato, "id" | "codigo" | "cliente"> | null;
  locais: Pick<Local, "id" | "nome"> | null;
  manutencao_itens: ManutencaoItem[];
  manutencao_fotos: ManutencaoFoto[];
};

const SELECT_COMPLETO =
  "*, contratos(id, codigo, cliente), locais(id, nome), manutencao_itens(*), manutencao_fotos(*)";

export interface FiltroManutencoes {
  contratoId?: string;
  localId?: string;
  tecnicoId?: string;
  itemId?: string;
  status?: string;
  de?: string;
  ate?: string;
}

export function manutencoesQuery(filtro: FiltroManutencoes = {}) {
  return queryOptions({
    queryKey: ["manutencoes", filtro],
    queryFn: async () => {
      let q = supabase.from("manutencoes").select(SELECT_COMPLETO).order("data_hora", {
        ascending: false,
      });
      if (filtro.contratoId) q = q.eq("contrato_id", filtro.contratoId);
      if (filtro.localId) q = q.eq("local_id", filtro.localId);
      if (filtro.tecnicoId) q = q.eq("tecnico_id", filtro.tecnicoId);
      if (filtro.status) q = q.eq("status", filtro.status as Manutencao["status"]);
      if (filtro.de) q = q.gte("data_hora", `${filtro.de}T00:00:00`);
      if (filtro.ate) q = q.lte("data_hora", `${filtro.ate}T23:59:59`);
      const lista = ok(await q) as unknown as ManutencaoCompleta[];
      if (!filtro.itemId) return lista;
      return lista.filter((m) => m.manutencao_itens.some((i) => i.item_id === filtro.itemId));
    },
  });
}

export function manutencaoQuery(id: string) {
  return queryOptions({
    queryKey: ["manutencao", id],
    queryFn: async () =>
      ok(
        await supabase.from("manutencoes").select(SELECT_COMPLETO).eq("id", id).single(),
      ) as unknown as ManutencaoCompleta,
  });
}

export async function urlAssinada(bucket: string, path: string, segundos = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, segundos);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Comprime a foto no navegador antes de enviar (reduz uso de dados em campo). */
export async function comprimirImagem(file: File, maxLado = 1600, qualidade = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", qualidade),
  );
  return blob ?? file;
}

export async function enviarFoto(userId: string, manutencaoId: string, file: File) {
  const blob = await comprimirImagem(file);
  const nome = `${userId}/${manutencaoId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from("manutencao-fotos")
    .upload(nome, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return nome;
}
