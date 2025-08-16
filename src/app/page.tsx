
"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AveragePriceCalculator } from "@/components/calculators/AveragePriceCalculator";
import { FinancialCalculators } from "@/components/calculators/FinancialCalculators";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Calculadoras Financeiras</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-6xl">
        <Tabs defaultValue="average-price" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="average-price">Preço Médio</TabsTrigger>
            <TabsTrigger value="financial-calculators">Outras Calculadoras</TabsTrigger>
          </TabsList>
          <TabsContent value="average-price">
            <AveragePriceCalculator />
          </TabsContent>
          <TabsContent value="financial-calculators">
            <FinancialCalculators />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-muted-foreground text-sm">
        <p>Feito com ❤️ para ajudar investidores.</p>
      </footer>
    </div>
  );
}
