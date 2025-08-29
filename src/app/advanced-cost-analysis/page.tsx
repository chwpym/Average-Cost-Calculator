import { AdvancedCostAnalysisCalculator } from "@/components/calculators/AdvancedCostAnalysisCalculator";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AdvancedCostAnalysisPage() {
    return (
        <AppLayout title="Análise de Custo Avançada por NF-e" fullWidth>
            <div className="space-y-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-xl font-semibold">Análise de Custo Avançada (PIS/COFINS)</h2>
                    <p className="text-muted-foreground">Importe o XML de uma NF-e para calcular o custo real dos seus produtos, incluindo PIS/COFINS e outras tributações.</p>
                </div>
                <AdvancedCostAnalysisCalculator />
            </div>
        </AppLayout>
    );
}
