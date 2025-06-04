
export interface FormaPagamento {
  id: string;
  tipo: 'ENTRADA' | 'FINANCEIRA' | 'CARTAO' | 'BOLETO';
  valor: number;
  valorRecebido: number;
  parcelas?: number;
  taxaJuros?: number;
  deflacao?: number;
  jurosAntecipacao?: number;
  custoCapital?: number;
  dataVencimento?: string;
  travado?: boolean; // Novo campo para travamento
}

export interface TravamentoConfig {
  valorNegociado: boolean;
  descontoReal: boolean;
  limiteDescontoReal: number;
}

export interface Simulacao {
  valorBruto: number;
  desconto: number;
  valorNegociado: number;
  formasPagamento: FormaPagamento[];
  valorRecebidoTotal: number;
  descontoReal: number;
  valorRestante: number;
  travamentos: TravamentoConfig; // Nova propriedade
}
