"use client";

import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Info, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface BatchPriceItem {
    id: number;
    description: string;
    quantity: string;
    cost: string;
    margin: string;
    price: string;
}
  
export function BatchPricingCalculator() {
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

    const generatePdf = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Precificação de Lote", 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [['Descrição', 'Qtde', 'Custo Un. (R$)', 'Custo Total (R$)', 'Margem (%)', 'Venda Un. (R$)', 'Venda Total (R$)']],
            body: items.map(item => {
                const quantity = parseFloat(item.quantity) || 0;
                const cost = parseFloat(item.cost) || 0;
                const price = parseFloat(item.price) || 0;
                const totalCost = quantity * cost;
                const totalSale = quantity * price;
                return [
                    item.description,
                    formatNumber(quantity, 0),
                    formatCurrency(cost),
                    formatCurrency(totalCost),
                    formatNumber(parseFloat(item.margin) || 0, 2, '%'),
                    formatCurrency(price),
                    formatCurrency(totalSale)
                ];
            }),
            foot: [
                [
                    { content: 'Totais:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalCost), styles: { fontStyle: 'bold' } },
                    { content: 'Média (%):', styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: formatNumber(totals.averageMargin, 2, '%'), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalValue), styles: { fontStyle: 'bold' } },
                ]
            ],
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0,0,0], fontStyle: 'bold' },
        });
    
        doc.save("precificacao_lote.pdf");
    };
        
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
                            <span>Média (%)</span>
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
        <div className="flex space-x-2">
            <Button onClick={addItem} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Item
            </Button>
            <Button onClick={generatePdf}>
                <Printer className="mr-2 h-4 w-4" />
                Gerar PDF
            </Button>
        </div>
        </div>
    );
}
