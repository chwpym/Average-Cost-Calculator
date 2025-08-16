
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Calculator, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalculatorView } from "@/app/page";

interface SidebarNavProps {
    activeView: CalculatorView;
    setActiveView: (view: CalculatorView) => void;
}

const navItems = [
    { id: 'average-price', label: 'Preço Médio', icon: Calculator },
    { id: 'financial-calculators', label: 'Outras Calculadoras', icon: Landmark },
];

export function SidebarNav({ activeView, setActiveView }: SidebarNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Calculadoras</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => (
            <SheetClose asChild key={item.id}>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-base",
                        activeView === item.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => setActiveView(item.id as CalculatorView)}
                >
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                </Button>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
