import { AveragePriceCalculator } from "@/components/calculators/AveragePriceCalculator";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AveragePricePage() {
    return (
        <AppLayout title="Calculadora de Preço Médio">
            <AveragePriceCalculator />
        </AppLayout>
    );
}
