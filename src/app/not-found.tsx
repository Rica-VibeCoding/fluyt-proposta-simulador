'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-4">
          <div className="text-6xl font-bold text-gray-300">404</div>
          <h1 className="text-2xl font-bold text-gray-800">Página não encontrada</h1>
          <p className="text-gray-600">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Ir para o Simulador
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
} 