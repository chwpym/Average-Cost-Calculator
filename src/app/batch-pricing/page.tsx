import { BatchPricingCalculator } from "@/components/calculators/BatchPricingCalculator";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BatchPricingPage() {
    return (
        <AppLayout title="Precificação em Lote">
             <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Precificação de Produtos em Lote</CardTitle>
                </CardHeader>
                <CardContent>
                    <BatchPricingCalculator />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
