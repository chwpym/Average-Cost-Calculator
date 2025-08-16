
"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { AveragePriceCalculator } from "@/components/calculators/AveragePriceCalculator";
import { FinancialCalculators } from "@/components/calculators/FinancialCalculators";

export type CalculatorView = 'average-price' | 'financial-calculators';

export default function Home() {
  const [activeView, setActiveView] = useState<CalculatorView>('average-price');

  const renderContent = () => {
    switch (activeView) {
      case 'average-price':
        return <AveragePriceCalculator />;
      case 'financial-calculators':
        return <FinancialCalculators />;
      default:
        return <AveragePriceCalculator />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <SidebarNav activeView={activeView} setActiveView={setActiveView} />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            {activeView === 'average-price' ? 'Calculadora de Preço Médio' : 'Calculadoras Financeiras'}
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-6xl">
        {renderContent()}
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-muted-foreground text-sm">
        <p>Feito com ❤️ para ajudar investidores.</p>
      </footer>
    </div>
  );
}
