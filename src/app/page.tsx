
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Trash2, PlusCircle, AlertCircle, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

const formatNumber = (value: number, minimumFractionDigits = 0, suffix = "") => {
    if (isNaN(value)) return `0${suffix}`;
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(value);
    return `${formatted}${suffix}`;
  };

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Calculadoras Financeiras</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-6xl">
        <Tabs defaultValue="average-price" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="average-price">Preço Médio</TabsTrigger>
            <TabsTrigger value="financial-calculators">Outras Calculadoras</TabsTrigger>
          </TabsList>
          <TabsContent value="average-price">
            <AveragePriceCalculator />
          </TabsContent>
          <TabsContent value="financial-calculators">
            <FinancialCalculators />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-muted-foreground text-sm">
        <p>Feito com ❤️ para ajudar investidores.</p>
      </footer>
    </div>
  );
}

function AveragePriceCalculator() {
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
    <>
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
    </>
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

function FinancialCalculators() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Calculadoras Financeiras</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calculate-percent">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="calculate-percent">Calcular %</TabsTrigger>
            <TabsTrigger value="sum-percent">Somar com %</TabsTrigger>
            <TabsTrigger value="calculate-sale">Calcular Venda</TabsTrigger>
            <TabsTrigger value="batch-pricing">Precificação em Lote</TabsTrigger>
          </TabsList>
          <TabsContent value="calculate-percent">
            <CalculatePercentTab />
          </TabsContent>
          <TabsContent value="sum-percent">
            <SumPercentTab />
          </TabsContent>
          <TabsContent value="calculate-sale">
            <CalculateSaleTab />
          </TabsContent>
          <TabsContent value="batch-pricing">
            <BatchPricingCalculator />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CalculatePercentTab() {
  const [originalValue, setOriginalValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const val = parseFloat(originalValue);
    const pct = parseFloat(percentage);
    if (!isNaN(val) && !isNaN(pct)) {
      setResult((val * pct) / 100);
    } else {
      setResult(null);
    }
  };
  
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="originalValue">Valor Original</Label>
        <Input id="originalValue" type="number" placeholder="Ex: 1000" value={originalValue} onChange={e => setOriginalValue(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="percentage">Porcentagem (%)</Label>
        <Input id="percentage" type="number" placeholder="Ex: 25" value={percentage} onChange={e => setPercentage(e.target.value)} />
      </div>
      <Button onClick={handleCalculate}>Calcular</Button>
      {result !== null && (
        <div className="pt-4">
          <Label>Resultado</Label>
          <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base">
            {formatCurrency(result)}
          </div>
        </div>
      )}
    </div>
  );
}

function SumPercentTab() {
  const [initialValue, setInitialValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const val = parseFloat(initialValue);
    const pct = parseFloat(percentage);
    if (!isNaN(val) && !isNaN(pct)) {
      setResult(val + ((val * pct) / 100));
    } else {
      setResult(null);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="initialValue">Valor Inicial</Label>
        <Input id="initialValue" type="number" placeholder="Ex: 1000" value={initialValue} onChange={e => setInitialValue(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sumPercentage">Porcentagem a Somar (%)</Label>
        <Input id="sumPercentage" type="number" placeholder="Ex: 15" value={percentage} onChange={e => setPercentage(e.target.value)} />
      </div>
      <Button onClick={handleCalculate}>Calcular Soma</Button>
      {result !== null && (
        <div className="pt-4">
          <Label>Valor Final</Label>
          <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-base">
            {formatCurrency(result)}
          </div>
        </div>
      )}
    </div>
  );
}

function CalculateSaleTab() {
    const [cost, setCost] = useState("");
    const [margin, setMargin] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCost = e.target.value;
        setCost(newCost);
        const costValue = parseFloat(newCost);
        const marginValue = parseFloat(margin);

        if (!isNaN(costValue) && costValue > 0 && !isNaN(marginValue)) {
            const newPrice = costValue * (1 + marginValue / 100);
            setPrice(newPrice.toFixed(2));
            validatePrice(newPrice, costValue);
        } else if (newCost === "") {
           setPrice("");
           setMargin("");
           setError(null);
        }
    };

    const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMargin = e.target.value;
        setMargin(newMargin);
        const costValue = parseFloat(cost);
        const marginValue = parseFloat(newMargin);

        if (!isNaN(costValue) && costValue > 0 && !isNaN(marginValue)) {
            const newPrice = costValue * (1 + marginValue / 100);
            setPrice(newPrice.toFixed(2));
            validatePrice(newPrice, costValue);
        } else if (newMargin === "") {
            setPrice("");
        }
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPrice = e.target.value;
        setPrice(newPrice);
        const costValue = parseFloat(cost);
        const priceValue = parseFloat(newPrice);

        if (!isNaN(costValue) && costValue > 0 && !isNaN(priceValue)) {
            const newMargin = ((priceValue / costValue) - 1) * 100;
            setMargin(newMargin.toFixed(2));
            validatePrice(priceValue, costValue);
        } else if (newPrice === "") {
            setMargin("");
        }
    };

    const validatePrice = (priceValue: number, costValue: number) => {
        if (priceValue < costValue) {
            setError("O preço de venda não pode ser menor que o custo.");
        } else {
            setError(null);
        }
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="cost">Custo do Produto (R$)</Label>
                <Input id="cost" type="number" placeholder="Ex: 50" value={cost} onChange={handleCostChange}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="margin">Margem de Lucro (%)</Label>
                <Input id="margin" type="number" placeholder="Ex: 40" value={margin} onChange={handleMarginChange}/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">Preço de Venda (R$)</Label>
                <Input id="price" type="number" placeholder="Ex: 70" value={price} onChange={handlePriceChange}/>
            </div>
            {error && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

interface BatchPriceItem {
    id: number;
    description: string;
    quantity: string;
    cost: string;
    margin: string;
    price: string;
  }
  
  function BatchPricingCalculator() {
    const [items, setItems] = useState<BatchPriceItem[]>([
      { id: 1, description: "", quantity: "1", cost: "", margin: "", price: "" },
    ]);
  
    const handleItemChange = (id: number, field: keyof BatchPriceItem, value: string) => {
      setItems(prevItems => {
        const newItems = prevItems.map(item => {
          if (item.id === id) {
            const updatedItem = { ...item, [field]: value };
            
            const cost = parseFloat(updatedItem.cost) || 0;
            let margin = parseFloat(updatedItem.margin) || 0;
            let price = parseFloat(updatedItem.price) || 0;
  
            if (cost > 0) {
              if (field === 'margin' || field === 'cost' || field === 'quantity') {
                price = cost * (1 + margin / 100);
                updatedItem.price = price > 0 ? price.toFixed(2) : "";
              } else if (field === 'price') {
                margin = price > 0 ? ((price / cost) - 1) * 100 : 0;
                updatedItem.margin = margin > 0 ? margin.toFixed(2) : "";
              }
            } else {
                updatedItem.price = "";
                updatedItem.margin = "";
            }
            
            return updatedItem;
          }
          return item;
        });
        return newItems;
      });
    };
  
    const addItem = () => {
      setItems(prev => [
        ...prev,
        { id: Date.now(), description: "", quantity: "1", cost: "", margin: "", price: "" },
      ]);
    };
  
    const removeItem = (id: number) => {
      setItems(prev => prev.filter(item => item.id !== id));
    };
  
    const totals = useMemo(() => {
        const totalCost = items.reduce((acc, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const cost = parseFloat(item.cost) || 0;
            return acc + (quantity * cost);
        }, 0);

        const totalValue = items.reduce((acc, item) => {
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          return acc + (quantity * price);
        }, 0);

        const averageMargin = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

        return { totalCost, totalValue, averageMargin };
      }, [items]);
  
    return (
      <div className="pt-4 space-y-4">
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[180px]">Descrição</TableHead>
                <TableHead className="w-[80px]">Qtde</TableHead>
                <TableHead className="w-[110px]">Custo Un. (R$)</TableHead>
                <TableHead className="w-[110px]">Custo Total (R$)</TableHead>
                <TableHead className="w-[110px]">Margem (%)</TableHead>
                <TableHead className="w-[110px]">Venda Un. (R$)</TableHead>
                <TableHead className="w-[110px]">Venda Total (R$)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map(item => {
                    const quantity = parseFloat(item.quantity) || 0;
                    const cost = parseFloat(item.cost) || 0;
                    const price = parseFloat(item.price) || 0;
                    const totalCost = quantity * cost;
                    const totalSale = quantity * price;
                    return (
                        <TableRow key={item.id}>
                            <TableCell>
                                <Input
                                type="text"
                                placeholder="Nome do produto"
                                value={item.description}
                                onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={item.quantity}
                                onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={item.cost}
                                onChange={e => handleItemChange(item.id, 'cost', e.target.value)}
                                />
                            </TableCell>
                             <TableCell>
                                <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm">
                                    {formatCurrency(totalCost)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={item.margin}
                                onChange={e => handleItemChange(item.id, 'margin', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                type="number"
                                value={item.price}
                                onChange={e => handleItemChange(item.id, 'price', e.target.value)}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm">
                                    {formatCurrency(totalSale)}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Totais:</TableCell>
                    <TableCell className="font-bold">
                        <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm font-bold">
                            {formatCurrency(totals.totalCost)}
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                        <div className="flex items-center justify-end space-x-2">
                            <span>Média da Margem</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>sobre o custo total</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </TableCell>
                     <TableCell className="font-bold">
                        <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm font-bold">
                            {formatNumber(totals.averageMargin, 2, '%')}
                        </div>
                    </TableCell>
                    <TableCell className="font-bold">
                        <div className="w-full h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm font-bold">
                            {formatCurrency(totals.totalValue)}
                        </div>
                    </TableCell>
                    <TableCell></TableCell>
                </TableRow>
            </TableFooter>
            </Table>
        </div>
        <Button onClick={addItem} variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>
    );
  }
