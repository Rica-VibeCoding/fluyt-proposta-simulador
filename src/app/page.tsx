'use client';

import React, { useState } from 'react';
import { useSimulador } from '../hooks/useSimulador';
import { InputSection } from '../components/InputSection';
import { Dashboard } from '../components/Dashboard';
import { FormaPagamentoCard } from '../components/FormaPagamentoCard';
import { CronogramaRecebimento } from '../components/CronogramaRecebimento';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { FormaPagamento } from '../types/simulador';

type TipoFormaPagamento = 'ENTRADA' | 'FINANCEIRA' | 'CARTAO' | 'BOLETO';

interface NovaFormaState {
  tipo: TipoFormaPagamento;
  valor: number;
  parcelas: number;
  taxaJuros: number;
  deflacao: number;
  jurosAntecipacao: number;
  custoCapital: number;
  dataVencimento: string;
}

export default function Home() {
  const { 
    simulacao, 
    recalcularSimulacao, 
    adicionarForma, 
    removerForma, 
    limparFormas, 
    atualizarForma,
    alternarTravamentoForma,
    editarValorNegociado,
    editarValorBruto,
    editarDescontoReal
  } = useSimulador();
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoForma, setEditandoForma] = useState<FormaPagamento | null>(null);
  const [novaForma, setNovaForma] = useState<NovaFormaState>({
    tipo: 'ENTRADA',
    valor: 0,
    parcelas: 1,
    taxaJuros: 2.5,
    deflacao: 5,
    jurosAntecipacao: 1.99,
    custoCapital: 1.5,
    dataVencimento: ''
  });

  const resetForm = () => {
    setNovaForma({
      tipo: 'ENTRADA',
      valor: 0,
      parcelas: 1,
      taxaJuros: 2.5,
      deflacao: 5,
      jurosAntecipacao: 1.99,
      custoCapital: 1.5,
      dataVencimento: ''
    });
    setEditandoForma(null);
  };

  const handleEditarForma = (forma: FormaPagamento) => {
    setEditandoForma(forma);
    setNovaForma({
      tipo: forma.tipo,
      valor: forma.valor,
      parcelas: forma.parcelas || 1,
      taxaJuros: forma.taxaJuros || 2.5,
      deflacao: forma.deflacao || 5,
      jurosAntecipacao: forma.jurosAntecipacao || 1.99,
      custoCapital: forma.custoCapital || 1.5,
      dataVencimento: forma.dataVencimento || ''
    });
    setModalOpen(true);
  };

  const handleSubmitForma = () => {
    console.log('Submitting forma:', novaForma);
    
    if (novaForma.valor <= 0) {
      alert('Valor deve ser maior que zero');
      return;
    }

    if (novaForma.tipo === 'FINANCEIRA' && !novaForma.dataVencimento) {
      alert('Data de vencimento é obrigatória para financeiras');
      return;
    }

    const forma: Omit<FormaPagamento, 'id' | 'valorRecebido'> = {
      tipo: novaForma.tipo,
      valor: novaForma.valor,
      ...(novaForma.tipo === 'FINANCEIRA' && {
        parcelas: novaForma.parcelas,
        taxaJuros: novaForma.taxaJuros,
        dataVencimento: novaForma.dataVencimento
      }),
      ...(novaForma.tipo === 'CARTAO' && {
        parcelas: novaForma.parcelas,
        deflacao: novaForma.deflacao,
        jurosAntecipacao: novaForma.jurosAntecipacao
      }),
      ...(novaForma.tipo === 'BOLETO' && {
        parcelas: novaForma.parcelas,
        custoCapital: novaForma.custoCapital
      })
    };

    if (editandoForma) {
      atualizarForma(editandoForma.id, forma);
    } else {
      adicionarForma(forma);
    }
    
    setModalOpen(false);
    resetForm();
  };

  const handleOpenModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const renderParcelasInput = () => {
    if (novaForma.tipo === 'ENTRADA') return null;

    const getMinMax = () => {
      switch (novaForma.tipo) {
        case 'FINANCEIRA':
          return { min: 1, max: 24 };
        case 'BOLETO':
          return { min: 1, max: 24 };
        case 'CARTAO':
          return { min: 1, max: 24 };
        default:
          return { min: 1, max: 24 };
      }
    };

    const { min, max } = getMinMax();

    return (
      <div className="space-y-2">
        <Label>Parcelas</Label>
        <Input
          type="number"
          min={min}
          max={max}
          value={novaForma.parcelas || ''}
          onChange={(e) => setNovaForma(prev => ({ 
            ...prev, 
            parcelas: Math.min(max, Math.max(min, Number(e.target.value) || 1))
          }))}
          placeholder={`De ${min} a ${max}`}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧮 Simulador Financeiro de Proposta
          </h1>
          <p className="text-gray-600">Sistema de Validação - Fluyt</p>
        </header>

        {/* Input Section */}
        <InputSection
          valorBruto={simulacao.valorBruto}
          desconto={simulacao.desconto}
          valorNegociado={simulacao.valorNegociado}
          onValorBrutoChange={(valor) => recalcularSimulacao({ valorBruto: valor })}
          onDescontoChange={(desconto) => recalcularSimulacao({ desconto })}
          onAtualizarSimulacao={() => editarValorNegociado(simulacao.valorNegociado)}
        />

        {/* Dashboard com capacidade de edição */}
        <Dashboard
          valorBruto={simulacao.valorBruto}
          valorNegociado={simulacao.valorNegociado}
          descontoReal={simulacao.descontoReal}
          valorRecebidoTotal={simulacao.valorRecebidoTotal}
          valorRestante={simulacao.valorRestante}
          onEditValorNegociado={editarValorNegociado}
          onEditDescontoReal={editarDescontoReal}
          isDescontoRealLocked={simulacao.travamentos.descontoRealFixo}
        />

        {/* Formas de Pagamento */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">💳 Formas de Pagamento</CardTitle>
              <div className="flex gap-2">
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenModal} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Forma
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editandoForma ? 'Editar' : 'Adicionar'} Forma de Pagamento
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select 
                          value={novaForma.tipo} 
                          onValueChange={(value: TipoFormaPagamento) => 
                            setNovaForma(prev => ({ ...prev, tipo: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ENTRADA">Entrada (À vista)</SelectItem>
                            <SelectItem value="FINANCEIRA">Financeira</SelectItem>
                            <SelectItem value="CARTAO">Cartão</SelectItem>
                            <SelectItem value="BOLETO">Boleto Loja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          value={novaForma.valor || ''}
                          onChange={(e) => setNovaForma(prev => ({ 
                            ...prev, 
                            valor: Number(e.target.value) || 0
                          }))}
                        />
                      </div>

                      {renderParcelasInput()}

                      {novaForma.tipo === 'FINANCEIRA' && (
                        <>
                          <div className="space-y-2">
                            <Label>Taxa de Juros (% a.m.)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={novaForma.taxaJuros || ''}
                              onChange={(e) => setNovaForma(prev => ({ 
                                ...prev, 
                                taxaJuros: Number(e.target.value) || 0
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Data de Vencimento</Label>
                            <Input
                              type="date"
                              value={novaForma.dataVencimento}
                              onChange={(e) => setNovaForma(prev => ({ 
                                ...prev, 
                                dataVencimento: e.target.value
                              }))}
                            />
                          </div>
                        </>
                      )}

                      {novaForma.tipo === 'CARTAO' && (
                        <>
                          <div className="space-y-2">
                            <Label>Deflação (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={novaForma.deflacao || ''}
                              onChange={(e) => setNovaForma(prev => ({ 
                                ...prev, 
                                deflacao: Number(e.target.value) || 0
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Juros de Antecipação (% por parcela)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={novaForma.jurosAntecipacao || ''}
                              onChange={(e) => setNovaForma(prev => ({ 
                                ...prev, 
                                jurosAntecipacao: Number(e.target.value) || 0
                              }))}
                            />
                          </div>
                        </>
                      )}

                      {novaForma.tipo === 'BOLETO' && (
                        <div className="space-y-2">
                          <Label>Custo de Capital (% a.m.)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={novaForma.custoCapital || ''}
                            onChange={(e) => setNovaForma(prev => ({ 
                              ...prev, 
                              custoCapital: Number(e.target.value) || 0
                            }))}
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmitForma}>
                          {editandoForma ? 'Salvar' : 'Adicionar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {simulacao.formasPagamento.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={limparFormas}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Tudo
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {simulacao.formasPagamento.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma forma de pagamento adicionada</p>
                <p className="text-sm">Clique em "Adicionar Forma" para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {simulacao.formasPagamento.map((forma) => (
                  <FormaPagamentoCard
                    key={forma.id}
                    forma={forma}
                    onRemover={removerForma}
                    onEditar={handleEditarForma}
                    onAlternarTravamento={alternarTravamentoForma}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cronograma de Recebimento */}
        <CronogramaRecebimento formasPagamento={simulacao.formasPagamento} />
      </div>
    </div>
  );
} 