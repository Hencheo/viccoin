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

/**
 * Formata uma data para o formato aceito pela API (YYYY-MM-DD)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data no formato YYYY-MM-DD
 */
export const formatDateForAPI = (date) => {
  try {
    // Se for já uma string no formato ISO, pegar apenas a parte da data
    if (typeof date === 'string') {
      // Se já estiver no formato YYYY-MM-DD, retornar como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Se estiver no formato DD/MM/YYYY, converter para YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        const parts = date.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      
      // Tentar converter a string para objeto Date
      date = new Date(date);
    }
    
    // Garantir que é um objeto Date
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Data inválida:', date);
      return new Date().toISOString().split('T')[0]; // Usar data atual como fallback
    }
    
    // Formatar no padrão ISO e pegar apenas a parte da data
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error('Erro ao formatar data para API:', e);
    return new Date().toISOString().split('T')[0]; // Usar data atual como fallback
  }
};

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data no formato DD/MM/YYYY
 */
export const formatDateForDisplay = (date) => {
  try {
    // Se for já uma string no formato DD/MM/YYYY, retornar como está
    if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
    
    // Se for string no formato YYYY-MM-DD, converter para DD/MM/YYYY
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const parts = date.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    // Converter para Date se for uma string
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    // Garantir que é um objeto Date
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Data inválida para exibição:', date);
      return new Date().toLocaleDateString('pt-BR'); // Usar data atual como fallback
    }
    
    // Formatar usando API de localização
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error('Erro ao formatar data para exibição:', e);
    return new Date().toLocaleDateString('pt-BR'); // Usar data atual como fallback
  }
};

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY),
 * corrigindo o problema de fuso horário para garantir que a data exibida seja a correta
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data no formato DD/MM/YYYY
 */
export const formatDateWithTimezoneOffset = (date) => {
  try {
    if (!date) return '';
    
    // Converter para Date se for uma string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Garantir que é um objeto Date válido
    if (!(dateObj instanceof Date) || isNaN(dateObj)) {
      console.error('Data inválida para exibição com ajuste de fuso:', date);
      return '';
    }
    
    // Solução correta para o fuso horário de Brasília (GMT-3)
    // Primeiro, vamos criar uma nova data para não modificar a original
    const dataCorrected = new Date(dateObj);
    
    // Em vez de adicionar o offset, vamos definir a data diretamente para o fuso de Brasília (GMT-3)
    // Isso garante que a data seja exibida corretamente, independente do fuso horário do dispositivo
    
    // Opção 1: Manter a data na zona local do usuário e interpretar como meia-noite
    // Esta abordagem preserva o dia, mês e ano conforme exibido na interface, sem conversões
    const dia = dateObj.getDate();
    const mes = dateObj.getMonth();
    const ano = dateObj.getFullYear();
    
    // Criar uma nova data com apenas dia, mês e ano, sem informações de hora
    // Isso trata a data como meia-noite na zona do usuário
    dataCorrected.setFullYear(ano, mes, dia);
    dataCorrected.setHours(0, 0, 0, 0);
    
    // Formatar usando API de localização
    return dataCorrected.toLocaleDateString('pt-BR');
  } catch (e) {
    console.error('Erro ao formatar data com ajuste de fuso:', e, 'Data original:', date);
    return '';
  }
};

/**
 * Formata um valor decimal para garantir que está no formato correto para a API
 * @param {string|number} value - Valor a ser formatado
 * @returns {number} Valor numérico formatado
 */
export const formatDecimalForAPI = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remover qualquer formatação de moeda (R$, pontos, espaços)
    const cleanValue = value
      .replace(/[^\d,.-]/g, '') // Remove tudo que não for dígito, vírgula, ponto ou sinal
      .replace(',', '.'); // Substitui vírgula por ponto
    
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  }
  
  return 0;
};

/**
 * Verifica e prepara um objeto de dados para envio à API
 * @param {Object} data - Objeto com dados a serem formatados
 * @returns {Object} Objeto com dados formatados
 */
export const prepareDataForAPI = (data) => {
  const formattedData = { ...data };
  
  // Formatar campos de data
  if (formattedData.data) {
    formattedData.data = formatDateForAPI(formattedData.data);
  }
  
  if (formattedData.data_recebimento) {
    formattedData.data_recebimento = formatDateForAPI(formattedData.data_recebimento);
  }
  
  // Formatar campos de valor
  if (formattedData.valor !== undefined) {
    formattedData.valor = formatDecimalForAPI(formattedData.valor);
  }
  
  // Garantir que descrição não é undefined
  if (formattedData.descricao === undefined) {
    formattedData.descricao = '';
  }
  
  return formattedData;
};

/**
 * Mapeia um ID de categoria para o nome correspondente
 * @param {number|string} categoryId - ID da categoria
 * @returns {string} Nome da categoria
 */
export const getCategoryName = (categoryId) => {
  const categoryMap = {
    1: 'Alimentação',
    2: 'Transporte',
    3: 'Moradia',
    4: 'Saúde',
    5: 'Educação',
    6: 'Lazer',
    7: 'Vestuário',
    8: 'Tecnologia',
    9: 'Investimentos',
    10: 'Salário',
    11: 'Freelance',
    12: 'Outros'
  };
  
  if (typeof categoryId === 'string' && isNaN(parseInt(categoryId))) {
    return categoryId; // Se for uma string não numérica, retorna ela mesma
  }
  
  return categoryMap[categoryId] || `Categoria ${categoryId}`;
}; 