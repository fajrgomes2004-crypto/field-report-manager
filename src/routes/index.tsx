import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, FileText, HardHat, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão de Manutenções e Relatórios Técnicos em PDF" },
      {
        name: "description",
        content:
          "Registre manutenções em campo pelo celular, controle contratos e locais e gere relatórios técnicos em PDF com registro fotográfico e consolidação financeira.",
      },
      { property: "og:title", content: "Gestão de Manutenções e Relatórios Técnicos" },
      {
        property: "og:description",
        content:
          "Registro de manutenções em campo, controle de contratos e geração automática de relatórios técnicos em PDF.",
      },
    ],
  }),
  component: Landing,
});

const recursos = [
  {
    icon: ClipboardCheck,
    titulo: "Registro em campo",
    texto: "Fluxo rápido no celular: contrato, local, itens executados e fotos com legenda.",
  },
  {
    icon: MapPin,
    titulo: "Contratos e locais",
    texto: "Unidades sempre vinculadas ao contrato correto, com status e responsáveis.",
  },
  {
    icon: FileText,
    titulo: "Relatório técnico em PDF",
    texto: "Capa, resumo executivo, detalhamento, fotos numeradas e consolidação financeira.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <HardHat className="size-5 text-sidebar-primary" />
          <span className="font-display font-semibold">Gestão de Manutenções</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        <section className="py-14 md:py-20">
          <p className="font-mono text-xs tracking-widest text-sidebar-primary uppercase">
            Manutenção predial e industrial
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl leading-tight font-semibold md:text-5xl">
            Do registro no campo ao relatório técnico assinado.
          </h1>
          <p className="mt-4 max-w-xl text-sidebar-foreground/70">
            Centralize contratos, locais e serviços, registre as manutenções direto do celular e
            gere relatórios em PDF com registro fotográfico e memória de cálculo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Acessar o sistema</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {recursos.map((r) => (
            <div key={r.titulo} className="rounded-lg bg-sidebar-accent p-5">
              <r.icon className="size-5 text-sidebar-primary" />
              <h2 className="mt-3 font-display text-base font-semibold">{r.titulo}</h2>
              <p className="mt-1 text-sm text-sidebar-foreground/70">{r.texto}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
