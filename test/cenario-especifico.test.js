// Teste específico para o cenário relatado pelo usuário
// Desconto real atual: 26.7% → Objetivo: 25%

console.log('🔍 Teste específico do cenário relatado\n');

const PRIORIDADE_FORMAS = ['ENTRADA', 'BOLETO', 'FINANCEIRA', 'CARTAO'];

// Função para calcular valor recebido (taxas específicas do projeto)
function calcularValorRecebidoForma(forma) {
  if (forma.tipo === 'ENTRADA') {
    return forma.valor; // Entrada = 100%
  }
  if (forma.tipo === 'CARTAO') {
    // Cartão com deflação/antecipação
    const deflacao = forma.deflacao || 5;
    return forma.valor * (1 - deflacao / 100);
  }
  if (forma.tipo === 'BOLETO') {
    // Boleto com juros de antecipação
    const juros = forma.jurosAntecipacao || 8;
    return forma.valor * (1 - juros / 100);
  }
  if (forma.tipo === 'FINANCEIRA') {
    // Financeira com custo de capital
    const custo = forma.custoCapital || 12;
    return forma.valor * (1 - custo / 100);
  }
  return forma.valor;
}

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

// Tentativa de reproduzir o cenário exato: Desconto Real 26.7%
// Vamos trabalhar de trás para frente: qual configuração geraria 26.7%?

console.log('💡 Reproduzindo cenário que gera desconto real 26.7%');

const valorBruto = 250000;

// Configuração que deve gerar aproximadamente 26.7% de desconto real
// Desconto Real = (Valor Bruto - Valor Recebido) / Valor Bruto
// 26.7% = (250000 - Valor Recebido) / 250000
// 0.267 = (250000 - Valor Recebido) / 250000
// 0.267 * 250000 = 250000 - Valor Recebido
// 66750 = 250000 - Valor Recebido
// Valor Recebido = 250000 - 66750 = 183250

const valorRecebidoObjetivo = 250000 - (250000 * 0.267);
console.log(`Para desconto real 26.7%, valor recebido deve ser: R$ ${valorRecebidoObjetivo.toFixed(2)}`);

// Configuração que pode gerar esse valor recebido
const cenarioAtual = [
  { id: '1', tipo: 'ENTRADA', valor: 80000, deflacao: 0, travado: false },
  { id: '2', tipo: 'CARTAO', valor: 70000, deflacao: 5, travado: false },
  { id: '3', tipo: 'BOLETO', valor: 60000, jurosAntecipacao: 8, travado: false },
  { id: '4', tipo: 'FINANCEIRA', valor: 40000, custoCapital: 12, travado: false }
];

const valorRecebidoCenario = cenarioAtual.reduce((acc, forma) => {
  return acc + calcularValorRecebidoForma(forma);
}, 0);

const descontoRealCenario = ((valorBruto - valorRecebidoCenario) / valorBruto) * 100;

console.log(`\nCenário atual configurado:`);
cenarioAtual.forEach(forma => {
  const recebido = calcularValorRecebidoForma(forma);
  console.log(`  ${forma.tipo}: R$ ${forma.valor.toLocaleString('pt-BR')} → R$ ${recebido.toLocaleString('pt-BR')}`);
});

console.log(`\nResumo:`);
console.log(`  Valor Negociado Total: R$ ${cenarioAtual.reduce((acc, f) => acc + f.valor, 0).toLocaleString('pt-BR')}`);
console.log(`  Valor Recebido Total: R$ ${valorRecebidoCenario.toLocaleString('pt-BR')}`);
console.log(`  Desconto Real: ${descontoRealCenario.toFixed(2)}%`);

// Agora testar a redução para 25%
console.log(`\n🎯 Teste: Reduzir de ${descontoRealCenario.toFixed(2)}% para 25%`);

// Busca binária
function calcularDescontoRealParaValor(valorNegociado, formas) {
  const formasTemp = redistribuirValores(valorNegociado, formas);
  if (!formasTemp) return -1;
  
  const valorRecebidoTemp = formasTemp.reduce((acc, forma) => {
    return acc + calcularValorRecebidoForma(forma);
  }, 0);
  
  return valorBruto > 0 ? ((valorBruto - valorRecebidoTemp) / valorBruto) * 100 : 0;
}

let valorMin = 0;
let valorMax = valorBruto;
let valorNegociadoOtimo = cenarioAtual.reduce((acc, f) => acc + f.valor, 0);
let melhorDiferenca = Infinity;
let melhorDesconto = descontoRealCenario;

const novoDescontoReal = 25;

console.log(`Busca binária para atingir ${novoDescontoReal}%:`);

for (let i = 0; i < 25; i++) {
  const valorTeste = (valorMin + valorMax) / 2;
  const descontoCalculado = calcularDescontoRealParaValor(valorTeste, cenarioAtual);
  
  console.log(`  Iteração ${i + 1}: Valor=${valorTeste.toFixed(0)}, Desconto=${descontoCalculado.toFixed(2)}%`);
  
  if (descontoCalculado === -1) {
    valorMin = valorTeste;
    continue;
  }
  
  const diferenca = Math.abs(descontoCalculado - novoDescontoReal);
  
  if (diferenca < melhorDiferenca) {
    melhorDiferenca = diferenca;
    valorNegociadoOtimo = valorTeste;
    melhorDesconto = descontoCalculado;
  }
  
  if (diferenca < 0.05) {
    console.log(`  🎯 Precisão atingida!`);
    break;
  }
  
  if (descontoCalculado < novoDescontoReal) {
    // Desconto muito baixo, diminuir valor negociado
    valorMax = valorTeste;
    console.log(`  📉 Desconto baixo, diminuindo valorMax`);
  } else {
    // Desconto muito alto, aumentar valor negociado  
    valorMin = valorTeste;
    console.log(`  📈 Desconto alto, aumentando valorMin`);
  }
  
  if (Math.abs(valorMax - valorMin) < 100) {
    console.log(`  🔍 Intervalo muito pequeno, finalizando`);
    break;
  }
}

console.log(`\n📊 Resultado final:`);
console.log(`  Valor Negociado Ótimo: R$ ${valorNegociadoOtimo.toLocaleString('pt-BR')}`);
console.log(`  Desconto Real Resultante: ${melhorDesconto.toFixed(2)}%`);
console.log(`  Diferença do objetivo: ${melhorDiferenca.toFixed(2)}%`);

// Verificar as formas redistribuídas
const formasFinais = redistribuirValores(valorNegociadoOtimo, cenarioAtual);
if (formasFinais) {
  console.log(`\n📋 Distribuição final:`);
  formasFinais.forEach(forma => {
    const recebido = calcularValorRecebidoForma(forma);
    console.log(`  ${forma.tipo}: R$ ${forma.valor.toLocaleString('pt-BR')} → R$ ${recebido.toLocaleString('pt-BR')}`);
  });
  
  const valorRecebidoFinal = formasFinais.reduce((acc, forma) => {
    return acc + calcularValorRecebidoForma(forma);
  }, 0);
  
  console.log(`\n✅ Verificação:`);
  console.log(`  Valor Recebido Total: R$ ${valorRecebidoFinal.toLocaleString('pt-BR')}`);
  console.log(`  Desconto Real: ${((valorBruto - valorRecebidoFinal) / valorBruto * 100).toFixed(2)}%`);
}

// Análise da lógica
console.log(`\n🔍 Análise da lógica:`);
console.log(`  Situação inicial: ${descontoRealCenario.toFixed(2)}% de desconto`);
console.log(`  Objetivo: 25% de desconto (MENOR que o atual)`);
console.log(`  Para reduzir desconto: precisa AUMENTAR valor recebido`);
console.log(`  Para aumentar valor recebido: precisa AUMENTAR valor negociado`);
console.log(`  Resultado: ${valorNegociadoOtimo > cenarioAtual.reduce((acc, f) => acc + f.valor, 0) ? 'AUMENTOU' : 'DIMINUIU'} o valor negociado`);

const mudancaValorNegociado = valorNegociadoOtimo - cenarioAtual.reduce((acc, f) => acc + f.valor, 0);
console.log(`  Mudança: ${mudancaValorNegociado > 0 ? '+' : ''}${mudancaValorNegociado.toFixed(0)}`);

console.log(`\n✨ Teste específico concluído!`); 