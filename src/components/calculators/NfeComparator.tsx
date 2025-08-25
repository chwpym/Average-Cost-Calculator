"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface ProductOccurrence {
    fileName: string;
    quantity: number;
    unitCost: number;
}

interface ComparedProduct {
    code: string;
    description: string;
    totalQuantity: number;
    occurrences: ProductOccurrence[];
}

interface LoadedFile {
    name: string;
    productCount: number;
}

export function NfeComparator() {
    const [comparedProducts, setComparedProducts] = useState<ComparedProduct[]>([]);
    const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList) => {
        if (!files || files.length === 0) return;

        let allProductsMap = new Map<string, ComparedProduct>();
        // Se já existem arquivos, mantenha os produtos existentes no mapa
        if (comparedProducts.length > 0) {
            comparedProducts.forEach(p => {
                const key = p.code;
                if (!allProductsMap.has(key)) {
                    allProductsMap.set(key, {...p});
                }
            });
        }
        
        const newLoadedFiles: LoadedFile[] = [...loadedFiles];
        let filesToProcess = files.length;
        let filesProcessed = 0;
        
        Array.from(files).forEach(file => {
            // Evita carregar o mesmo arquivo duas vezes
            if(newLoadedFiles.some(f => f.name === file.name)) {
                filesToProcess--;
                if(filesToProcess === filesProcessed) {
                    // Se este era o último arquivo e já foi carregado, atualiza o estado
                    updateState(allProductsMap, newLoadedFiles);
                }
                return;
            }

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
                    newLoadedFiles.push({ name: file.name, productCount: dets.length });

                    dets.forEach((det: any) => {
                        const prod = det.prod;
                        const code = String(prod.cProd);
                        const description = prod.xProd || "Sem descrição";
                        const quantity = parseFloat(prod.qCom) || 0;
                        const unitCost = parseFloat(prod.vUnCom) || 0;
                        
                        const occurrence: ProductOccurrence = { fileName: file.name, quantity, unitCost };

                        const key = code;
                        if (allProductsMap.has(key)) {
                            const existing = allProductsMap.get(key)!;
                            existing.totalQuantity += quantity;
                            existing.occurrences.push(occurrence);
                        } else {
                            allProductsMap.set(key, {
                                code,
                                description,
                                totalQuantity: quantity,
                                occurrences: [occurrence],
                            });
                        }
                    });

                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Erro de Importação",
                        description: `Falha ao processar ${file.name}: ${error.message}`,
                    });
                } finally {
                    filesProcessed++;
                    if (filesProcessed === filesToProcess) {
                        updateState(allProductsMap, newLoadedFiles);
                    }
                }
            };
            reader.readAsText(file, 'ISO-8859-1');
        });

    }, [loadedFiles, comparedProducts, toast]);
    
    const updateState = (productMap: Map<string, ComparedProduct>, files: LoadedFile[]) => {
        const sortedProducts = Array.from(productMap.values())
            .filter(p => p.occurrences.length > 1)
            .sort((a, b) => b.occurrences.length - a.occurrences.length || b.totalQuantity - a.totalQuantity);
        
        const productsInMultipleFiles = sortedProducts.length;
        setComparedProducts(sortedProducts);
        setLoadedFiles(files);
        toast({
            title: "Arquivos Processados!",
            description: `${files.length} arquivos carregados. ${productsInMultipleFiles} produtos recorrentes encontrados.`,
        });
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            processFiles(event.target.files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const clearData = useCallback(() => {
        setComparedProducts([]);
        setLoadedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast({ title: "Dados limpos", description: "A área de comparação está pronta para novos arquivos." });
    }, [toast]);

    const filesSummary = useMemo(() => {
        if(loadedFiles.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2">
                {loadedFiles.map(file => (
                    <Badge key={file.name} variant="secondary" className="p-2">
                       {file.name} ({file.productCount} itens)
                    </Badge>
                ))}
            </div>
        )

    }, [loadedFiles]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Arquivos XML
                </Button>
                {(comparedProducts.length > 0 || loadedFiles.length > 0) && (
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

            {loadedFiles.length > 0 && (
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                    <h3 className="text-lg font-medium">Arquivos Carregados:</h3>
                    {filesSummary}
                </div>
            )}

            {comparedProducts.length > 0 ? (
                <div className="w-full overflow-x-auto">
                    <h3 className="text-lg font-medium mb-2">Produtos Encontrados em Mais de uma NF-e:</h3>
                    <div className="border rounded-lg">
                       <Accordion type="single" collapsible className="w-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Código</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-center">Qtde Total</TableHead>
                                        <TableHead className="text-center">Nº de NF-es</TableHead>
                                        <TableHead className="w-[120px] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                        {comparedProducts.map(product => (
                                            <AccordionItem value={product.code} key={product.code} asChild>
                                             <>
                                                <TableRow>
                                                    <TableCell className="font-mono text-xs">{product.code}</TableCell>
                                                    <TableCell className="font-medium">{product.description}</TableCell>
                                                    <TableCell className="text-center">{formatNumber(product.totalQuantity)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge>{product.occurrences.length}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <AccordionTrigger>Detalhes</AccordionTrigger>
                                                    </TableCell>
                                                </TableRow>
                                                <AccordionContent asChild>
                                                    <tr>
                                                        <td colSpan={5} className="p-0">
                                                        <div className="p-4 bg-muted/50">
                                                            <h4 className="font-semibold mb-2">Ocorrências:</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Arquivo NF-e</TableHead>
                                                                        <TableHead className="text-right">Quantidade</TableHead>
                                                                        <TableHead className="text-right">Custo Unitário</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {product.occurrences.map((occ, index) => (
                                                                        <TableRow key={`${occ.fileName}-${index}`}>
                                                                            <TableCell className="text-sm">{occ.fileName}</TableCell>
                                                                            <TableCell className="text-right">{formatNumber(occ.quantity)}</TableCell>
                                                                            <TableCell className="text-right">{formatCurrency(occ.unitCost, 4)}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                        </td>
                                                    </tr>
                                                </AccordionContent>
                                            </>
                                            </AccordionItem>
                                        ))}
                                </TableBody>
                            </Table>
                       </Accordion>
                    </div>
                </div>
            ) : loadedFiles.length > 0 && (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhum produto recorrente encontrado nos arquivos selecionados.</p>
                </div>
             )}
        </div>
    );
}
