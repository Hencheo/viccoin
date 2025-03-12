/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param {number} valor - Valor a ser formatado
 * @param {boolean} inclueSymbol - Se deve incluir o símbolo R$
 * @returns {string} Valor formatado como moeda
 */
export const formatarMoeda = (valor, inclueSymbol = true) => {
  // Garantir que o valor é um número
  const valorNumerico = typeof valor === 'number' ? valor : Number(valor) || 0;
  
  // Formatar usando a API de internacionalização
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // Formatar o valor
  const valorFormatado = formatter.format(valorNumerico);
  
  // Se não quiser o símbolo, remove o "R$" e retorna apenas o valor
  if (!inclueSymbol) {
    return valorFormatado.replace('R$', '').trim();
  }
  
  return valorFormatado;
};

/**
 * Formata um valor para exibição em resumos (ex: 1.5K, 10M)
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado para resumo
 */
export const formatarValorResumido = (valor) => {
  // Garantir que o valor é um número
  const valorNumerico = typeof valor === 'number' ? valor : Number(valor) || 0;
  
  // Formatar valores grandes de forma mais legível
  if (valorNumerico >= 1000000) {
    return `R$ ${(valorNumerico / 1000000).toFixed(1)}M`;
  }
  
  if (valorNumerico >= 1000) {
    return `R$ ${(valorNumerico / 1000).toFixed(1)}K`;
  }
  
  // Usar formatação padrão para valores menores
  return formatarMoeda(valorNumerico);
}; 