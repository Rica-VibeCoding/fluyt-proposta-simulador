'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Lock } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface EditValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: number;
  onSave: (newValue: number, shouldLock?: boolean) => void;
  isPercentage?: boolean;
  showLockOption?: boolean;
  isLocked?: boolean;
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
    inputMode: 'numeric',
    maxLength: 17,
  };
}

export const EditValueModal: React.FC<EditValueModalProps> = ({
  isOpen,
  onClose,
  title,
  currentValue,
  onSave,
  isPercentage = false,
  showLockOption = false,
  isLocked = false
}) => {
  const [value, setValue] = useState(currentValue);
  const [shouldLock, setShouldLock] = useState(isLocked);

  useEffect(() => {
    if (isOpen) {
      setValue(currentValue);
      setShouldLock(isLocked);
    }
  }, [isOpen, currentValue, isLocked]);

  // Usar input de moeda se não for percentual
  const currencyInput = useCurrencyInput(value, setValue);

  const handleSave = () => {
    onSave(value, showLockOption ? shouldLock : undefined);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>
              Valor Atual: {isPercentage ? formatPercentage(currentValue) : formatCurrency(currentValue)}
            </Label>
          </div>
          <div className="space-y-2">
            <Label>
              {isPercentage ? 'Novo Percentual (%)' : 'Novo Valor (R$)'}
            </Label>
            <Input
              type={isPercentage ? "number" : "text"}
              step={isPercentage ? "0.1" : undefined}
              value={isPercentage ? value : currencyInput.value}
              onChange={isPercentage ? (e) => setValue(Number(e.target.value) || 0) : currencyInput.onChange}
              onFocus={isPercentage ? undefined : currencyInput.onFocus}
              inputMode={isPercentage ? undefined : "numeric"}
              maxLength={isPercentage ? undefined : 17}
              placeholder={isPercentage ? "Digite o novo percentual" : "Digite o novo valor"}
            />
          </div>
          
          {showLockOption && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={shouldLock}
                    onCheckedChange={setShouldLock}
                  />
                  <div>
                    <Label className="font-medium">Travar {title}</Label>
                    <p className="text-sm text-gray-600">
                      {shouldLock 
                        ? `Valor fixo em ${isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value)}`
                        : 'Valor será recalculado automaticamente'
                      }
                    </p>
                  </div>
                </div>
                {shouldLock && (
                  <div className="px-2 py-1 bg-blue-100 rounded text-blue-800 text-sm font-semibold flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    FIXO
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {showLockOption && shouldLock ? 'Confirmar e Travar' : 'Confirmar'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
