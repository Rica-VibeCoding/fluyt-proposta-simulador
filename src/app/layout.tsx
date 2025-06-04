'use client';

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "@/index.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Criar QueryClient usando useState para evitar problemas de hidratação
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="pt-BR">
      <head>
        <title>🧮 Simulador Financeiro de Proposta - Fluyt</title>
        <meta name="description" content="Sistema de Validação - Fluyt" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
} 