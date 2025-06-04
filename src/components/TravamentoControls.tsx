
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock } from 'lucide-react';
import { TravamentoConfig } from '../types/simulador';

interface TravamentoControlsProps {
  travamentos: TravamentoConfig;
  valorNegociado: number;
  descontoReal: number;
  onAlternarTravamento: (tipo: keyof TravamentoConfig, valor?: number) => void;
}

export const TravamentoControls: React.FC<TravamentoControlsProps> = ({
  travamentos,
  valorNegociado,
  descontoReal,
  onAlternarTravamento
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Lock className="h-5 w-5" />
          🔒 Sistema de Travamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Travamento Valor Negociado */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Switch
                checked={travamentos.valorNegociado}
                onCheckedChange={() => onAlternarTravamento('valorNegociado')}
              />
              <div>
                <Label className="font-medium">Travar Valor Final</Label>
                <p className="text-sm text-gray-600">
                  {travamentos.valorNegociado ? 
                    `Valor fixo: ${formatCurrency(valorNegociado)}` : 
                    'Valor será recalculado automaticamente'
                  }
                </p>
              </div>
            </div>
          </div>
          {travamentos.valorNegociado && (
            <div className="px-3 py-2 bg-green-100 rounded-lg">
              <span className="text-green-800 font-semibold">
                {formatCurrency(valorNegociado)}
              </span>
            </div>
          )}
        </div>

        {/* Travamento Desconto Real */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Switch
                checked={travamentos.descontoReal}
                onCheckedChange={() => onAlternarTravamento('descontoReal')}
              />
              <div>
                <Label className="font-medium">Travar Desconto Real</Label>
                <p className="text-sm text-gray-600">
                  {travamentos.descontoReal ? 
                    `Limite: ${travamentos.limiteDescontoReal}% (Atual: ${descontoReal.toFixed(1)}%)` : 
                    'Sem limite de desconto'
                  }
                </p>
              </div>
            </div>
          </div>
          {travamentos.descontoReal && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Limite:</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={travamentos.limiteDescontoReal}
                onChange={(e) => onAlternarTravamento('limiteDescontoReal', Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm font-medium">%</span>
            </div>
          )}
        </div>

        {/* Travamento Desconto Real Fixo */}
        {travamentos.descontoRealFixo && (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-300">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-white" />
                </div>
                <div>
                  <Label className="font-medium text-blue-800">Desconto Real Travado</Label>
                  <p className="text-sm text-blue-600">
                    Fixado em {travamentos.valorDescontoRealFixo.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="px-3 py-2 bg-blue-100 rounded-lg">
              <span className="text-blue-800 font-semibold">
                {travamentos.valorDescontoRealFixo.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
