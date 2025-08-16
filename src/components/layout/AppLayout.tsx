"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
    title: string;
    children: React.ReactNode;
}

export function AppLayout({ title, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
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

      <main className="w-full max-w-6xl">
        {children}
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-muted-foreground text-sm">
        <p>Feito com ❤️ para ajudar investidores.</p>
      </footer>
    </div>
  );
}
