import { CalculatePercentTab } from "@/components/calculators/CalculatePercentTab";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CalculatePercentPage() {
    return (
        <AppLayout title="Calcular Porcentagem">
            <Card className="shadow-lg max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Calcular %</CardTitle>
                </CardHeader>
                <CardContent>
                    <CalculatePercentTab />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
