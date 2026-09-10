import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { ManutencaoForm } from "@/components/manutencao-form";

export const Route = createFileRoute("/_authenticated/manutencoes/nova")({
  head: () => ({
    meta: [
      { title: "Nova manutenção" },
      { name: "description", content: "Registre uma manutenção realizada em campo." },
      { property: "og:title", content: "Nova manutenção" },
      { property: "og:description", content: "Registre uma manutenção realizada em campo." },
    ],
  }),
  component: NovaManutencao,
});

function NovaManutencao() {
  return (
    <div>
      <PageHeader titulo="Nova manutenção" descricao="Registro rápido do atendimento em campo" />
      <ManutencaoForm />
    </div>
  );
}
