import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app-shell";
import { ManutencaoForm } from "@/components/manutencao-form";
import { manutencaoQuery } from "@/lib/dados";
import { dataHora } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/manutencoes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da manutenção" },
      { name: "description", content: "Consulte e edite o registro da manutenção." },
      { property: "og:title", content: "Detalhe da manutenção" },
      { property: "og:description", content: "Consulte e edite o registro da manutenção." },
    ],
  }),
  component: DetalheManutencao,
});

function DetalheManutencao() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery(manutencaoQuery(id));

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando registro...</p>;
  if (error || !data)
    return <p className="text-sm text-destructive">Não foi possível carregar esta manutenção.</p>;

  return (
    <div>
      <PageHeader
        titulo={`${data.contratos?.codigo ?? ""} · ${data.locais?.nome ?? ""}`}
        descricao={`Registrada em ${dataHora(data.data_hora)}`}
      />
      <ManutencaoForm inicial={data} />
    </div>
  );
}
