# Field Maintenance Hub

Construa um sistema web completo e responsivo (com foco mobile-first para técnicos em campo) para Gestão de Manutenções e Automação de Relatórios Técnicos em PDF.

Principais módulos e requisitos:
1. Autenticação & Perfis:
   - Administrador (gestão completa, cadastros, configurações, relatórios)
   - Técnico (interface simplificada e ágil para registro de manutenções em campo)

2. Gestão de Contratos e Locais:
   - Contratos (código, cliente, CNPJ, datas de início/fim, status Ativo/Inativo/Encerrado, responsável, contato)
   - Locais/unidades secundárias vinculados obrigatoriamente a um contrato específico

3. Biblioteca de Itens/Serviços de Manutenção:
   - Cadastro de serviços (código, nome, categoria, unidade de medida, valor unitário padrão, status)
   - Preservação do valor: no registro da manutenção, armazena um snapshot do preço vigente para nunca alterar históricos financeiros retroativamente

4. Registro Diário de Manutenções (Foco Mobile/Campo):
   - Fluxo rápido: Contrato -> Local (filtrado pelo contrato) -> Data/hora -> Seleção de itens de manutenção com quantidade e cálculo automático de totais -> Descrição detalhada dos serviços e Observações
   - Upload de múltiplas fotos com legenda/descrição individual (suporte a câmera e galeria)
   - Status da manutenção (Rascunho, Concluída, Cancelada)

5. Dashboard & Histórico:
   - Métricas: contratos ativos, locais, manutenções no período, valor total faturado/acumulado, manutenções recentes
   - Tabela de histórico completa com pesquisa e filtros avançados (contrato, local, técnico, período, item, status)

6. Gerador de Relatório Técnico em PDF:
   - Filtro por Contrato, Período (datas início/fim) e Local (ou Todos os Locais)
   - Geração de PDF profissional contendo:
     * Capa com dados da empresa, cliente, contrato e período
     * Resumo executivo com indicadores do período
     * Detalhamento de cada manutenção realizada (data, local, técnico, serviços, quantidades, descrições)
     * Registro fotográfico organizado em grid com legendas e numeração sem cortes
     * Relatório financeiro detalhado e tabela de consolidação por item executado no período
     * Cabeçalho e rodapé padronizados com dados da empresa e paginação

7. Configurações da Empresa:
   - Dados da prestadora (Razão Social, CNPJ, logo, endereço, contatos, Responsável Técnico e registro de conselho como CREA) para uso automático no cabeçalho e relatórios

Interface moderna, profissional e intuitiva em português (PT-BR), com paleta sóbria adequada para engenharia e manutenção predial/industrial.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://field-report-manager.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d21f6050-33a4-41c8-ad47-890f1ad976e1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
