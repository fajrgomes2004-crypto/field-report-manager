# Sistema de Gestão de Manutenções e Relatórios Técnicos

Aplicação web responsiva (mobile-first para o técnico em campo, desktop para o administrador), toda em português, com visual sóbrio de engenharia (grafite, azul-aço, âmbar para alertas).

## Backend

Vou ativar o Lovable Cloud (banco de dados, login e armazenamento de fotos já incluídos).

Estrutura de dados:
- **perfis** e **papéis** (administrador / técnico) em tabelas separadas, com verificação de papel no servidor
- **empresa** — razão social, CNPJ, logo, endereço, contatos, responsável técnico e CREA
- **contratos** — código, cliente, CNPJ, início/fim, status, responsável, contato
- **locais** — vinculados obrigatoriamente a um contrato
- **itens_servico** — código, nome, categoria, unidade, valor unitário, status
- **manutencoes** — contrato, local, data/hora, técnico, descrição, observações, status (Rascunho/Concluída/Cancelada)
- **manutencao_itens** — item, quantidade, **valor unitário congelado no momento do registro** (histórico financeiro nunca muda) e total
- **manutencao_fotos** — arquivo no armazenamento + legenda e ordem

Regras de acesso: técnico enxerga e edita apenas as próprias manutenções; administrador enxerga tudo e é o único que cadastra contratos, locais, itens e configurações.

## Telas

1. **Login** — e-mail/senha e entrada com Google. Primeiro usuário cadastrado vira administrador.
2. **Painel** — contratos ativos, total de locais, manutenções no período, valor acumulado e lista das manutenções recentes.
3. **Nova manutenção (mobile)** — passo a passo: contrato → local (já filtrado) → data/hora → itens com quantidade e total calculado na hora → descrição e observações → fotos pela câmera ou galeria, cada uma com legenda. Salva como rascunho a qualquer momento.
4. **Histórico** — tabela com busca e filtros por contrato, local, técnico, período, item e status; abertura do detalhe com fotos.
5. **Cadastros (admin)** — contratos, locais, itens/serviços, com criar, editar e inativar.
6. **Relatórios** — escolhe contrato, período e local (ou todos), pré-visualiza e gera o PDF.
7. **Configurações da empresa (admin)** — dados da prestadora e logo usados automaticamente nos relatórios.

## Relatório em PDF

Gerado no servidor e baixado pronto, com:
- capa com logo, dados da empresa, cliente, contrato e período
- resumo executivo com indicadores do período
- detalhamento de cada manutenção (data, local, técnico, serviços, quantidades, descrições)
- registro fotográfico em grade, numerado e com legendas, sem cortes entre páginas
- relatório financeiro detalhado e consolidação por item executado
- cabeçalho e rodapé padronizados com paginação

## Detalhes técnicos

- Rotas TanStack: `/auth` público; área logada sob `_authenticated` com `/painel`, `/manutencoes/nova`, `/manutencoes`, `/contratos`, `/locais`, `/servicos`, `/relatorios`, `/empresa`.
- Leituras e escritas via `createServerFn` com `requireSupabaseAuth`; RLS por dono e por papel via função `has_role`.
- Fotos em bucket privado, servidas por URL assinada; compressão no cliente antes do envio.
- PDF montado com `pdf-lib` dentro de uma server function, retornando o arquivo para download.
- Tokens de cor e tipografia definidos em `src/styles.css`; nenhuma cor fixa nos componentes.

## Entrega em etapas

1. Cloud + banco + login + papéis
2. Cadastros (empresa, contratos, locais, itens)
3. Registro de manutenções com fotos
4. Painel e histórico com filtros
5. Gerador de PDF
