
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar } from 'lucide-react';
import { FormaPagamento } from '../types/simulador';

interface CronogramaRecebimentoProps {
  formasPagamento: FormaPagamento[];
}

export const CronogramaRecebimento: React.FC<CronogramaRecebimentoProps> = ({
  formasPagamento
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const gerarCronograma = () => {
    const cronograma: Array<{
      data: string;
      descricao: string;
      valor: number;
      tipo: string;
      parcela?: string;
    }> = [];

    formasPagamento.forEach((forma) => {
      if (forma.tipo === 'ENTRADA') {
        // Entrada sempre é hoje
        const hoje = new Date().toISOString().split('T')[0];
        cronograma.push({
          data: hoje,
          descricao: 'Entrada (À vista)',
          valor: forma.valor,
          tipo: 'ENTRADA'
        });
      } else if (forma.tipo === 'FINANCEIRA' && forma.dataVencimento && forma.parcelas) {
        // Financeira - parcelas mensais a partir da data de vencimento
        const dataInicial = new Date(forma.dataVencimento);
        const valorParcela = forma.valor / forma.parcelas;
        
        for (let i = 0; i < forma.parcelas; i++) {
          const dataParce = new Date(dataInicial);
          dataParce.setMonth(dataParce.getMonth() + i);
          cronograma.push({
            data: dataParce.toISOString().split('T')[0],
            descricao: `Financeira - Parcela ${i + 1}/${forma.parcelas}`,
            valor: valorParcela,
            tipo: 'FINANCEIRA',
            parcela: `${i + 1}/${forma.parcelas}`
          });
        }
      } else if (forma.tipo === 'BOLETO' && forma.parcelas) {
        // Boleto - parcelas mensais a partir de hoje
        const hoje = new Date();
        const valorParcela = forma.valor / forma.parcelas;
        
        for (let i = 0; i < forma.parcelas; i++) {
          const dataParce = new Date(hoje);
          dataParce.setMonth(dataParce.getMonth() + i + 1); // Boleto começa no próximo mês
          cronograma.push({
            data: dataParce.toISOString().split('T')[0],
            descricao: `Boleto Loja - Parcela ${i + 1}/${forma.parcelas}`,
            valor: valorParcela,
            tipo: 'BOLETO',
            parcela: `${i + 1}/${forma.parcelas}`
          });
        }
      } else if (forma.tipo === 'CARTAO') {
        // Cartão - sempre antecipado (recebido hoje)
        const hoje = new Date().toISOString().split('T')[0];
        const descricao = forma.parcelas === 1 ? 
          'Cartão (À vista - Antecipado)' : 
          `Cartão ${forma.parcelas}x (Antecipado)`;
        
        cronograma.push({
          data: hoje,
          descricao,
          valor: forma.valorRecebido, // Valor já com descontos aplicados
          tipo: 'CARTAO'
        });
      }
    });

    // Ordenar por data
    return cronograma.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  };

  const cronograma = gerarCronograma();

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA':
        return 'bg-green-50 border-l-4 border-l-green-500';
      case 'FINANCEIRA':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      case 'CARTAO':
        return 'bg-purple-50 border-l-4 border-l-purple-500';
      case 'BOLETO':
        return 'bg-orange-50 border-l-4 border-l-orange-500';
      default:
        return '';
    }
  };

  if (cronograma.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          📅 Cronograma de Recebimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Descrição</TableHead>
                <TableHead className="font-semibold text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronograma.map((item, index) => (
                <TableRow key={index} className={getTipoColor(item.tipo)}>
                  <TableCell className="font-medium">
                    {formatDate(item.data)}
                  </TableCell>
                  <TableCell>{item.descricao}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.valor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Legenda de cores */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-green-500 rounded"></div>
            <span>Entrada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-blue-500 rounded"></div>
            <span>Financeira</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-purple-500 rounded"></div>
            <span>Cartão</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-orange-500 rounded"></div>
            <span>Boleto</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
