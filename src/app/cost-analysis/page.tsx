import { CostAnalysisCalculator } from "@/components/calculators/CostAnalysisCalculator";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CostAnalysisPage() {
    return (
        <AppLayout title="Análise de Custo por NF-e">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Análise de Custo por NF-e</CardTitle>
                    <CardDescription>Importe o XML de uma NF-e para calcular o custo real dos seus produtos, incluindo impostos e frete.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CostAnalysisCalculator />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
