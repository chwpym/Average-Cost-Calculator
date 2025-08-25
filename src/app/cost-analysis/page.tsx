import { CostAnalysisCalculator } from "@/components/calculators/CostAnalysisCalculator";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CostAnalysisPage() {
    return (
        <AppLayout title="Análise de Custo por NF-e" fullWidth>
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">Análise de Custo por NF-e</h2>
                    <p className="text-muted-foreground">Importe o XML de uma NF-e para calcular o custo real dos seus produtos, incluindo impostos e frete.</p>
                </div>
                <CostAnalysisCalculator />
            </div>
        </AppLayout>
    );
}
