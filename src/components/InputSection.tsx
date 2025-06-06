'use client';

import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

interface InputSectionProps {
  valorBruto: number;
  desconto: number;
  valorNegociado: number;
  onValorBrutoChange: (valor: number) => void;
  onDescontoChange: (desconto: number) => void;
  onAtualizarSimulacao: () => void;
}

function useCurrencyInput(initialValue: number, onChange: (value: number) => void) {
  const [display, setDisplay] = useState(
    initialValue > 0
      ? initialValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''
  );
  const [raw, setRaw] = useState(
    initialValue > 0 ? String(Math.round(initialValue * 100)) : ''
  );

  useEffect(() => {
    if (initialValue > 0) {
      const centavos = Math.round(initialValue * 100);
      setRaw(String(centavos));
      setDisplay((centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
      setRaw('');
      setDisplay('');
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/\D/g, '');
    setRaw(onlyNums);
    const valor = onlyNums ? parseInt(onlyNums, 10) : 0;
    const valorFloat = valor / 100;
    setDisplay(
      valorFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    onChange(valorFloat);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!raw) setDisplay('');
  };

  return {
    value: display,
    onChange: handleChange,
    onFocus: handleFocus,
    inputMode: 'numeric' as const,
    maxLength: 17,
  };
}

export const InputSection: React.FC<InputSectionProps> = ({
  valorBruto,
  desconto,
  valorNegociado,
  onValorBrutoChange,
  onDescontoChange,
  onAtualizarSimulacao
}) => {
  const valorBrutoInput = useCurrencyInput(valorBruto, onValorBrutoChange);
  return <section className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valorBruto">Valor dos Ambientes (R$)</Label>
          <Input id="valorBruto" type="text" {...valorBrutoInput} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="desconto">Desconto (%)</Label>
          <Input id="desconto" type="number" min="0" max="100" value={desconto || ''} onChange={e => onDescontoChange(Number(e.target.value) || 0)} />
        </div>
        
        <div className="space-y-2">
          <div className="h-6"></div>
          <Button 
            onClick={onAtualizarSimulacao}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>
    </section>;
};