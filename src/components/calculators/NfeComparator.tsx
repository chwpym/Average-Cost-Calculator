"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, GitCompareArrows, Bot } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groupProducts, ProductInput, ProductGroup } from "@/ai/flows/group-products-flow";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

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

export function NfeComparator() {
    const [loadedNfes, setLoadedNfes] = useState<LoadedNfe[]>([]);
    const [comparisonResult, setComparisonResult] = useState<ProductGroup[]>([]);
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

    const handleCompare = useCallback(async () => {
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

        try {
            const allProducts: ProductInput[] = loadedNfes.flatMap(nfe => 
                nfe.products.map(p => ({
                    ...p,
                    nfeId: nfe.id,
                    nfeNumber: nfe.nfeNumber,
                    emitterName: nfe.emitterName
                }))
            );
            
            const groupedProducts = await groupProducts({ products: allProducts });
            
            const duplicates = groupedProducts.filter(g => g.items.length > 1);

            duplicates.sort((a, b) => b.items.length - a.length || a.canonicalDescription.localeCompare(b.canonicalDescription));
            
            setComparisonResult(duplicates);

            toast({
                title: "Comparação Concluída",
                description: `${duplicates.length} produto(s) encontrado(s) em mais de uma NF-e.`
            });

        } catch (error) {
            console.error("Erro na comparação com IA:", error);
            toast({
                variant: "destructive",
                title: "Erro na Comparação",
                description: "Ocorreu um erro ao tentar agrupar os produtos com a IA. Tente novamente.",
            });
        } finally {
            setIsComparing(false);
        }
    }, [loadedNfes, toast]);


    const clearData = useCallback(() => {
        setLoadedNfes([]);
        setComparisonResult([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast({ title: "Dados limpos", description: "A área de comparação está pronta para novos arquivos." });
    }, [toast]);

    const totalQuantityForGroup = (group: ProductGroup) => {
        return group.items.reduce((sum, item) => sum + item.quantity, 0);
    }

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
            
            <Alert>
                <Bot className="h-4 w-4" />
                <AlertTitle>Comparação Inteligente</AlertTitle>
                <AlertDescription>
                   Esta ferramenta usa Inteligência Artificial para analisar as descrições e agrupar produtos similares, mesmo que tenham códigos ou nomes ligeiramente diferentes entre as notas fiscais.
                </AlertDescription>
            </Alert>


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

            {isComparing && (
                <div className="flex items-center justify-center p-8">
                    <Bot className="h-8 w-8 animate-spin mr-4" />
                    <p className="text-lg">Aguarde, a IA está analisando e agrupando seus produtos...</p>
                </div>
            )}

            {comparisonResult.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultados da Comparação Inteligente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto (Agrupado por IA)</TableHead>
                                    <TableHead className="text-center">Encontrado em</TableHead>
                                    <TableHead className="text-right">Qtde Total</TableHead>
                                    <TableHead>Ocorrências nas NF-es</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {comparisonResult.map((group, groupIndex) => (
                                    <TableRow key={groupIndex}>
                                        <TableCell>
                                            <div className="font-medium">{group.canonicalDescription}</div>
                                            <div className="text-xs text-muted-foreground">({group.items.length} variações)</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">{group.items.length} NF-es</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{formatNumber(totalQuantityForGroup(group))}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {group.items.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="text-xs p-2 rounded-md bg-muted/50" title={`${item.emitterName} - NF-e: ${item.nfeNumber}`}>
                                                       <p className="font-semibold">{item.emitterName}</p>
                                                       <p className="text-muted-foreground">"{item.description}"</p>
                                                       <div className="flex justify-between mt-1">
                                                            <span>NF-e: {item.nfeNumber}</span>
                                                            <span>Qtde: {formatNumber(item.quantity)}</span>
                                                            <span>Custo: {formatCurrency(item.unitCost, 4)}</span>
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
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
