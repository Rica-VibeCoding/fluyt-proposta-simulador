import { useState, useCallback } from 'react';
import { FormaPagamento, Simulacao, TravamentoConfig } from '../types/simulador';

export const useSimulador = () => {
  const [simulacao, setSimulacao] = useState<Simulacao>({
    valorBruto: 0,
    desconto: 0,
    valorNegociado: 0,
    formasPagamento: [],
    valorRecebidoTotal: 0,
    descontoReal: 0,
    valorRestante: 0,
    travamentos: {
      valorNegociado: false,
      descontoReal: false,
      limiteDescontoReal: 25
    }
  });

  // Prioridade para redistribuição de valores
  const PRIORIDADE_FORMAS = ['ENTRADA', 'BOLETO', 'FINANCEIRA', 'CARTAO'];

  const calcularValorRecebidoForma = useCallback((forma: FormaPagamento): number => {
    console.log('Calculando valor recebido para:', forma);
    
    switch (forma.tipo) {
      case 'ENTRADA':
        return forma.valor;
      
      case 'FINANCEIRA':
        if (!forma.parcelas || !forma.taxaJuros) return forma.valor;
        const i = forma.taxaJuros / 100;
        const parcelas = forma.parcelas;
        const valorPresente = forma.valor / Math.pow(1 + i, parcelas);
        console.log(`Financeira: valor=${forma.valor}, parcelas=${parcelas}, taxa=${forma.taxaJuros}%, VP=${valorPresente}`);
        return valorPresente;
      
      case 'CARTAO':
        if (!forma.deflacao || !forma.jurosAntecipacao || !forma.parcelas) return forma.valor;
        const fatorDeflacao = 1 - (forma.deflacao / 100);
        const fatorJuros = 1 - (forma.jurosAntecipacao / 100 * forma.parcelas);
        const valorRecebido = forma.valor * fatorDeflacao * fatorJuros;
        console.log(`Cartão: valor=${forma.valor}, deflação=${forma.deflacao}%, juros=${forma.jurosAntecipacao}%, VR=${valorRecebido}`);
        return valorRecebido;
      
      case 'BOLETO':
        if (!forma.parcelas || !forma.custoCapital) return forma.valor;
        const ic = forma.custoCapital / 100;
        const valorPresenteBoleto = forma.valor / Math.pow(1 + ic, forma.parcelas);
        console.log(`Boleto: valor=${forma.valor}, parcelas=${forma.parcelas}, custo=${forma.custoCapital}%, VP=${valorPresenteBoleto}`);
        return valorPresenteBoleto;
      
      default:
        return forma.valor;
    }
  }, []);

  const redistribuirValores = useCallback((novoValorNegociado: number, formasAtuais: FormaPagamento[]) => {
    console.log('Redistribuindo valores. Novo valor negociado:', novoValorNegociado);
    
    const somaAtual = formasAtuais.reduce((acc, forma) => acc + forma.valor, 0);
    const diferenca = novoValorNegociado - somaAtual;
    
    if (Math.abs(diferenca) < 0.01) {
      return formasAtuais; // Não há diferença significativa
    }
    
    console.log('Diferença a redistribuir:', diferenca);
    
    // Separar formas travadas e não travadas
    const formasTravadas = formasAtuais.filter(forma => forma.travado);
    const formasNaoTravadas = formasAtuais.filter(forma => !forma.travado);
    
    // Se todas estão travadas, não podemos redistribuir
    if (formasNaoTravadas.length === 0) {
      console.log('Todas as formas estão travadas');
      return null; // Indica erro
    }
    
    // Ordenar formas não travadas por prioridade
    const formasOrdenadas = formasNaoTravadas.sort((a, b) => {
      const prioridadeA = PRIORIDADE_FORMAS.indexOf(a.tipo);
      const prioridadeB = PRIORIDADE_FORMAS.indexOf(b.tipo);
      return prioridadeA - prioridadeB;
    });
    
    console.log('Formas ordenadas por prioridade:', formasOrdenadas.map(f => f.tipo));
    
    // Redistribuir a diferença proporcionalmente ou pela primeira forma disponível
    const novasFormas = [...formasAtuais];
    
    if (formasOrdenadas.length === 1) {
      // Se só há uma forma não travada, ela absorve toda a diferença
      const formaIndex = novasFormas.findIndex(f => f.id === formasOrdenadas[0].id);
      const novoValor = Math.max(0, novasFormas[formaIndex].valor + diferenca);
      novasFormas[formaIndex] = { ...novasFormas[formaIndex], valor: novoValor };
    } else {
      // Distribuir proporcionalmente entre as formas não travadas
      const somaFormasNaoTravadas = formasOrdenadas.reduce((acc, forma) => acc + forma.valor, 0);
      
      if (somaFormasNaoTravadas > 0) {
        formasOrdenadas.forEach(forma => {
          const proporcao = forma.valor / somaFormasNaoTravadas;
          const ajuste = diferenca * proporcao;
          const formaIndex = novasFormas.findIndex(f => f.id === forma.id);
          const novoValor = Math.max(0, forma.valor + ajuste);
          novasFormas[formaIndex] = { ...novasFormas[formaIndex], valor: novoValor };
        });
      } else {
        // Se todas as formas não travadas têm valor 0, distribui igualmente
        const ajustePorForma = diferenca / formasOrdenadas.length;
        formasOrdenadas.forEach(forma => {
          const formaIndex = novasFormas.findIndex(f => f.id === forma.id);
          const novoValor = Math.max(0, ajustePorForma);
          novasFormas[formaIndex] = { ...novasFormas[formaIndex], valor: novoValor };
        });
      }
    }
    
    return novasFormas;
  }, []);

  const recalcularSimulacao = useCallback((updates: Partial<Simulacao>) => {
    console.log('Recalculando simulação com updates:', updates);
    
    setSimulacao(prev => {
      const updated = { ...prev, ...updates };
      
      // Lógica de travamento do valor negociado
      if (updated.travamentos.valorNegociado) {
        // Se valor negociado está travado, ajusta o desconto quando valor bruto muda
        if (updates.valorBruto !== undefined && updates.valorBruto > 0) {
          updated.desconto = ((updated.valorBruto - updated.valorNegociado) / updated.valorBruto) * 100;
        }
      } else {
        // Comportamento normal: calcula valor negociado baseado no desconto
        updated.valorNegociado = updated.valorBruto * (1 - updated.desconto / 100);
      }
      
      updated.formasPagamento = updated.formasPagamento.map(forma => ({
        ...forma,
        valorRecebido: calcularValorRecebidoForma(forma)
      }));
      
      updated.valorRecebidoTotal = updated.formasPagamento.reduce((acc, forma) => acc + forma.valorRecebido, 0);
      updated.descontoReal = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorRecebidoTotal) / updated.valorBruto) * 100 : 0;
      
      const somaFormas = updated.formasPagamento.reduce((acc, forma) => acc + forma.valor, 0);
      updated.valorRestante = updated.valorNegociado - somaFormas;
      
      console.log('Simulação atualizada:', updated);
      return updated;
    });
  }, [calcularValorRecebidoForma]);

  const editarValorNegociado = useCallback((novoValor: number) => {
    console.log('Editando valor negociado para:', novoValor);
    
    setSimulacao(prev => {
      const formasRedistribuidas = redistribuirValores(novoValor, prev.formasPagamento);
      
      if (!formasRedistribuidas) {
        alert('Não é possível alterar o valor. Todas as formas de pagamento estão travadas.');
        return prev;
      }
      
      const updated = {
        ...prev,
        valorNegociado: novoValor,
        formasPagamento: formasRedistribuidas.map(forma => ({
          ...forma,
          valorRecebido: calcularValorRecebidoForma(forma)
        }))
      };
      
      // Recalcular desconto
      updated.desconto = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorNegociado) / updated.valorBruto) * 100 : 0;
      
      updated.valorRecebidoTotal = updated.formasPagamento.reduce((acc, forma) => acc + forma.valorRecebido, 0);
      updated.descontoReal = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorRecebidoTotal) / updated.valorBruto) * 100 : 0;
      
      const somaFormas = updated.formasPagamento.reduce((acc, forma) => acc + forma.valor, 0);
      updated.valorRestante = updated.valorNegociado - somaFormas;
      
      return updated;
    });
  }, [redistribuirValores, calcularValorRecebidoForma]);

  const editarDescontoReal = useCallback((novoDesconto: number) => {
    console.log('Editando desconto real para:', novoDesconto);
    
    setSimulacao(prev => {
      // Calcular novo valor negociado baseado no desconto
      const novoValorNegociado = prev.valorBruto * (1 - novoDesconto / 100);
      
      const formasRedistribuidas = redistribuirValores(novoValorNegociado, prev.formasPagamento);
      
      if (!formasRedistribuidas) {
        alert('Não é possível alterar o desconto. Todas as formas de pagamento estão travadas.');
        return prev;
      }
      
      const updated = {
        ...prev,
        desconto: novoDesconto,
        valorNegociado: novoValorNegociado,
        formasPagamento: formasRedistribuidas.map(forma => ({
          ...forma,
          valorRecebido: calcularValorRecebidoForma(forma)
        }))
      };
      
      updated.valorRecebidoTotal = updated.formasPagamento.reduce((acc, forma) => acc + forma.valorRecebido, 0);
      updated.descontoReal = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorRecebidoTotal) / updated.valorBruto) * 100 : 0;
      
      const somaFormas = updated.formasPagamento.reduce((acc, forma) => acc + forma.valor, 0);
      updated.valorRestante = updated.valorNegociado - somaFormas;
      
      return updated;
    });
  }, [redistribuirValores, calcularValorRecebidoForma]);

  const editarValorBruto = useCallback((novoValor: number) => {
    console.log('Editando valor bruto para:', novoValor);
    recalcularSimulacao({ valorBruto: novoValor });
  }, [recalcularSimulacao]);

  const adicionarForma = useCallback((forma: Omit<FormaPagamento, 'id' | 'valorRecebido'>) => {
    console.log('Adicionando forma:', forma);
    
    setSimulacao(prev => {
      // Verificar travamento de desconto real
      if (prev.travamentos.descontoReal) {
        const novaFormaTemp: FormaPagamento = {
          ...forma,
          id: Date.now().toString(),
          valorRecebido: 0
        };
        novaFormaTemp.valorRecebido = calcularValorRecebidoForma(novaFormaTemp);
        
        const novoValorRecebidoTotal = prev.valorRecebidoTotal + novaFormaTemp.valorRecebido;
        const novoDescontoReal = prev.valorBruto > 0 ? ((prev.valorBruto - novoValorRecebidoTotal) / prev.valorBruto) * 100 : 0;
        
        if (novoDescontoReal > prev.travamentos.limiteDescontoReal) {
          alert(`Não é possível adicionar esta forma. O desconto real excederia o limite de ${prev.travamentos.limiteDescontoReal}%`);
          return prev;
        }
      }
      
      const novaForma: FormaPagamento = {
        ...forma,
        id: Date.now().toString(),
        valorRecebido: 0,
        travado: false
      };
      
      novaForma.valorRecebido = calcularValorRecebidoForma(novaForma);
      
      const novasFormas = [...prev.formasPagamento, novaForma];
      const updated = { ...prev, formasPagamento: novasFormas };
      
      updated.valorRecebidoTotal = novasFormas.reduce((acc, f) => acc + f.valorRecebido, 0);
      updated.descontoReal = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorRecebidoTotal) / updated.valorBruto) * 100 : 0;
      
      const somaFormas = novasFormas.reduce((acc, f) => acc + f.valor, 0);
      updated.valorRestante = updated.valorNegociado - somaFormas;
      
      console.log('Nova simulação com forma adicionada:', updated);
      return updated;
    });
  }, [calcularValorRecebidoForma]);

  const atualizarForma = useCallback((id: string, dadosAtualizados: Omit<FormaPagamento, 'id' | 'valorRecebido'>) => {
    console.log('Atualizando forma:', id, dadosAtualizados);
    
    setSimulacao(prev => {
      const novasFormas = prev.formasPagamento.map(forma => {
        if (forma.id === id) {
          // Se a forma está travada, não permite alterar o valor
          if (forma.travado && dadosAtualizados.valor !== forma.valor) {
            console.log('Forma travada, não é possível alterar o valor');
            return forma;
          }
          
          const formaAtualizada = { ...forma, ...dadosAtualizados };
          formaAtualizada.valorRecebido = calcularValorRecebidoForma(formaAtualizada);
          return formaAtualizada;
        }
        return forma;
      });

      const updated = { ...prev, formasPagamento: novasFormas };
      
      updated.valorRecebidoTotal = novasFormas.reduce((acc, f) => acc + f.valorRecebido, 0);
      updated.descontoReal = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorRecebidoTotal) / updated.valorBruto) * 100 : 0;
      
      const somaFormas = novasFormas.reduce((acc, f) => acc + f.valor, 0);
      updated.valorRestante = updated.valorNegociado - somaFormas;
      
      console.log('Simulação atualizada após edição:', updated);
      return updated;
    });
  }, [calcularValorRecebidoForma]);

  const removerForma = useCallback((id: string) => {
    console.log('Removendo forma:', id);
    
    setSimulacao(prev => {
      const novasFormas = prev.formasPagamento.filter(f => f.id !== id);
      return {
        ...prev,
        formasPagamento: novasFormas,
        valorRecebidoTotal: novasFormas.reduce((acc, f) => acc + f.valorRecebido, 0),
        descontoReal: prev.valorBruto > 0 ? ((prev.valorBruto - novasFormas.reduce((acc, f) => acc + f.valorRecebido, 0)) / prev.valorBruto) * 100 : 0,
        valorRestante: prev.valorNegociado - novasFormas.reduce((acc, f) => acc + f.valor, 0)
      };
    });
  }, []);

  const limparFormas = useCallback(() => {
    console.log('Limpando todas as formas');
    setSimulacao(prev => ({
      ...prev,
      formasPagamento: [],
      valorRecebidoTotal: 0,
      descontoReal: prev.valorBruto > 0 ? 100 : 0,
      valorRestante: prev.valorNegociado
    }));
  }, []);

  const alternarTravamento = useCallback((tipo: keyof TravamentoConfig, valor?: number) => {
    setSimulacao(prev => ({
      ...prev,
      travamentos: {
        ...prev.travamentos,
        [tipo]: !prev.travamentos[tipo],
        ...(valor !== undefined && { limiteDescontoReal: valor })
      }
    }));
  }, []);

  const alternarTravamentoForma = useCallback((id: string) => {
    setSimulacao(prev => ({
      ...prev,
      formasPagamento: prev.formasPagamento.map(forma => 
        forma.id === id ? { ...forma, travado: !forma.travado } : forma
      )
    }));
  }, []);

  return {
    simulacao,
    recalcularSimulacao,
    adicionarForma,
    atualizarForma,
    removerForma,
    limparFormas,
    alternarTravamento,
    alternarTravamentoForma,
    editarValorNegociado,
    editarValorBruto,
    editarDescontoReal
  };
};
