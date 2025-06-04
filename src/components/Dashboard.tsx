import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Edit } from 'lucide-react';
import { EditValueModal } from './EditValueModal';
interface DashboardProps {
  valorBruto: number;
  valorNegociado: number;
  descontoReal: number;
  valorRecebidoTotal: number;
  valorRestante: number;
  onEditValorNegociado?: (novoValor: number) => void;
  onEditDescontoReal?: (novoDesconto: number) => void;
}
export const Dashboard: React.FC<DashboardProps> = ({
  valorBruto,
  valorNegociado,
  descontoReal,
  valorRecebidoTotal,
  valorRestante,
  onEditValorNegociado,
  onEditDescontoReal
}) => {
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    currentValue: number;
    onSave: (value: number) => void;
    isPercentage?: boolean;
  }>({
    isOpen: false,
    title: '',
    currentValue: 0,
    onSave: () => {},
    isPercentage: false
  });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const getStatusColor = (desconto: number) => {
    if (desconto < 15) return 'text-green-600';
    if (desconto < 25) return 'text-yellow-600';
    return 'text-red-600';
  };
  const openEditModal = (title: string, currentValue: number, onSave: (value: number) => void, isPercentage = false) => {
    setModalConfig({
      isOpen: true,
      title,
      currentValue,
      onSave,
      isPercentage
    });
  };
  const closeModal = () => {
    setModalConfig(prev => ({
      ...prev,
      isOpen: false
    }));
  };
  return <>
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor dos Ambientes </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorBruto)}</div>
            <p className="text-xs text-gray-500">100%</p>
          </CardContent>
        </Card>

        <Card className="relative group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Valor Negociado</CardTitle>
              {onEditValorNegociado && <Button variant="ghost" size="sm" onClick={() => openEditModal('Valor Negociado', valorNegociado, onEditValorNegociado)} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="h-3 w-3" />
                </Button>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorNegociado)}</div>
            <p className="text-xs text-gray-500">
              {valorBruto > 0 ? (valorNegociado / valorBruto * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 relative group">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Desconto Real</CardTitle>
              {onEditDescontoReal && <Button variant="ghost" size="sm" onClick={() => openEditModal('Desconto Real', descontoReal, onEditDescontoReal, true)} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="h-3 w-3" />
                </Button>}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(descontoReal)}`}>
              {descontoReal.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">
              {descontoReal < 15 ? 'Ótimo' : descontoReal < 25 ? 'Moderado' : 'Alto'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorRecebidoTotal)}</div>
            <p className="text-xs text-gray-500">Líquido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Restante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorRestante)}</div>
            <p className="text-xs text-gray-500">Alocar</p>
          </CardContent>
        </Card>
      </div>

      <EditValueModal isOpen={modalConfig.isOpen} onClose={closeModal} title={modalConfig.title} currentValue={modalConfig.currentValue} onSave={modalConfig.onSave} isPercentage={modalConfig.isPercentage} />
    </>;
};