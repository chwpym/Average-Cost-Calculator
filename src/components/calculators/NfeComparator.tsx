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

export function NfeComparator() {
    const [loadedNfes, setLoadedNfes] = useState<LoadedNfe[]>([]);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((files: FileList) => {
        if (!files || files.length === 0) return;

        const newNfes: LoadedNfe[] = [...loadedNfes];
        let filesProcessed = 0;

        Array.from(files).forEach(file => {
            if (loadedNfes.some(nfe => nfe.name === file.name)) {
                filesProcessed++;
                if (filesProcessed === files.length) {
                    toast({ title: "Aviso", description: "Alguns arquivos já haviam sido carregados e foram ignorados." });
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
                    
                    const products: Product[] = dets.map((det: any) => {
                        const prod = det.prod;
                        return {
                            code: String(prod.cProd),
                            description: prod.xProd || "Sem descrição",
                            quantity: parseFloat(prod.qCom) || 0,
                            unitCost: parseFloat(prod.vUnCom) || 0,
                        };
                    });

                    newNfes.push({ name: file.name, products });

                } catch (error: any) {
                    toast({
                        variant: "destructive",
                        title: "Erro de Importação",
                        description: `Falha ao processar ${file.name}: ${error.message}`,
                    });
                } finally {
                    filesProcessed++;
                    if (filesProcessed === files.length) {
                        setLoadedNfes(newNfes);
                        toast({
                            title: "Sucesso!",
                            description: `${files.length} arquivo(s) processado(s).`,
                        });
                    }
                }
            };
            reader.readAsText(file, 'ISO-8859-1');
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

    const clearData = useCallback(() => {
        setLoadedNfes([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast({ title: "Dados limpos", description: "A área de comparação está pronta para novos arquivos." });
    }, [toast]);
    
    // TODO: Implement comparison logic
    const comparedProducts = useMemo(() => {
        const productMap = new Map<string, { description: string; totalQuantity: number; occurrences: any[] }>();

        loadedNfes.forEach(nfe => {
            nfe.products.forEach(product => {
                const key = product.code;
                if(productMap.has(key)){
                    const existing = productMap.get(key)!;
                    existing.totalQuantity += product.quantity;
                    existing.occurrences.push({ fileName: nfe.name, quantity: product.quantity, unitCost: product.unitCost });
                } else {
                    productMap.set(key, {
                        description: product.description,
                        totalQuantity: product.quantity,
                        occurrences: [{ fileName: nfe.name, quantity: product.quantity, unitCost: product.unitCost }]
                    });
                }
            });
        });

        return Array.from(productMap.values()).filter(p => p.occurrences.length > 1);

    }, [loadedNfes]);


    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Arquivos XML
                </Button>
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
                     <Accordion type="single" collapsible className="w-full">
                        {loadedNfes.map((nfe) => (
                            <AccordionItem value={nfe.name} key={nfe.name}>
                                <AccordionTrigger>
                                    <span className="font-medium">{nfe.name}</span>
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
                                                    <TableRow key={prod.code}>
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
        </div>
    );
}
