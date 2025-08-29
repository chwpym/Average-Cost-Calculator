# Calculadoras Financeiras para E-commerce e Varejo

Este é um projeto Next.js que oferece um conjunto de calculadoras financeiras projetadas para ajudar proprietários de e-commerce e varejistas a tomar decisões de precificação e análise de custos de forma mais eficiente.

## Visão Geral

A aplicação é um dashboard central que dá acesso a várias ferramentas de cálculo, cada uma em sua própria página dedicada. A interface é construída com Next.js, React, TypeScript e estilizada com Tailwind CSS e componentes da biblioteca ShadCN/UI.

## Funcionalidades Principais

O dashboard principal oferece acesso às seguintes calculadoras:

-   **Preço Médio:** Calcule o preço médio de suas compras de ativos com base em duas aquisições diferentes.
-   **Precificação em Lote:** Defina preços de venda para múltiplos produtos simultaneamente. Calcule o preço de venda a partir do custo e da margem de lucro, ou a margem a partir do custo e do preço de venda.
-   **Calcular Venda:** Uma calculadora simples para encontrar o preço de venda ideal com base no custo do produto e na margem de lucro desejada.
-   **Custo Unitário:** Descubra rapidamente o custo por item a partir do valor total de uma compra e da quantidade de itens.
-   **Calcular Porcentagem:** Realize cálculos de porcentagem simples.
-   **Somar com Porcentagem:** Adicione um valor percentual a um número inicial.
-   **Análise de Custo por NF-e:** Importe um arquivo XML de Nota Fiscal Eletrônica (NF-e) para analisar o custo real de cada produto, rateando valores como IPI, ICMS-ST e Frete.
-   **Análise de Custo Avançada:** Uma versão mais detalhada da análise de NF-e, que calcula o custo líquido considerando créditos de **PIS/COFINS**, ideal para empresas do regime Lucro Real.
-   **Comparador de NF-e:** Importe múltiplos arquivos XML de NF-e para comparar produtos, quantidades e custos entre eles, identificando duplicatas ou buscando itens específicos por código ou descrição.

### Recursos Adicionais

-   **Importação de XML (NF-e):** As calculadoras de "Precificação em Lote", "Análise de Custo" e "Análise de Custo Avançada" permitem importar um XML de NF-e para preencher automaticamente os dados dos produtos, agilizando o processo.
-   **Busca em Múltiplas NF-es:** O "Comparador de NF-e" permite buscar produtos por código ou descrição em todos os arquivos carregados simultaneamente.
-   **Cálculo de Custo Unitário Convertido:** As calculadoras de análise de custo possuem um campo de "Fator de Conversão" para calcular o custo de um item individual quando ele é comprado em caixas ou pacotes.
-   **Geração de PDF:** Salve ou imprima os resultados das calculadoras de "Precificação em Lote" e "Análise de Custo" em formato PDF.
-   **Tema Claro e Escuro:** A interface oferece suporte para ambos os temas, adaptando-se à sua preferência.
-   **Design Responsivo:** A aplicação é totalmente funcional em dispositivos móveis, tablets e desktops.

## Tecnologias Utilizadas

-   **Framework:** [Next.js](https://nextjs.org/) (com App Router)
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
-   **UI Framework:** [React](https://react.dev/)
-   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
-   **Componentes:** [ShadCN/UI](https://ui.shadcn.com/)
-   **Ícones:** [Lucide React](https://lucide.dev/)
-   **Geração de PDF:** [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
-   **Parsing de XML:** [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)

## Como Executar

Para rodar este projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.
