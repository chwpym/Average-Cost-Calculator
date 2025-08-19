import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calculator, ShoppingCart, Percent, Bot, Plus, FileScan, Tag, DivideCircle } from 'lucide-react';

const calculators = [
  {
    href: '/average-price',
    icon: Calculator,
    title: 'Preço Médio',
    description: 'Calcule o preço médio de suas compras de ativos.',
  },
  {
    href: '/batch-pricing',
    icon: ShoppingCart,
    title: 'Precificação em Lote',
    description: 'Defina preços de venda para múltiplos produtos em lote.',
  },
  {
    href: '/calculate-sale',
    icon: Tag,
    title: 'Calcular Venda',
    description: 'Calcule o preço de venda a partir do custo e margem.',
  },
  {
    href: '/unit-cost',
    icon: DivideCircle,
    title: 'Custo Unitário',
    description: 'Encontre o custo por item a partir do total e quantidade.',
  },
  {
    href: '/calculate-percent',
    icon: Percent,
    title: 'Calcular Porcentagem',
    description: 'Encontre o valor de uma porcentagem de um número.',
  },
  {
    href: '/sum-percent',
    icon: Plus,
    title: 'Somar com Porcentagem',
    description: 'Adicione uma porcentagem a um valor inicial.',
  },
  {
    href: '/cost-analysis',
    icon: FileScan,
    title: 'Análise de Custo por NF-e',
    description: 'Importe uma NF-e para calcular o custo real dos produtos.',
  },
];

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard de Calculadoras">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculators.map((calc) => (
          <Card key={calc.href} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <calc.icon className="h-6 w-6 text-primary" />
                    {calc.title}
                  </CardTitle>
                  <CardDescription className="mt-2">{calc.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Link href={calc.href} className="w-full">
                <Button className="w-full">Acessar</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
