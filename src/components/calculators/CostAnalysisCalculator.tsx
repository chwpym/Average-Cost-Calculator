"use client";

import { useState, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileX, Printer } from "lucide-react";
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
    seguro: number;
    desconto: number;
    outras: number;
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
                
                // Valores totais do cabeçalho da NF-e para rateio
                const totalProdValue = parseFloat(total.vProd) || 0;
                const totalIPI = parseFloat(total.vIPI) || 0;
                const totalST = parseFloat(total.vST) || 0;
                const totalFrete = parseFloat(total.vFrete) || 0;
                const totalSeguro = parseFloat(total.vSeg) || 0;
                const totalDesconto = parseFloat(total.vDesc) || 0;
                const totalOutras = parseFloat(total.vOutro) || 0;

                const newItems: AnalyzedItem[] = dets.map((det: any, index: number) => {
                    const prod = det.prod;
                    const imposto = det.imposto;

                    const quantity = parseFloat(prod.qCom) || 0;
                    const unitCost = parseFloat(prod.vUnCom) || 0;
                    const itemTotalCost = parseFloat(prod.vProd) || 0;
                    
                    const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

                    // IPI: usa o valor do item ou rateia o total
                    const ipiValor = imposto?.IPI?.IPITrib?.vIPI || 0;

                    // ICMS-ST: usa o valor do item ou rateia o total
                    const stValor = imposto?.ICMS?.ICMSST?.vICMSST || 0;
                   
                    // Rateio dos valores do cabeçalho
                    const freteRateado = (prod.vFrete || 0) + (totalFrete * itemWeight);
                    const seguroRateado = (prod.vSeg || 0) + (totalSeguro * itemWeight);
                    const outrasRateado = (prod.vOutro || 0) + (totalOutras * itemWeight);
                    const descontoRateado = (prod.vDesc || 0) + (totalDesconto * itemWeight);
                    
                    const finalTotalCost = itemTotalCost + ipiValor + stValor + freteRateado + seguroRateado + outrasRateado - descontoRateado;
                    const finalUnitCost = quantity > 0 ? finalTotalCost / quantity : 0;
                    
                    return {
                        id: Date.now() + index,
                        description: prod.xProd || "",
                        quantity: quantity,
                        unitCost: unitCost,
                        totalCost: itemTotalCost,
                        ipi: ipiValor,
                        icmsST: stValor,
                        frete: freteRateado,
                        seguro: seguroRateado,
                        desconto: descontoRateado,
                        outras: outrasRateado,
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
            acc.totalSeguro += item.seguro;
            acc.totalDesconto += item.desconto;
            acc.totalOutras += item.outras;
            acc.finalTotalCost += item.finalTotalCost;
            return acc;
        }, { totalCost: 0, totalIPI: 0, totalST: 0, totalFrete: 0, totalSeguro: 0, totalDesconto: 0, totalOutras: 0, finalTotalCost: 0 });
    }, [items]);

    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        
        doc.setFontSize(18);
        doc.text("Análise de Custo por NF-e", 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [['Descrição', 'Qtde', 'Custo Un. Orig.', 'Custo Total Orig.', 'IPI', 'ICMS-ST', 'Frete', 'Seguro', 'Desconto', 'Outras', 'Custo Un. Final', 'Custo Total Final']],
            body: items.map(item => [
                item.description,
                formatNumber(item.quantity, 0),
                formatCurrency(item.unitCost, 4),
                formatCurrency(item.totalCost),
                formatCurrency(item.ipi),
                formatCurrency(item.icmsST),
                formatCurrency(item.frete),
                formatCurrency(item.seguro),
                formatCurrency(item.desconto),
                formatCurrency(item.outras),
                formatCurrency(item.finalUnitCost, 4),
                formatCurrency(item.finalTotalCost),
            ]),
            foot: [
                [
                    { content: 'Totais:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalCost), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalIPI), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalST), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalFrete), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalSeguro), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalDesconto), styles: { fontStyle: 'bold' } },
                    { content: formatCurrency(totals.totalOutras), styles: { fontStyle: 'bold' } },
                    { content: '' },
                    { content: formatCurrency(totals.finalTotalCost), styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
                ]
            ],
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0,0,0], fontStyle: 'bold' },
            didDrawPage: (data) => {
                if (fileName) {
                    doc.setFontSize(10);
                    doc.text(`Arquivo: ${fileName}`, 14, doc.internal.pageSize.height - 10);
                }
            }
        });
    
        doc.save("analise_custo_nfe.pdf");
    };


    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center">
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar XML da NF-e
                </Button>
                {items.length > 0 && (
                    <Button onClick={generatePdf} variant="secondary">
                        <Printer className="mr-2 h-4 w-4" />
                        Gerar PDF
                    </Button>
                )}
                {fileName && (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted flex-1 sm:flex-none justify-between">
                        <span className="text-sm text-muted-foreground truncate" title={fileName}>{fileName}</span>
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
                 <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">Descrição</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="text-right">Custo Un. Orig.</TableHead>
                                <TableHead className="text-right">Custo Total Orig.</TableHead>
                                <TableHead className="text-right">IPI</TableHead>
                                <TableHead className="text-right">ICMS-ST</TableHead>
                                <TableHead className="text-right">Frete</TableHead>
                                <TableHead className="text-right">Seguro</TableHead>
                                <TableHead className="text-right">Desconto</TableHead>
                                <TableHead className="text-right">Outras</TableHead>
                                <TableHead className="text-right text-primary font-bold">Custo Un. Final</TableHead>
                                <TableHead className="text-right text-primary font-bold">Custo Total Final</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs sticky left-0 bg-background z-10">{item.description}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.quantity, 0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.unitCost, 4)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icmsST)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.frete)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.seguro)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.outras)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalUnitCost, 4)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 bg-muted/50 z-10 text-right" colSpan={3}>Totais:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIPI)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalST)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalFrete)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalSeguro)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalOutras)}</TableCell>
                                <TableCell></TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(totals.finalTotalCost)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}
