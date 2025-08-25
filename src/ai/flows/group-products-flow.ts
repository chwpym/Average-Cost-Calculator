'use server';

/**
 * @fileOverview Fluxo de IA para agrupar produtos com base na semelhança de suas descrições.
 *
 * - groupProducts: Uma função que recebe uma lista de produtos e os agrupa.
 * - GroupProductsInput: O tipo de entrada para a função groupProducts.
 * - ProductGroup: O tipo de um único grupo de produtos retornado.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Esquema para um único produto de entrada. Inclui metadados da NF-e para rastreamento.
const ProductInputSchema = z.object({
  code: z.string().describe('O código original do produto na NF-e.'),
  description: z.string().describe('A descrição original do produto (xProd) na NF-e.'),
  quantity: z.number().describe('A quantidade do produto.'),
  unitCost: z.number().describe('O custo unitário do produto.'),
  nfeId: z.string().describe('O ID único da NF-e de origem.'),
  nfeNumber: z.string().describe('O número da NF-e de origem.'),
  emitterName: z.string().describe('O nome do emissor da NF-e de origem.'),
});
export type ProductInput = z.infer<typeof ProductInputSchema>;

// Esquema para a entrada principal do fluxo, que é uma lista de produtos.
export const GroupProductsInputSchema = z.object({
  products: z.array(ProductInputSchema),
});
export type GroupProductsInput = z.infer<typeof GroupProductsInputSchema>;

// Esquema para um grupo de produtos. A IA definirá uma descrição canônica para o grupo.
const ProductGroupSchema = z.object({
  canonicalDescription: z
    .string()
    .describe(
      'Um nome padronizado e limpo para este grupo de produtos, baseado nas descrições dos itens.'
    ),
  items: z
    .array(ProductInputSchema)
    .describe(
      'Uma lista de todos os produtos originais que foram agrupados aqui.'
    ),
});
export type ProductGroup = z.infer<typeof ProductGroupSchema>;

// Esquema para a saída do fluxo, que é uma lista de grupos de produtos.
const GroupProductsOutputSchema = z.array(ProductGroupSchema);


// Função pública que encapsula e executa o fluxo da IA.
export async function groupProducts(
  input: GroupProductsInput
): Promise<ProductGroup[]> {
  return groupProductsFlow(input);
}


// Definição do prompt da IA.
const groupProductsPrompt = ai.definePrompt({
  name: 'groupProductsPrompt',
  input: { schema: GroupProductsInputSchema },
  output: { schema: GroupProductsOutputSchema },
  prompt: `Você é um especialista em catalogação de produtos de e-commerce e varejo.
Sua tarefa é analisar uma lista de produtos extraídos de múltiplas Notas Fiscais (NF-es) e agrupá-los de forma inteligente.

Produtos com descrições muito similares devem ser considerados o mesmo item, mesmo que seus códigos ('cProd') ou pequenas variações no nome ('xProd') sejam diferentes.

Regras:
1.  Para cada grupo de produtos que você identificar como sendo o mesmo item, crie um objeto de grupo.
2.  Defina uma 'canonicalDescription' para cada grupo. Esta deve ser a descrição mais clara e padronizada possível para os itens do grupo. Por exemplo, para "PARAFUSO SEXT. 1/4" e "PARAF SEXTAVADO 1/4", a descrição canônica poderia ser "Parafuso Sextavado 1/4".
3.  O campo 'items' de cada grupo deve conter a lista completa dos objetos de produto originais que você agrupou.
4.  Se um produto não tiver um equivalente claro em outras notas, ele deve ser colocado em um grupo contendo apenas a si mesmo.
5.  Analise cuidadosamente as descrições para evitar agrupar itens que são genuinamente diferentes (ex: "Pneu Aro 15" e "Pneu Aro 16").

Abaixo está a lista de produtos para analisar no formato JSON. Agrupe-os e retorne a lista de grupos.

Lista de Produtos:
{{{json products}}}
`,
});

// Definição do fluxo da IA.
const groupProductsFlow = ai.defineFlow(
  {
    name: 'groupProductsFlow',
    inputSchema: GroupProductsInputSchema,
    outputSchema: GroupProductsOutputSchema,
  },
  async (input) => {
    // Se não houver produtos, retorna uma lista vazia.
    if (input.products.length === 0) {
      return [];
    }

    // Chama o prompt da IA com a lista de produtos.
    const { output } = await groupProductsPrompt(input);

    // Retorna a saída formatada pela IA ou uma lista vazia se a saída for nula.
    return output ?? [];
  }
);
