/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param {number} value - Valor a ser formatado
 * @param {boolean} includeSymbol - Se deve incluir o símbolo R$
 * @returns {string} Valor formatado como moeda
 */
export const formatCurrency = (value, includeSymbol = true) => {
  // Garantir que o valor é um número
  const numericValue = typeof value === 'number' ? value : Number(value) || 0;
  
  // Formatar usando a API de internacionalização
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // Formatar o valor
  const formattedValue = formatter.format(numericValue);
  
  // Se não quiser o símbolo, remove o "R$" e retorna apenas o valor
  if (!includeSymbol) {
    return formattedValue.replace('R$', '').trim();
  }
  
  return formattedValue;
};

/**
 * Alias para formatCurrency para compatibilidade com código existente
 * @param {number} valor - Valor a ser formatado
 * @param {boolean} inclueSymbol - Se deve incluir o símbolo R$
 * @returns {string} Valor formatado como moeda
 */
export const formatarMoeda = (valor, inclueSymbol = true) => {
  return formatCurrency(valor, inclueSymbol);
};

/**
 * Formata um valor para exibição em resumos (ex: 1.5K, 10M)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado para resumo
 */
export const formatCompactCurrency = (value) => {
  // Garantir que o valor é um número
  const numericValue = typeof value === 'number' ? value : Number(value) || 0;
  
  // Formatar valores grandes de forma mais legível
  if (numericValue >= 1000000) {
    return `R$ ${(numericValue / 1000000).toFixed(1)}M`;
  }
  
  if (numericValue >= 1000) {
    return `R$ ${(numericValue / 1000).toFixed(1)}K`;
  }
  
  // Usar formatação padrão para valores menores
  return formatCurrency(numericValue);
};

/**
 * Alias para formatCompactCurrency para compatibilidade com código existente
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado para resumo
 */
export const formatarValorResumido = (valor) => {
  return formatCompactCurrency(valor);
}; 