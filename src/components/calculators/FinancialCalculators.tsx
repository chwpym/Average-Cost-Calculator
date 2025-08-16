"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatePercentTab } from "./CalculatePercentTab";
import { SumPercentTab } from "./SumPercentTab";
import { CalculateSaleTab } from "./CalculateSaleTab";
import { BatchPricingCalculator } from "./BatchPricingCalculator";


export function FinancialCalculators() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Calculadoras Financeiras</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculate-percent">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="calculate-percent">Calcular %</TabsTrigger>
            <TabsTrigger value="sum-percent">Somar com %</TabsTrigger>
            <TabsTrigger value="calculate-sale">Calcular Venda</TabsTrigger>
            <TabsTrigger value="batch-pricing">Precificação em Lote</TabsTrigger>
          </TabsList>
          <TabsContent value="calculate-percent">
            <CalculatePercentTab />
          </TabsContent>
          <TabsContent value="sum-percent">
            <SumPercentTab />
          </TabsContent>
          <TabsContent value="calculate-sale">
            <CalculateSaleTab />
          </TabsContent>
          <TabsContent value="batch-pricing">
            <BatchPricingCalculator />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
