import { NfeComparator } from "@/components/calculators/NfeComparator";
import { AppLayout } from "@/components/layout/AppLayout";

export default function CompareNfePage() {
    return (
        <AppLayout title="Comparador de NF-e" fullWidth>
            <div className="space-y-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-xl font-semibold">Comparador de Notas Fiscais</h2>
                    <p className="text-muted-foreground">Importe múltiplos arquivos XML de NF-e para comparar produtos, quantidades e custos entre eles.</p>
                </div>
                <NfeComparator />
            </div>
        </AppLayout>
    );
}
