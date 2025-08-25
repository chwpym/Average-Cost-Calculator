"use client";

import { useState, useRef, useCallback } from "react";
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

        const filePromises = Array.from(files).map(file => {
            // Ignora arquivos já carregados
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

    const clearData = useCallback(() => {
        setLoadedNfes([]);
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
        </div>
    );
}