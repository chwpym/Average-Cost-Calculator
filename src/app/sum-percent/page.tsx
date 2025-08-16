import { SumPercentTab } from "@/components/calculators/SumPercentTab";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SumPercentPage() {
    return (
        <AppLayout title="Somar com Porcentagem">
             <Card className="shadow-lg max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Somar com %</CardTitle>
                </CardHeader>
                <CardContent>
                    <SumPercentTab />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
