"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
    title: string;
    children: React.ReactNode;
    fullWidth?: boolean;
}

export function AppLayout({ title, children, fullWidth = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className={cn("w-full flex justify-between items-center mb-8", fullWidth ? "px-4" : "max-w-6xl")}>
        <div className="flex items-center gap-4">
           <Sidebar />
           <Link href="/" passHref>
             <Button variant="outline" size="icon" aria-label="Voltar para o Dashboard">
                <Home className="h-5 w-5" />
             </Button>
           </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            {title}
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className={cn("w-full", fullWidth ? "" : "max-w-6xl")}>
        {children}
      </main>

      <footer className={cn("w-full mt-12 text-center text-muted-foreground text-sm", fullWidth ? "" : "max-w-6xl")}>
        <p>Feito com ❤️ para ajudar investidores.</p>
      </footer>
    </div>
  );
}
