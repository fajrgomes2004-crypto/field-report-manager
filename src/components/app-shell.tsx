import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  FileText,
  FolderKanban,
  MapPin,
  Wrench,
  Building2,
  LogOut,
  HardHat,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { empresaQuery, sessaoQuery } from "@/lib/dados";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navPrincipal = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/manutencoes", label: "Manutenções", icon: ClipboardList },
  { to: "/manutencoes/nova", label: "Nova", icon: PlusCircle },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
] as const;

const navAdmin = [
  { to: "/contratos", label: "Contratos", icon: FolderKanban },
  { to: "/locais", label: "Locais", icon: MapPin },
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/empresa", label: "Empresa", icon: Building2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: sessao } = useQuery(sessaoQuery);
  const { data: empresa } = useQuery(empresaQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = [...navPrincipal, ...(sessao?.admin ? navAdmin : [])];

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <HardHat className="size-5 text-sidebar-primary" />
          <span className="font-display text-sm leading-tight font-semibold">
            {empresa?.nome_fantasia || empresa?.razao_social || "Gestão de Manutenções"}
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {links.map((l) => {
            const ativo = pathname === l.to || (l.to !== "/painel" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  ativo
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="px-2 text-xs text-sidebar-foreground/70">
            {sessao?.perfil?.nome || sessao?.email}
          </p>
          <p className="px-2 text-[11px] text-sidebar-foreground/50">
            {sessao?.admin ? "Administrador" : "Técnico"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={sair}
            className="mt-2 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <HardHat className="size-5 text-primary" />
            <span className="font-display text-sm font-semibold">
              {empresa?.nome_fantasia || empresa?.razao_social || "Manutenções"}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair">
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-4 pb-24 md:px-8 md:py-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card md:hidden">
          {navPrincipal.map((l) => {
            const ativo = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px]",
                  ativo ? "text-primary" : "text-muted-foreground",
                )}
              >
                <l.icon className="size-5" />
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        {descricao ? <p className="mt-1 text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}
