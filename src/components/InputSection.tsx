import React from 'react';
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

export const InputSection: React.FC<InputSectionProps> = ({
  valorBruto,
  desconto,
  valorNegociado,
  onValorBrutoChange,
  onDescontoChange,
  onAtualizarSimulacao
}) => {
  return <section className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valorBruto">Valor dos Ambientes (R$)</Label>
          <Input id="valorBruto" type="number" placeholder="50000" value={valorBruto || ''} onChange={e => onValorBrutoChange(Number(e.target.value) || 0)} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="desconto">Desconto (%)</Label>
          <Input id="desconto" type="number" placeholder="20" min="0" max="100" value={desconto || ''} onChange={e => onDescontoChange(Number(e.target.value) || 0)} />
        </div>
        
        <div className="space-y-2">
          <Label>Valor Negociado: R$ {valorNegociado.toFixed(2).replace('.', ',')}</Label>
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