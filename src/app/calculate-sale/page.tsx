import { CalculateSaleTab } from "@/components/calculators/CalculateSaleTab";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalculateSalePage() {
    return (
        <AppLayout title="Calcular Venda">
             <Card className="shadow-lg max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Calcular Preço de Venda</CardTitle>
                </CardHeader>
                <CardContent>
                    <CalculateSaleTab />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
