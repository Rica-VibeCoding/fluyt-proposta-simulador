
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EditValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: number;
  onSave: (newValue: number) => void;
  isPercentage?: boolean;
}

export const EditValueModal: React.FC<EditValueModalProps> = ({
  isOpen,
  onClose,
  title,
  currentValue,
  onSave,
  isPercentage = false
}) => {
  const [value, setValue] = useState(currentValue);

  const handleSave = () => {
    onSave(value);
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
              type="number"
              step={isPercentage ? "0.1" : "0.01"}
              value={value || ''}
              onChange={(e) => setValue(Number(e.target.value) || 0)}
              placeholder={isPercentage ? "Digite o novo percentual" : "Digite o novo valor"}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              Confirmar
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
