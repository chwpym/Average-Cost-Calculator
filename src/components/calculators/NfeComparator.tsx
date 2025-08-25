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

interface Product {
    code: string;
    description: string;
    quantity: number;
    unitCost: number;
}

interface LoadedNfe {
    id: string; // NFe access key
    name: string; // Original filename
    nfeNumber: string;
    emitterName: string;
    products: Product[];
}

interface ComparisonResult {
    code: string;
    description: string;
    totalQuantity: number;
    nfeCount: number;
    occurrences: Array<{
        nfeId: string;
        nfeNumber: string;
        emitterName: string;
        quantity: number;
        unitCost: number;
    }>;
}

export function NfeComparator() {
    const [loadedNfes, setLoadedNfes] = useState<LoadedNfe[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ComparisonResult[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList) => {
        if (!files || files.length === 0) return;

        const filePromises = Array.from(files).map(file => {
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
                        
                        const nfeId = infNFe['@_Id'];
                        if (loadedNfes.some(nfe => nfe.id === nfeId)) {
                             console.log(`NF-e do arquivo ${file.name} já carregada.`);
                             return resolve(null);
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

                        resolve({ 
                            id: nfeId,
                            name: file.name, 
                            nfeNumber: infNFe.ide?.nNF || 'N/A',
                            emitterName: infNFe.emit?.xNome || 'N/A',
                            products 
                        });

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
            let filesSkippedCount = 0;

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value) {
                      newNfes.push(result.value);
                      filesAddedCount++;
                    } else {
                      filesSkippedCount++;
                    }
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
                setLoadedNfes(prev => [...prev, ...newNfes].sort((a, b) => a.emitterName.localeCompare(b.emitterName)));
            }

            if(filesAddedCount > 0) {
                 toast({
                    title: "Sucesso!",
                    description: `${filesAddedCount} nova(s) NF-e(s) carregada(s).`,
                });
            }
             if (filesSkippedCount > 0) {
                toast({
                    variant: 'default',
                    title: "Aviso",
                    description: `${filesSkippedCount} arquivo(s) ignorado(s) por já terem sido carregados.`,
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
        if (loadedNfes.length < 2) {
            toast({
                variant: "destructive",
                title: "Poucos arquivos",
                description: "É necessário carregar pelo menos 2 NF-es para comparar.",
            });
            return;
        }

        setIsComparing(true);
        setComparisonResult([]);

        const allProducts = loadedNfes.flatMap(nfe => 
            nfe.products.map(p => ({
                ...p,
                nfeId: nfe.id,
                nfeNumber: nfe.nfeNumber,
                emitterName: nfe.emitterName
            }))
        );

        const groupedByCode = allProducts.reduce((acc, p) => {
            if (!acc[p.code]) {
                acc[p.code] = [];
            }
            acc[p.code].push(p);
            return acc;
        }, {} as Record<string, typeof allProducts>);

        const duplicates = Object.values(groupedByCode)
            .filter(group => group.length > 1)
            .map(group => {
                const first = group[0];
                return {
                    code: first.code,
                    description: first.description,
                    totalQuantity: group.reduce((sum, item) => sum + item.quantity, 0),
                    nfeCount: new Set(group.map(item => item.nfeId)).size,
                    occurrences: group.map(item => ({
                        nfeId: item.nfeId,
                        nfeNumber: item.nfeNumber,
                        emitterName: item.emitterName,
                        quantity: item.quantity,
                        unitCost: item.unitCost
                    }))
                };
            }).filter(item => item.nfeCount > 1);
        
        duplicates.sort((a,b) => b.nfeCount - a.nfeCount || a.description.localeCompare(b.description));

        setComparisonResult(duplicates);

        toast({
            title: "Comparação Concluída",
            description: `${duplicates.length} produto(s) encontrado(s) em mais de uma NF-e.`
        });

        setIsComparing(false);

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
                <Button onClick={() => fileInputRef.current?.click()} disabled={isComparing}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Arquivos XML
                </Button>
                {loadedNfes.length > 1 && (
                     <Button onClick={handleCompare} variant="secondary" disabled={isComparing}>
                        <GitCompareArrows className="mr-2 h-4 w-4" />
                        {isComparing ? 'Comparando...' : 'Comparar Produtos'}
                    </Button>
                )}
                {loadedNfes.length > 0 && (
                    <Button onClick={clearData} variant="destructive" disabled={isComparing}>
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
                    disabled={isComparing}
                />
            </div>

            {loadedNfes.length > 0 && (
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                    <h3 className="text-lg font-medium">NF-es Carregadas ({loadedNfes.length}):</h3>
                     <Accordion type="multiple" className="w-full">
                        {loadedNfes.map((nfe) => (
                            <AccordionItem value={nfe.id} key={nfe.id}>
                                <AccordionTrigger>
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium">{nfe.emitterName}</span>
                                      <span className="text-sm text-muted-foreground">NF-e: {nfe.nfeNumber} ({nfe.products.length} produtos)</span>
                                    </div>
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
                                                    <TableRow key={`${nfe.id}-${prod.code}`}>
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
                <div className="w-full overflow-x-auto">
                    <h3 className="text-lg font-medium mb-2">Resultados da Comparação</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-center">Encontrado em</TableHead>
                                <TableHead className="text-right">Qtde Total</TableHead>
                                <TableHead>Ocorrências nas NF-es</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparisonResult.map((result) => (
                                <TableRow key={result.code}>
                                    <TableCell>
                                        <div className="font-medium">{result.description}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{result.code}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{result.nfeCount} NF-es</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{formatNumber(result.totalQuantity)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {result.occurrences.map((occ, index) => (
                                                <div key={index} className="text-xs p-2 rounded-md bg-muted/50" title={`${occ.emitterName} - NF-e: ${occ.nfeNumber}`}>
                                                   <p className="font-semibold">{occ.emitterName}</p>
                                                   <div className="flex justify-between mt-1">
                                                        <span>NF-e: {occ.nfeNumber}</span>
                                                        <span>Qtde: {formatNumber(occ.quantity)}</span>
                                                        <span>Custo: {formatCurrency(occ.unitCost, 4)}</span>
                                                   </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
