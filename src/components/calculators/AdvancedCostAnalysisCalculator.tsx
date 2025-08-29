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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Label } from "../ui/label";

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
    pis: number;
    cofins: number;
    finalUnitCost: number;
    finalTotalCost: number;
    conversionFactor: string; // Fator de conversão (ex: "12" para caixa com 12)
    convertedUnitCost: number; // Custo unitário após conversão
}

interface NfeInfo {
    emitterName: string;
    emitterCnpj: string;
    nfeNumber: string;
    totalGrossValue: number; // Valor bruto, sem descontos
}

export function AdvancedCostAnalysisCalculator() {
    const [items, setItems] = useState<AnalyzedItem[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [nfeInfo, setNfeInfo] = useState<NfeInfo | null>(null);
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
                
                const totalFrete = parseFloat(total.vFrete) || 0;
                const totalSeguro = parseFloat(total.vSeg) || 0;
                const totalDesconto = parseFloat(total.vDesc) || 0;
                const totalOutras = parseFloat(total.vOutro) || 0;
                const totalST = parseFloat(total.vST) || 0;
                const totalIPI = parseFloat(total.vIPI) || 0;

                const newNfeInfo: NfeInfo = {
                    emitterName: infNFe.emit?.xNome || 'N/A',
                    emitterCnpj: infNFe.emit?.CNPJ || 'N/A',
                    nfeNumber: infNFe.ide?.nNF || 'N/A',
                    totalGrossValue: totalProdValue + totalFrete + totalSeguro + totalOutras + totalST + totalIPI,
                };
                setNfeInfo(newNfeInfo);
                
                const newItems: AnalyzedItem[] = dets.map((det: any, index: number) => {
                    const prod = det.prod;
                    const imposto = det.imposto;

                    const quantity = parseFloat(prod.qCom) || 0;
                    const unitCost = parseFloat(prod.vUnCom) || 0;
                    const itemTotalCost = parseFloat(prod.vProd) || 0;
                    
                    const itemWeight = totalProdValue > 0 ? itemTotalCost / totalProdValue : 0;

                    const ipiValor = parseFloat(imposto?.IPI?.IPITrib?.vIPI) || 0;
                    const stValor = parseFloat(imposto?.ICMS?.ICMSST?.vICMSST) || 0;
                    const pisValor = parseFloat(imposto?.PIS?.PISAliq?.vPIS) || parseFloat(imposto?.PIS?.PISST?.vPIS) || 0;
                    const cofinsValor = parseFloat(imposto?.COFINS?.COFINSAliq?.vCOFINS) || parseFloat(imposto?.COFINS?.COFINSST?.vCOFINS) || 0;

                    const freteRateado = parseFloat(prod.vFrete) || (totalFrete * itemWeight) || 0;
                    const seguroRateado = parseFloat(prod.vSeg) || (totalSeguro * itemWeight) || 0;
                    const descontoRateado = parseFloat(prod.vDesc) || (totalDesconto * itemWeight) || 0;
                    const outrasRateado = parseFloat(prod.vOutro) || (totalOutras * itemWeight) || 0;

                    // Custo final: Custo Original + Impostos não recuperáveis (IPI, ST) + Despesas (Frete, Seguro, Outras) - Descontos - Impostos Recuperáveis (PIS, COFINS)
                    const finalTotalCost = itemTotalCost + ipiValor + stValor + freteRateado + seguroRateado + outrasRateado - descontoRateado - pisValor - cofinsValor;
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
                        pis: pisValor,
                        cofins: cofinsValor,
                        finalUnitCost: finalUnitCost,
                        finalTotalCost: finalTotalCost,
                        conversionFactor: "1",
                        convertedUnitCost: finalUnitCost,
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
                setNfeInfo(null);
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

    const handleConversionFactorChange = (id: number, value: string) => {
        setItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const factor = parseFloat(value) || 1;
                    const convertedUnitCost = factor > 0 ? item.finalUnitCost / factor : item.finalUnitCost;
                    return { ...item, conversionFactor: value, convertedUnitCost };
                }
                return item;
            })
        );
    };


    const clearData = () => {
        setItems([]);
        setFileName(null);
        setNfeInfo(null);
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
            acc.totalPIS += item.pis;
            acc.totalCOFINS += item.cofins;
            acc.finalTotalCost += item.finalTotalCost;
            return acc;
        }, { 
            totalCost: 0, totalIPI: 0, totalST: 0, totalFrete: 0, totalSeguro: 0, 
            totalDesconto: 0, totalOutras: 0, totalPIS: 0, totalCOFINS: 0, finalTotalCost: 0 
        });
    }, [items]);

    const totalCostWithoutPisCofinsCredit = useMemo(() => {
        return totals.finalTotalCost + totals.totalPIS + totals.totalCOFINS;
    }, [totals]);


    const generatePdf = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        
        doc.setFontSize(18);
        doc.text("Análise de Custo Avançada por NF-e", doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

        if (nfeInfo) {
            doc.setFontSize(10);
            const startY = 32;
            doc.text(`NF-e: ${nfeInfo.nfeNumber}`, 14, startY);
            doc.text(`Emitente: ${nfeInfo.emitterName}`, 14, startY + 6);
            doc.text(`CNPJ: ${nfeInfo.emitterCnpj}`, 14, startY + 12);
            doc.text(`Total Bruto NF-e: ${formatCurrency(nfeInfo.totalGrossValue)}`, doc.internal.pageSize.getWidth() - 14, startY, { align: "right" });
            doc.text(`Custo s/ Crédito PIS/COFINS: ${formatCurrency(totalCostWithoutPisCofinsCredit)}`, doc.internal.pageSize.getWidth() - 14, startY + 6, { align: "right" });
            doc.text(`Custo Líquido Final: ${formatCurrency(totals.finalTotalCost)}`, doc.internal.pageSize.getWidth() - 14, startY + 12, { align: "right" });
        }

        const head = [['Descrição', 'Qtde', 'Fator Conv.', 'C. Un. Orig.', 'IPI', 'ICMS-ST', 'Frete', 'Seguro', 'Desconto', 'Outras', 'PIS', 'COFINS', 'C. Un. Final', 'C. Un. Final (Conv.)', 'C. Total Final']];
        const body = items.map(item => [
            item.description,
            formatNumber(item.quantity, 0),
            formatNumber(parseFloat(item.conversionFactor) || 1, 0),
            formatCurrency(item.unitCost, 4),
            formatCurrency(item.ipi),
            formatCurrency(item.icmsST),
            formatCurrency(item.frete),
            formatCurrency(item.seguro),
            formatCurrency(item.desconto),
            formatCurrency(item.outras),
            formatCurrency(item.pis),
            formatCurrency(item.cofins),
            formatCurrency(item.finalUnitCost, 4),
            formatCurrency(item.convertedUnitCost, 4),
            formatCurrency(item.finalTotalCost),
        ]);
        
        const foot = [
            [
                { content: 'Totais:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: '' }, // C. Un. Orig.
                { content: formatCurrency(totals.totalIPI), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalST), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalFrete), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalSeguro), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalDesconto), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalOutras), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalPIS), styles: { fontStyle: 'bold' } },
                { content: formatCurrency(totals.totalCOFINS), styles: { fontStyle: 'bold' } },
                { content: '' }, // C. Un. Final
                { content: '' }, // C. Un. Final (Conv.)
                { content: formatCurrency(totals.finalTotalCost), styles: { fontStyle: 'bold', fillColor: [232, 245, 233] } },
            ]
        ];

        autoTable(doc, {
            startY: nfeInfo ? 54 : 30,
            head: head,
            body: body,
            foot: foot,
            showFoot: 'lastPage',
            headStyles: { fillColor: [63, 81, 181] },
            footStyles: { fillColor: [224, 224, 224], textColor: [0,0,0], fontStyle: 'bold' },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                const pageText = `Página ${data.pageNumber} de ${pageCount}`;
                doc.text(pageText, data.settings.margin.left, doc.internal.pageSize.height - 10);
                if (fileName) {
                    doc.text(`Arquivo: ${fileName}`, doc.internal.pageSize.width - data.settings.margin.right, doc.internal.pageSize.height - 10, { align: 'right' });
                }
            }
        });
    
        doc.save(`analise_custo_avancada_${nfeInfo?.nfeNumber || 'sem_numero'}.pdf`);
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

            {nfeInfo && items.length > 0 && (
                <>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Cálculo de Custo Líquido</AlertTitle>
                    <AlertDescription>
                        Esta análise subtrai os valores de PIS e COFINS do custo final, assumindo que a empresa se credita desses impostos (regime de Lucro Real). O Custo Final representa o valor líquido da mercadoria.
                    </AlertDescription>
                </Alert>
                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <h3 className="text-lg font-medium">Informações da NF-e</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                        <div><strong>Emitente:</strong> {nfeInfo.emitterName}</div>
                        <div><strong>CNPJ:</strong> {nfeInfo.emitterCnpj}</div>
                        <div><strong>NF-e Nº:</strong> {nfeInfo.nfeNumber}</div>
                        <div className="font-semibold"><strong>Total Bruto (s/ desc):</strong> <span className="font-bold">{formatCurrency(nfeInfo.totalGrossValue)}</span></div>
                        <div className="font-semibold"><strong>Custo Total (s/ crédito PIS/COFINS):</strong> <span className="font-bold">{formatCurrency(totalCostWithoutPisCofinsCredit)}</span></div>
                        <div className="font-semibold"><strong>Custo Líquido (c/ crédito PIS/COFINS):</strong> <span className="font-bold text-primary">{formatCurrency(totals.finalTotalCost)}</span></div>
                    </div>
                </div>
                </>
            )}

            {items.length > 0 && (
                 <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[250px] sticky left-0 bg-background z-10">Descrição</TableHead>
                                <TableHead className="text-right">Qtde</TableHead>
                                <TableHead className="w-[100px]">Fator Conv.</TableHead>
                                <TableHead className="text-right">C. Un. Orig.</TableHead>
                                <TableHead className="text-right">C. Total Orig.</TableHead>
                                <TableHead className="text-right">IPI</TableHead>
                                <TableHead className="text-right">ICMS-ST</TableHead>
                                <TableHead className="text-right">Frete</TableHead>
                                <TableHead className="text-right">Seguro</TableHead>
                                <TableHead className="text-right">Desconto</TableHead>
                                <TableHead className="text-right">Outras</TableHead>
                                <TableHead className="text-right text-green-600">PIS</TableHead>
                                <TableHead className="text-right text-green-600">COFINS</TableHead>
                                <TableHead className="text-right text-primary font-bold">C. Un. Final</TableHead>
                                <TableHead className="text-right text-primary font-bold">C. Un. Final (Conv.)</TableHead>
                                <TableHead className="text-right text-primary font-bold">C. Total Final</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium text-xs sticky left-0 bg-background z-10">{item.description}</TableCell>
                                    <TableCell className="text-right">{formatNumber(item.quantity, 0)}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            className="h-8 text-right"
                                            value={item.conversionFactor}
                                            onChange={(e) => handleConversionFactorChange(item.id, e.target.value)}
                                            placeholder="1"
                                            min="1"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.unitCost, 4)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.ipi)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.icmsST)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.frete)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.seguro)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.outras)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(item.pis)}</TableCell>
                                    <TableCell className="text-right text-green-600">{formatCurrency(item.cofins)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalUnitCost, 4)}</TableCell>
                                    <TableCell className="text-right font-bold text-third">{formatCurrency(item.convertedUnitCost, 4)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.finalTotalCost)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell className="sticky left-0 bg-muted/50 z-10 text-right" colSpan={4}>Totais:</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalCost)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalIPI)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalST)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalFrete)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalSeguro)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totals.totalOutras)}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(totals.totalPIS)}</TableCell>
                                <TableCell className="text-right text-green-600">{formatCurrency(totals.totalCOFINS)}</TableCell>
                                <TableCell colSpan={2} className="text-right">Custo Total Líquido:</TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(totals.finalTotalCost)}</TableCell>
                            </TableRow>
                             <TableRow className="font-bold bg-muted">
                                <TableCell colSpan={15} className="text-right">Custo Total (sem crédito PIS/COFINS):</TableCell>
                                <TableCell className="text-right">{formatCurrency(totalCostWithoutPisCofinsCredit)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}
        </div>
    );
}
