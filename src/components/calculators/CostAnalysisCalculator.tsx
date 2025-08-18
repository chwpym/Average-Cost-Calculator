"use client";

import { useState, useMemo, useRef } from "react";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface AnalyzedItem {
    id: number;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    ipi: number;
    icmsST: number;
    frete: number;
    finalUnitCost: number;
    finalTotalCost: number;
}

export function CostAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportXml = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlData = e.target?.result as string;
                const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
                const jsonObj = parser.parse(xmlData);
                
                const infNFe = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
                if (!infNFe) {
                    throw new Error("Estrutura do XML da NF-e inválida: <infNFe> não encontrado.");
                }

                const dets = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
                const total = infNFe.total?.ICMSTot;

                if (!dets || !total) {
                    throw new Error("Estrutura do XML da NF-e inválida: <det> ou <ICMSTot> não encontrados.");
                }

                const totalProdValue = parseFloat(total.vProd) || 0;
                const totalIPI = parseFloat(total.vIPI) || 0;
                const totalST = parseFloat(total.vST) || 0;
                const totalFrete = parseFloat(total.vFrete) || 0;

                const newItems: AnalyzedItem[] = dets.map((det: any, index: number) => {
                    const prod = det.prod;
                    const imposto = det.imposto;

                    const quantity = parseFloat(prod.qCom) || 0;
                    const unitCost = parseFloat(prod.vUnCom) || 0;
                    const itemTotalCost = parseFloat(prod.vProd) || 0;
                    
                    const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

                    const ipiRateado = (imposto?.IPI?.IPITrib?.vIPI || 0) + (totalIPI * itemWeight);
                    const stRateado = (imposto?.ICMS?.ICMSST?.vICMSST || 0) + (totalST * itemWeight);
                    const freteRateado = (prod.vFrete || 0) + (totalFrete * itemWeight);
                    
                    const finalTotalCost = itemTotalCost + ipiRateado + stRateado + freteRateado;
                    const finalUnitCost = quantity > 0 ? finalTotalCost / quantity : 0;
                    
                    return {
                        id: Date.now() + index,
                        description: prod.xProd || "",
                        quantity: quantity,
                        unitCost: unitCost,
                        totalCost: itemTotalCost,
                        ipi: ipiRateado,
                        icmsST: stRateado,
                        frete: freteRateado,
                        finalUnitCost: finalUnitCost,
                        finalTotalCost: finalTotalCost,
                    };
                });
                
                setItems(newItems);

                toast({
                    title: "Sucesso!",
                    description: `${newItems.length} itens importados e analisados da NF-e.`,
                });

            } catch (error: any) {
                console.error("Erro ao processar o XML:", error);
                setItems([]);
                setFileName(null);
                toast({
                    variant: "destructive",
                    title: "Erro de Importação",
                    description: error.message || "Não foi possível ler o arquivo XML. Verifique se o formato é uma NF-e válida.",
                });
            } finally {
              if(fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
        };
        reader.readAsText(file, 'ISO-8859-1');
    };

    const clearData = () => {
        setItems([]);
        setFileName(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const totals = useMemo(() => {
        return items.reduce((acc, item) => {
            acc.totalCost += item.totalCost;
            acc.totalIPI += item.ipi;
            acc.totalST += item.icmsST;
            acc.totalFrete += item.frete;
            acc.finalTotalCost += item.finalTotalCost;
            return acc;
        }, { totalCost: 0, totalIPI: 0, totalST: 0, totalFrete: 0, finalTotalCost: 0 });
    }, [items]);


    return (
        <div className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2" />
                    Importar XML da NF-e
                </Button>
                {fileName && (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                        <span className="text-sm text-muted-foreground">{fileName}</span>
                        <Button variant="ghost" size="icon" onClick={clearData} className="h-6 w-6">
                           <FileX className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                )}
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportXml}
                    className="hidden" 
                    accept=".xml"
                />
            </div>

            {items.length > 0 && (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Descrição</TableHead>
                                <TableHead>Qtde</TableHead>
                                <TableHead>Custo Un. Orig.</TableHead>
                                <TableHead>Custo Total Orig.</TableHead>
                                <TableHead>IPI</TableHead>
                                <TableHead>ICMS-ST</TableHead>
                                <TableHead>Frete</TableHead>
                                <TableHead className="text-primary font-bold">Custo Un. Final</TableHead>
                                <TableHead className="text-primary font-bold">Custo Total Final</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell>{formatNumber(item.quantity, 0)}</TableCell>
                                    <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                                    <TableCell>{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell>{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell>{formatCurrency(item.icmsST)}</TableCell>
                                    <TableCell>{formatCurrency(item.frete)}</TableCell>
                                    <TableCell className="font-bold">{formatCurrency(item.finalUnitCost)}</TableCell>
                                    <TableCell className="font-bold">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow className="font-bold text-base">
                                <TableCell colSpan={3} className="text-right">Totais:</TableCell>
                                <TableCell>{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell>{formatCurrency(totals.totalIPI)}</TableCell>
                                <TableCell>{formatCurrency(totals.totalST)}</TableCell>
                                <TableCell>{formatCurrency(totals.totalFrete)}</TableCell>
                                <TableCell colSpan={2} className="text-right text-primary">{formatCurrency(totals.finalTotalCost)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}
