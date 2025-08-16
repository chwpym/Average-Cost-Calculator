"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Trash2 } from "lucide-react";

interface Purchase {
  quantity: string;
  price: string;
}

const formatCurrency = (value: number) => {
  if (isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatNumber = (value: number) => {
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function Home() {
  const [firstPurchase, setFirstPurchase] = useState<Purchase>({ quantity: "", price: "" });
  const [secondPurchase, setSecondPurchase] = useState<Purchase>({ quantity: "", price: "" });

  const handlePurchaseChange = (setter: React.Dispatch<React.SetStateAction<Purchase>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

  const clearFields = useCallback(() => {
    setFirstPurchase({ quantity: "", price: "" });
    setSecondPurchase({ quantity: "", price: "" });
  }, []);

  const calculations = useMemo(() => {
    const q1 = parseFloat(firstPurchase.quantity) || 0;
    const p1 = parseFloat(firstPurchase.price) || 0;
    const q2 = parseFloat(secondPurchase.quantity) || 0;
    const p2 = parseFloat(secondPurchase.price) || 0;

    const total1 = q1 * p1;
    const total2 = q2 * p2;

    const totalQuantity = q1 + q2;
    const totalInvested = total1 + total2;
    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

    return { total1, total2, totalQuantity, totalInvested, averagePrice };
  }, [firstPurchase, secondPurchase]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Calculadora de Preço Médio</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <PurchaseCard
            title="Primeira Compra"
            purchase={firstPurchase}
            onChange={handlePurchaseChange(setFirstPurchase)}
            totalValue={calculations.total1}
          />
          <PurchaseCard
            title="Segunda Compra"
            purchase={secondPurchase}
            onChange={handlePurchaseChange(setSecondPurchase)}
            totalValue={calculations.total2}
          />
        </div>

        <ResultCard
          totalQuantity={calculations.totalQuantity}
          totalInvested={calculations.totalInvested}
          averagePrice={calculations.averagePrice}
        />

        <div className="mt-8 flex justify-center">
          <Button variant="destructive" onClick={clearFields}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Campos
          </Button>
        </div>
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center text-muted-foreground text-sm">
        <p>Feito com ❤️ para ajudar investidores.</p>
      </footer>
    </div>
  );
}

interface PurchaseCardProps {
  title: string;
  purchase: Purchase;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalValue: number;
}

function PurchaseCard({ title, purchase, onChange, totalValue }: PurchaseCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor={`quantity-${title}`}>Quantidade</Label>
          <Input
            id={`quantity-${title}`}
            name="quantity"
            type="number"
            placeholder="Ex: 100"
            value={purchase.quantity}
            onChange={onChange}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`price-${title}`}>Preço Unitário</Label>
          <Input
            id={`price-${title}`}
            name="price"
            type="number"
            placeholder="Ex: 10,50"
            value={purchase.price}
            onChange={onChange}
            className="text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Valor Total</Label>
          <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base">
            {formatCurrency(totalValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResultCardProps {
  totalQuantity: number;
  totalInvested: number;
  averagePrice: number;
}

function ResultCard({ totalQuantity, totalInvested, averagePrice }: ResultCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Resultado Final</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <ResultItem label="Quantidade Total" value={formatNumber(totalQuantity)} />
        <ResultItem label="Valor Total Investido" value={formatCurrency(totalInvested)} />
        <ResultItem label="Preço Médio" value={formatCurrency(averagePrice)} isPrimary />
      </CardContent>
    </Card>
  );
}

interface ResultItemProps {
  label: string;
  value: string;
  isPrimary?: boolean;
}

function ResultItem({ label, value, isPrimary = false }: ResultItemProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${isPrimary ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}
