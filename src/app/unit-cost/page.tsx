import { UnitCostCalculator } from "@/components/calculators/UnitCostCalculator";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnitCostPage() {
    return (
        <AppLayout title="Calcular Custo Unitário">
             <Card className="shadow-lg max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Calcular Custo Unitário</CardTitle>
                </CardHeader>
                <CardContent>
                    <UnitCostCalculator />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
