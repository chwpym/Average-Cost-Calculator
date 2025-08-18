"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Calculator, ShoppingCart, Percent, Bot, Plus, FileScan } from "lucide-react";
import Link from "next/link";

const calculators = [
    {
      href: '/average-price',
      icon: Calculator,
      title: 'Preço Médio',
    },
    {
      href: '/batch-pricing',
      icon: ShoppingCart,
      title: 'Precificação em Lote',
    },
    {
      href: '/calculate-sale',
      icon: Percent,
      title: 'Calcular Venda',
    },
    {
      href: '/calculate-percent',
      icon: Bot,
      title: 'Calcular Porcentagem',
    },
    {
      href: '/sum-percent',
      icon: Plus,
      title: 'Somar com Porcentagem',
    },
    {
      href: '/cost-analysis',
      icon: FileScan,
      title: 'Análise de Custo por NF-e',
    },
];

export function Sidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Calculadoras</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col space-y-2">
          {calculators.map((calc) => (
            <Link href={calc.href} key={calc.href} passHref>
              <Button variant="ghost" className="w-full justify-start">
                <calc.icon className="mr-2 h-4 w-4" />
                {calc.title}
              </Button>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
