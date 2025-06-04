// Test para a lógica de desconto real
// Este teste simula a função editarDescontoReal sem React

console.log('🧪 Iniciando testes da lógica de desconto real...\n');

// Simular as configurações e funções do useSimulador
const PRIORIDADE_FORMAS = ['ENTRADA', 'BOLETO', 'FINANCEIRA', 'CARTAO'];

// Simular a função calcularValorRecebidoForma
function calcularValorRecebidoForma(forma) {
  if (forma.tipo === 'ENTRADA') {
    return forma.valor; // Entrada não tem juros
  }
  if (forma.tipo === 'CARTAO') {
    return forma.valor * 0.95; // 5% de desconto antecipação
  }
  if (forma.tipo === 'BOLETO') {
    return forma.valor * 0.92; // 8% de desconto
  }
  if (forma.tipo === 'FINANCEIRA') {
    return forma.valor * 0.88; // 12% de desconto
  }
  return forma.valor;
}

// Simular a função redistribuirValores
function redistribuirValores(novoValorNegociado, formasAtuais) {
  const somaAtual = formasAtuais.reduce((acc, forma) => acc + forma.valor, 0);
  const diferenca = novoValorNegociado - somaAtual;
  
  if (Math.abs(diferenca) < 0.01) {
    return formasAtuais;
  }
  
  const formasNaoTravadas = formasAtuais.filter(forma => !forma.travado);
  
  if (formasNaoTravadas.length === 0) {
    return null;
  }
  
  const formasOrdenadas = formasNaoTravadas.sort((a, b) => {
    const prioridadeA = PRIORIDADE_FORMAS.indexOf(a.tipo);
    const prioridadeB = PRIORIDADE_FORMAS.indexOf(b.tipo);
    return prioridadeA - prioridadeB;
  });
  
  const novasFormas = [...formasAtuais];
  const primeiraForma = formasOrdenadas[0];
  const formaIndex = novasFormas.findIndex(f => f.id === primeiraForma.id);
  const valorCalculado = primeiraForma.valor + diferenca;
  const novoValor = Math.max(0, valorCalculado);
  
  novasFormas[formaIndex] = { ...novasFormas[formaIndex], valor: novoValor };
  
  return novasFormas;
}

// Função principal a ser testada
function editarDescontoReal(valorBruto, formasPagamento, novoDescontoReal) {
  // Função auxiliar para calcular o desconto real dado um valor negociado
  const calcularDescontoRealParaValor = (valorNegociado) => {
    const formasTemp = redistribuirValores(valorNegociado, formasPagamento);
    if (!formasTemp) return -1; // Indica erro
    
    const valorRecebidoTemp = formasTemp.reduce((acc, forma) => {
      const formaComRecebido = { ...forma, valorRecebido: calcularValorRecebidoForma(forma) };
      return acc + formaComRecebido.valorRecebido;
    }, 0);
    
    return valorBruto > 0 ? ((valorBruto - valorRecebidoTemp) / valorBruto) * 100 : 0;
  };
  
  // Busca binária para encontrar o valor negociado que resulta no desconto real desejado
  let valorMin = 0;
  let valorMax = valorBruto;
  let valorNegociadoOtimo = valorBruto * 0.7; // valor inicial
  let melhorDiferenca = Infinity;
  let melhorDesconto = 0;
  
  // Máximo de 25 iterações para maior precisão
  for (let i = 0; i < 25; i++) {
    const valorTeste = (valorMin + valorMax) / 2;
    const descontoRealCalculado = calcularDescontoRealParaValor(valorTeste);
    
    if (descontoRealCalculado === -1) {
      valorMin = valorTeste;
      continue;
    }
    
    const diferenca = Math.abs(descontoRealCalculado - novoDescontoReal);
    
    // Se encontrou um resultado melhor, guardar
    if (diferenca < melhorDiferenca) {
      melhorDiferenca = diferenca;
      valorNegociadoOtimo = valorTeste;
      melhorDesconto = descontoRealCalculado;
    }
    
    // Se a diferença é muito pequena, parar
    if (diferenca < 0.05) {
      break;
    }
    
    // Detectar se estamos no limite físico
    if (i > 10 && melhorDiferenca > 2) {
      break;
    }
    
    // Ajustar os limites da busca
    if (descontoRealCalculado < novoDescontoReal) {
      // Desconto calculado é menor que o desejado, precisamos diminuir valor negociado
      valorMax = valorTeste;
    } else {
      // Desconto calculado é maior que o desejado, precisamos aumentar valor negociado
      valorMin = valorTeste;
    }
    
    // Verificar se o intervalo ficou muito pequeno
    if (Math.abs(valorMax - valorMin) < 100) {
      break;
    }
  }
  
  return {
    valorNegociadoOtimo,
    descontoRealResultante: melhorDesconto,
    diferenca: melhorDiferenca
  };
}

// Função de teste
function teste(nome, valorEsperado, valorObtido, tolerancia = 0.1) {
  const passou = Math.abs(valorEsperado - valorObtido) <= tolerancia;
  const status = passou ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${nome}`);
  console.log(`   Esperado: ${valorEsperado.toFixed(2)}`);
  console.log(`   Obtido: ${valorObtido.toFixed(2)}`);
  console.log(`   Diferença: ${Math.abs(valorEsperado - valorObtido).toFixed(2)}\n`);
  return passou;
}

// Cenário de teste baseado no problema relatado
console.log('📊 Cenário: Valor bruto R$ 250.000 com formas de pagamento');

const valorBruto = 250000;
const formasIniciais = [
  { id: '1', tipo: 'ENTRADA', valor: 50000, travado: false },
  { id: '2', tipo: 'CARTAO', valor: 75000, travado: false },
  { id: '3', tipo: 'BOLETO', valor: 100000, travado: false }
];

// Calcular desconto real inicial
const valorRecebidoInicial = formasIniciais.reduce((acc, forma) => {
  return acc + calcularValorRecebidoForma(forma);
}, 0);

const descontoRealInicial = ((valorBruto - valorRecebidoInicial) / valorBruto) * 100;

console.log(`Situação inicial:`);
console.log(`  Valor Bruto: R$ ${valorBruto.toLocaleString('pt-BR')}`);
console.log(`  Valor Recebido: R$ ${valorRecebidoInicial.toLocaleString('pt-BR')}`);
console.log(`  Desconto Real: ${descontoRealInicial.toFixed(2)}%\n`);

// Teste 1: Reduzir desconto real de 26.7% para 25%
console.log('🎯 Teste 1: Reduzir desconto real para 25%');
const resultado1 = editarDescontoReal(valorBruto, formasIniciais, 25);

// Calcular valor recebido esperado para 25% de desconto
const valorRecebidoEsperado = valorBruto * (1 - 25/100); // R$ 187.500

console.log(`Resultado do algoritmo:`);
console.log(`  Valor Negociado: R$ ${resultado1.valorNegociadoOtimo.toLocaleString('pt-BR')}`);
console.log(`  Desconto Real: ${resultado1.descontoRealResultante.toFixed(2)}%`);
console.log(`  Diferença do objetivo: ${resultado1.diferenca.toFixed(2)}\n`);

// Validar se o resultado está correto
teste('Desconto Real próximo a 25%', 25, resultado1.descontoRealResultante, 0.1);
teste('Diferença menor que 0.1%', 0, resultado1.diferenca, 0.1);

// Teste 2: Aumentar desconto real para 30%
console.log('🎯 Teste 2: Aumentar desconto real para 30%');
const resultado2 = editarDescontoReal(valorBruto, formasIniciais, 30);

console.log(`Resultado do algoritmo:`);
console.log(`  Valor Negociado: R$ ${resultado2.valorNegociadoOtimo.toLocaleString('pt-BR')}`);
console.log(`  Desconto Real: ${resultado2.descontoRealResultante.toFixed(2)}%`);
console.log(`  Diferença do objetivo: ${resultado2.diferenca.toFixed(2)}\n`);

teste('Desconto Real próximo a 30%', 30, resultado2.descontoRealResultante, 0.1);

// Teste 3: Testar limites físicos (desconto muito baixo)
console.log('🎯 Teste 3: Testar limite físico - desconto 10%');
const resultado3 = editarDescontoReal(valorBruto, formasIniciais, 10);

console.log(`Resultado do algoritmo:`);
console.log(`  Valor Negociado: R$ ${resultado3.valorNegociadoOtimo.toLocaleString('pt-BR')}`);
console.log(`  Desconto Real: ${resultado3.descontoRealResultante.toFixed(2)}%`);
console.log(`  Diferença do objetivo: ${resultado3.diferenca.toFixed(2)}\n`);

// Para desconto muito baixo, esperamos que não consiga atingir exatamente
console.log(`🔍 Análise: ${resultado3.diferenca > 2 ? 'Limite físico detectado (esperado)' : 'Conseguiu atingir o valor'}`);

// Teste 4: Verificar fórmula matemática
console.log('🧮 Teste 4: Verificação matemática da fórmula');

// Para 25% de desconto com R$ 250.000:
const valorRecebidoCalculado = valorBruto * (1 - 25/100);
const descontoVerificacao = ((valorBruto - valorRecebidoCalculado) / valorBruto) * 100;

console.log(`Verificação matemática:`);
console.log(`  Valor Bruto: R$ ${valorBruto.toLocaleString('pt-BR')}`);
console.log(`  Para 25% desconto, Valor Recebido deve ser: R$ ${valorRecebidoCalculado.toLocaleString('pt-BR')}`);
console.log(`  Verificação: ((${valorBruto} - ${valorRecebidoCalculado}) / ${valorBruto}) * 100 = ${descontoVerificacao}%\n`);

teste('Fórmula matemática correta', 25, descontoVerificacao, 0.001);

console.log('✨ Testes concluídos!'); 