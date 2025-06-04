import { useState, useCallback, useMemo } from 'react';
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
      limiteDescontoReal: 25,
      descontoRealFixo: false,
      valorDescontoRealFixo: 0
    }
  });

  // Prioridade para redistribuição de valores
  const PRIORIDADE_FORMAS = useMemo(() => ['ENTRADA', 'BOLETO', 'FINANCEIRA', 'CARTAO'], []);

  const calcularValorRecebidoForma = useCallback((forma: FormaPagamento): number => {
    console.log('Calculando valor recebido para:', forma);
    
    switch (forma.tipo) {
      case 'ENTRADA':
        return forma.valor;
      
      case 'FINANCEIRA': {
        if (!forma.parcelas || !forma.taxaJuros) return forma.valor;
        const i = forma.taxaJuros / 100;
        const parcelas = forma.parcelas;
        const valorPresente = forma.valor / Math.pow(1 + i, parcelas);
        console.log(`Financeira: valor=${forma.valor}, parcelas=${parcelas}, taxa=${forma.taxaJuros}%, VP=${valorPresente}`);
        return valorPresente;
      }
      
      case 'CARTAO': {
        if (!forma.deflacao || !forma.jurosAntecipacao || !forma.parcelas) return forma.valor;
        const fatorDeflacao = 1 - (forma.deflacao / 100);
        const fatorJuros = 1 - (forma.jurosAntecipacao / 100 * forma.parcelas);
        const valorRecebido = forma.valor * fatorDeflacao * fatorJuros;
        console.log(`Cartão: valor=${forma.valor}, deflação=${forma.deflacao}%, juros=${forma.jurosAntecipacao}%, VR=${valorRecebido}`);
        return valorRecebido;
      }
      
      case 'BOLETO': {
        if (!forma.parcelas || !forma.custoCapital) return forma.valor;
        const ic = forma.custoCapital / 100;
        const valorPresenteBoleto = forma.valor / Math.pow(1 + ic, forma.parcelas);
        console.log(`Boleto: valor=${forma.valor}, parcelas=${forma.parcelas}, custo=${forma.custoCapital}%, VP=${valorPresenteBoleto}`);
        return valorPresenteBoleto;
      }
      
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
    
    // Redistribuir a diferença: apenas a primeira forma na ordem de prioridade absorve toda a diferença
    const novasFormas = [...formasAtuais];
    
    // Verificar se todas as formas não travadas têm valor zero
    const somaFormasNaoTravadas = formasOrdenadas.reduce((acc, forma) => acc + forma.valor, 0);
    
    if (somaFormasNaoTravadas === 0) {
      // Se todas as formas não travadas têm valor 0, distribui igualmente
      console.log('Todas as formas não travadas têm valor zero, distribuindo igualmente');
      const ajustePorForma = diferenca / formasOrdenadas.length;
      formasOrdenadas.forEach(forma => {
        const formaIndex = novasFormas.findIndex(f => f.id === forma.id);
        const novoValor = ajustePorForma;
        novasFormas[formaIndex] = { ...novasFormas[formaIndex], valor: Math.max(0, novoValor) };
        console.log(`Forma ${forma.tipo} ajustada para: ${novoValor} (final: ${Math.max(0, novoValor)})`);
      });
    } else {
      // Apenas a primeira forma não travada na ordem de prioridade absorve toda a diferença
      console.log('Ajustando apenas a primeira forma na ordem de prioridade');
      const primeiraForma = formasOrdenadas[0];
      const formaIndex = novasFormas.findIndex(f => f.id === primeiraForma.id);
      const valorCalculado = primeiraForma.valor + diferenca;
      const novoValor = Math.max(0, valorCalculado);
      novasFormas[formaIndex] = { ...novasFormas[formaIndex], valor: novoValor };
      console.log(`Forma ${primeiraForma.tipo} ajustada de ${primeiraForma.valor} para ${valorCalculado} (final: ${novoValor})`);
      
      // Se o valor ficou negativo, indicar impossibilidade
      if (valorCalculado < 0) {
        console.log(`⚠️ Valor negativo detectado (${valorCalculado}), pode estar no limite de desconto real`);
      }
    }
    
    return novasFormas;
  }, [PRIORIDADE_FORMAS]);

  const recalcularSimulacao = useCallback((updates: Partial<Simulacao>) => {
    console.log('Recalculando simulação com updates:', updates);
    
    setSimulacao(prev => {
      const updated = { ...prev, ...updates };
      
      // Verificar se o desconto real está travado
      if (updated.travamentos.descontoRealFixo) {
        console.log(`Desconto real travado em ${updated.travamentos.valorDescontoRealFixo}%, mantendo fixo`);
        // Se desconto real está travado, não alterar - apenas manter o valor atual
        // A lógica específica será implementada nas outras funções
        return updated;
      }
      
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

  const editarDescontoReal = useCallback((novoDescontoReal: number, shouldLock?: boolean) => {
    console.log('Editando desconto real para:', novoDescontoReal, 'Travar:', shouldLock);
    
    setSimulacao(prev => {
      // Função auxiliar para calcular o desconto real dado um valor negociado
      const calcularDescontoRealParaValor = (valorNegociado: number): number => {
        const formasTemp = redistribuirValores(valorNegociado, prev.formasPagamento);
        if (!formasTemp) return -1; // Indica erro
        
        const valorRecebidoTemp = formasTemp.reduce((acc, forma) => {
          const formaComRecebido = { ...forma, valorRecebido: calcularValorRecebidoForma(forma) };
          return acc + formaComRecebido.valorRecebido;
        }, 0);
        
        return prev.valorBruto > 0 ? ((prev.valorBruto - valorRecebidoTemp) / prev.valorBruto) * 100 : 0;
      };
      
      // Busca binária para encontrar o valor negociado que resulta no desconto real desejado
      let valorMin = 0;
      let valorMax = prev.valorBruto;
      let valorNegociadoOtimo = prev.valorNegociado;
      let melhorDiferenca = Infinity;
      let melhorDesconto = prev.descontoReal;
      
      console.log(`🎯 Iniciando busca binária para desconto real: ${novoDescontoReal}%`);
      console.log(`Desconto real atual: ${prev.descontoReal}%`);
      console.log(`Intervalo inicial: ${valorMin} - ${valorMax}`);
      
      // Máximo de 25 iterações para maior precisão
      for (let i = 0; i < 25; i++) {
        const valorTeste = (valorMin + valorMax) / 2;
        const descontoRealCalculado = calcularDescontoRealParaValor(valorTeste);
        
        console.log(`Iteração ${i + 1}: valorTeste=${valorTeste.toFixed(2)}, desconto=${descontoRealCalculado.toFixed(2)}%`);
        
        if (descontoRealCalculado === -1) {
          // Erro na redistribuição, tentar valor maior
          console.log('❌ Erro na redistribuição, ajustando valor mínimo');
          valorMin = valorTeste;
          continue;
        }
        
        const diferenca = Math.abs(descontoRealCalculado - novoDescontoReal);
        
        // Se encontrou um resultado melhor, guardar
        if (diferenca < melhorDiferenca) {
          melhorDiferenca = diferenca;
          valorNegociadoOtimo = valorTeste;
          melhorDesconto = descontoRealCalculado;
          console.log(`✅ Novo melhor resultado: desconto=${melhorDesconto.toFixed(2)}%, diferença=${melhorDiferenca.toFixed(2)}`);
        }
        
        // Se a diferença é muito pequena, parar
        if (diferenca < 0.05) {
          console.log(`🎯 Precisão atingida! Parando busca.`);
          break;
        }
        
        // Detectar se estamos no limite físico
        if (i > 10 && melhorDiferenca > 2) {
          console.log(`⚠️ Possível limite físico detectado. Melhor desconto possível: ${melhorDesconto.toFixed(2)}%`);
          break;
        }
        
        // Ajustar os limites da busca
        if (descontoRealCalculado < novoDescontoReal) {
          // Desconto calculado é menor que o desejado, precisamos diminuir valor negociado
          valorMax = valorTeste;
          console.log(`📉 Desconto baixo (${descontoRealCalculado.toFixed(2)}% < ${novoDescontoReal}%), diminuindo valorMax para ${valorMax.toFixed(2)}`);
        } else {
          // Desconto calculado é maior que o desejado, precisamos aumentar valor negociado
          valorMin = valorTeste;
          console.log(`📈 Desconto alto (${descontoRealCalculado.toFixed(2)}% > ${novoDescontoReal}%), aumentando valorMin para ${valorMin.toFixed(2)}`);
        }
        
        // Verificar se o intervalo ficou muito pequeno
        if (Math.abs(valorMax - valorMin) < 100) {
          console.log(`🔍 Intervalo muito pequeno (${Math.abs(valorMax - valorMin).toFixed(2)}), finalizando busca`);
          break;
        }
      }
      
      console.log(`🏁 Busca finalizada:`);
      console.log(`   Valor negociado ótimo: ${valorNegociadoOtimo.toFixed(2)}`);
      console.log(`   Desconto real resultante: ${melhorDesconto.toFixed(2)}%`);
      console.log(`   Diferença do objetivo: ${melhorDiferenca.toFixed(2)}`);
      
      // Se a diferença ainda é muito grande, avisar o usuário
      if (melhorDiferenca > 1) {
        console.log(`⚠️ Não foi possível atingir exatamente ${novoDescontoReal}%. Melhor resultado: ${melhorDesconto.toFixed(1)}%`);
        const confirmar = confirm(`Não foi possível atingir exatamente ${novoDescontoReal}% de desconto real.\nMelhor resultado possível: ${melhorDesconto.toFixed(1)}%\n\nDeseja aplicar mesmo assim?`);
        if (!confirmar) {
          return prev;
        }
      }
      
      // Aplicar o valor negociado ótimo encontrado
      const formasRedistribuidas = redistribuirValores(valorNegociadoOtimo, prev.formasPagamento);
      
      if (!formasRedistribuidas) {
        alert('Não é possível alterar o desconto real. Todas as formas de pagamento estão travadas.');
        return prev;
      }
      
      const updated = {
        ...prev,
        valorNegociado: valorNegociadoOtimo,
        formasPagamento: formasRedistribuidas.map(forma => ({
          ...forma,
          valorRecebido: calcularValorRecebidoForma(forma)
        })),
        travamentos: {
          ...prev.travamentos,
          descontoRealFixo: shouldLock || false,
          valorDescontoRealFixo: shouldLock ? novoDescontoReal : prev.travamentos.valorDescontoRealFixo
        }
      };
      
      // Recalcular valores derivados
      updated.valorRecebidoTotal = updated.formasPagamento.reduce((acc, forma) => acc + forma.valorRecebido, 0);
      updated.descontoReal = updated.valorBruto > 0 ? ((updated.valorBruto - updated.valorRecebidoTotal) / updated.valorBruto) * 100 : 0;
      
      const somaFormas = updated.formasPagamento.reduce((acc, forma) => acc + forma.valor, 0);
      updated.valorRestante = updated.valorNegociado - somaFormas;
      
      console.log('Simulação atualizada via desconto real:', updated);
      console.log(`Desconto real resultante: ${updated.descontoReal}%`);
      
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
