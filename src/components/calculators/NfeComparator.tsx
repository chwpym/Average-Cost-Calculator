"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, GitCompareArrows } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
    code: string;
    description: string;
    quantity: number;
    unitCost: number;
}

interface LoadedNfe {
    name: string;
    products: Product[];
}

interface ComparedProduct {
    code: string;
    description: string;
    totalQuantity: number;
    count: number;
    occurrences: Array<{
        fileName: string;
        quantity: number;
        unitCost: number;
    }>;
}

export function NfeComparator() {
    const [loadedNfes, setLoadedNfes] = useState<LoadedNfe[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ComparedProduct[]>([]);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList) => {
        if (!files || files.length === 0) return;

        const filePromises = Array.from(files).map(file => {
            if (loadedNfes.some(nfe => nfe.name === file.name)) {
                console.log(`Arquivo ${file.name} já carregado.`);
                return Promise.resolve(null);
            }

            return new Promise<LoadedNfe | null>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const xmlData = e.target?.result as string;
                        const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
                        const jsonObj = parser.parse(xmlData);

                        const infNFe = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
                        if (!infNFe) {
                            throw new Error(`Estrutura inválida no arquivo ${file.name}`);
                        }

                        const dets = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
                        
                        const products: Product[] = dets.map((det: any) => {
                            const prod = det.prod;
                            return {
                                code: String(prod.cProd),
                                description: prod.xProd || "Sem descrição",
                                quantity: parseFloat(prod.qCom) || 0,
                                unitCost: parseFloat(prod.vUnCom) || 0,
                            };
                        });

                        resolve({ name: file.name, products });

                    } catch (error: any) {
                        reject({fileName: file.name, message: error.message});
                    }
                };
                reader.onerror = (error) => reject({fileName: file.name, message: "Falha ao ler o arquivo."});
                reader.readAsText(file, 'ISO-8859-1');
            });
        });

        Promise.allSettled(filePromises).then(results => {
            const newNfes: LoadedNfe[] = [];
            let filesAddedCount = 0;
            let filesFailedCount = 0;

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    newNfes.push(result.value);
                    filesAddedCount++;
                } else if (result.status === 'rejected') {
                    filesFailedCount++;
                    toast({
                        variant: "destructive",
                        title: "Erro de Importação",
                        description: `Falha ao processar ${result.reason.fileName}: ${result.reason.message}`,
                    });
                }
            });

            if (newNfes.length > 0) {
                setLoadedNfes(prev => [...prev, ...newNfes]);
            }

            if(filesAddedCount > 0) {
                 toast({
                    title: "Sucesso!",
                    description: `${filesAddedCount} novo(s) arquivo(s) carregado(s).`,
                });
            }
             if (files.length > (filesAddedCount + filesFailedCount)) {
                toast({
                    title: "Aviso",
                    description: "Alguns arquivos já haviam sido carregados e foram ignorados.",
                });
            }
        });

    }, [loadedNfes, toast]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            processFiles(event.target.files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleCompare = useCallback(() => {
        const productMap = new Map<string, ComparedProduct>();

        loadedNfes.forEach(nfe => {
            nfe.products.forEach(product => {
                if (productMap.has(product.code)) {
                    const existing = productMap.get(product.code)!;
                    existing.count += 1;
                    existing.totalQuantity += product.quantity;
                    existing.occurrences.push({
                        fileName: nfe.name,
                        quantity: product.quantity,
                        unitCost: product.unitCost,
                    });
                } else {
                    productMap.set(product.code, {
                        code: product.code,
                        description: product.description,
                        totalQuantity: product.quantity,
                        count: 1,
                        occurrences: [{
                            fileName: nfe.name,
                            quantity: product.quantity,
                            unitCost: product.unitCost,
                        }],
                    });
                }
            });
        });

        const duplicates = Array.from(productMap.values()).filter(p => p.count > 1);
        duplicates.sort((a, b) => b.count - a.count);

        setComparisonResult(duplicates);

        toast({
            title: "Comparação Concluída",
            description: `${duplicates.length} produto(s) encontrado(s) em mais de uma NF-e.`
        })
    }, [loadedNfes, toast]);


    const clearData = useCallback(() => {
        setLoadedNfes([]);
        setComparisonResult([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast({ title: "Dados limpos", description: "A área de comparação está pronta para novos arquivos." });
    }, [toast]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Arquivos XML
                </Button>
                {loadedNfes.length > 1 && (
                     <Button onClick={handleCompare} variant="secondary">
                        <GitCompareArrows className="mr-2 h-4 w-4" />
                        Comparar Produtos
                    </Button>
                )}
                {loadedNfes.length > 0 && (
                    <Button onClick={clearData} variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar Dados
                    </Button>
                )}
                 <Input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".xml"
                    multiple
                />
            </div>

            {loadedNfes.length > 0 && (
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                    <h3 className="text-lg font-medium">Arquivos Carregados ({loadedNfes.length}):</h3>
                     <Accordion type="multiple" className="w-full">
                        {loadedNfes.map((nfe) => (
                            <AccordionItem value={nfe.name} key={nfe.name}>
                                <AccordionTrigger>
                                    <span className="font-medium text-left">{nfe.name}</span>
                                    <span className="text-sm text-muted-foreground ml-2">({nfe.products.length} produtos)</span>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="w-full overflow-x-auto p-2 bg-background rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Código</TableHead>
                                                    <TableHead>Descrição</TableHead>
                                                    <TableHead className="text-right">Quantidade</TableHead>
                                                    <TableHead className="text-right">Custo Unitário</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {nfe.products.map((prod) => (
                                                    <TableRow key={`${nfe.name}-${prod.code}`}>
                                                        <TableCell className="font-mono text-xs">{prod.code}</TableCell>
                                                        <TableCell>{prod.description}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(prod.quantity)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(prod.unitCost, 4)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            )}

            {comparisonResult.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados da Comparação</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead className="text-center">Encontrado em</TableHead>
                                    <TableHead className="text-right">Qtde Total</TableHead>
                                    <TableHead>Detalhes por NF-e</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {comparisonResult.map(item => (
                                    <TableRow key={item.code}>
                                        <TableCell>
                                            <div className="font-medium">{item.description}</div>
                                            <div className="font-mono text-xs text-muted-foreground">{item.code}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{item.count} NF-es</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{formatNumber(item.totalQuantity)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {item.occurrences.map((occ, index) => (
                                                    <div key={index} className="text-xs p-1 rounded-md bg-muted/50 truncate">
                                                        <span className="font-semibold">{occ.fileName}:</span> 
                                                        <span> Qtde: {formatNumber(occ.quantity)} | </span> 
                                                        <span>Custo: {formatCurrency(occ.unitCost, 4)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
