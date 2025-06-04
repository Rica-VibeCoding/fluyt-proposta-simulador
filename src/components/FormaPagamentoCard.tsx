
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { X, Edit, Lock } from 'lucide-react';
import { FormaPagamento } from '../types/simulador';

interface FormaPagamentoCardProps {
  forma: FormaPagamento;
  onRemover: (id: string) => void;
  onEditar: (forma: FormaPagamento) => void;
  onAlternarTravamento: (id: string) => void;
}

export const FormaPagamentoCard: React.FC<FormaPagamentoCardProps> = ({
  forma,
  onRemover,
  onEditar,
  onAlternarTravamento
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      ENTRADA: 'Entrada (À vista)',
      FINANCEIRA: 'Financeira',
      CARTAO: 'Cartão',
      BOLETO: 'Boleto Loja'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const baseColor = forma.travado ? 'border-l-4 bg-gray-100' : 'border-l-4';
    switch (tipo) {
      case 'ENTRADA':
        return `${baseColor} border-l-green-500 ${!forma.travado ? 'bg-green-50' : ''}`;
      case 'FINANCEIRA':
        return `${baseColor} border-l-blue-500 ${!forma.travado ? 'bg-blue-50' : ''}`;
      case 'CARTAO':
        return `${baseColor} border-l-purple-500 ${!forma.travado ? 'bg-purple-50' : ''}`;
      case 'BOLETO':
        return `${baseColor} border-l-orange-500 ${!forma.travado ? 'bg-orange-50' : ''}`;
      default:
        return baseColor;
    }
  };

  const getDetalhes = () => {
    switch (forma.tipo) {
      case 'FINANCEIRA':
        const detalhesFinanceira = `${forma.parcelas}x - ${forma.taxaJuros}% a.m.`;
        return forma.dataVencimento ? 
          `${detalhesFinanceira} - Venc: ${formatDate(forma.dataVencimento)}` : 
          detalhesFinanceira;
      case 'CARTAO':
        return `${forma.parcelas}x - ${forma.deflacao}% deflação`;
      case 'BOLETO':
        return `${forma.parcelas}x - ${forma.custoCapital}% custo`;
      default:
        return 'À vista';
    }
  };

  return (
    <Card className={`relative ${getTipoColor(forma.tipo)}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getTipoLabel(forma.tipo)}
            {forma.travado && <Lock className="h-3 w-3 text-gray-500" />}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditar(forma)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
              title="Editar"
              disabled={forma.travado}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemover(forma.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              title="Remover"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className={`text-lg font-bold ${forma.travado ? 'text-gray-600' : ''}`}>
              {formatCurrency(forma.valor)}
            </div>
            <div className="text-sm text-gray-600">{getDetalhes()}</div>
          </div>
          <div className="border-t pt-2">
            <div className="text-sm text-gray-500">Valor Recebido:</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(forma.valorRecebido)}
            </div>
          </div>
          
          {/* Controle de Travamento */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={forma.travado || false}
                  onCheckedChange={() => onAlternarTravamento(forma.id)}
                />
                <Label className="text-xs font-medium">
                  {forma.travado ? 'Valor Travado' : 'Travar Valor'}
                </Label>
              </div>
              {forma.travado && (
                <span className="text-xs text-orange-600 font-medium">
                  FIXO
                </span>
              )}
            </div>
            {forma.travado && (
              <p className="text-xs text-gray-500 mt-1">
                Valor confirmado pelo cliente
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
