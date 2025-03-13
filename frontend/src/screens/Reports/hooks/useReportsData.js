import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { financasService } from '../../../services/api';
import { formatarMoeda } from '../../../utils/formatters';

const useReportsData = (period = 'month', category = 'all') => {
  const [isLoading, setIsLoading] = useState(true);
  const [transacoes, setTransacoes] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [resumoMensal, setResumoMensal] = useState({});
  const [error, setError] = useState(null);

  const user = useSelector(state => state.auth.user);

  // Função para gerar o intervalo de datas baseado no período
  const getDateRange = useCallback((periodType) => {
    const today = new Date();
    let startDate = new Date();
    
    switch (periodType) {
      case 'week':
        // Últimos 7 dias
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        // Últimos 30 dias
        startDate.setDate(today.getDate() - 30);
        break;
      case 'quarter':
        // Último trimestre
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        break;
      case 'year':
        // Ano atual
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
        // Todo o histórico (2 anos para trás)
        startDate = new Date(today.getFullYear() - 2, 0, 1);
        break;
      default:
        // Últimos 30 dias (padrão)
        startDate.setDate(today.getDate() - 30);
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  }, []);

  // Função para carregar os dados do relatório
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Obter parâmetros da data
      const { startDate, endDate } = getDateRange(period);
      
      console.log('Carregando relatório para o período:', period, 'de', startDate, 'até', endDate);
      
      // Passo 1: Obter o resumo financeiro
      const resumoResponse = await financasService.obterResumoFinanceiro();
      
      if (!resumoResponse.success) {
        setError('Não foi possível carregar o resumo financeiro');
        setIsLoading(false);
        return;
      }
      
      // Passo 2: Obter todas as transações
      const transacoesResponse = await financasService.listarTransacoes(null);
      
      if (!transacoesResponse.success) {
        setError('Não foi possível carregar as transações');
        setIsLoading(false);
        return;
      }
      
      // Filtrar transações de acordo com o período e categoria selecionados
      const allTransactions = transacoesResponse.transacoes || [];
      const filteredTransactions = allTransactions.filter(transaction => {
        // Filtrar por período
        const transactionDate = new Date(transaction.data);
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Filtrar por categoria, se especificada
        const categoryMatches = category === 'all' || 
                               transaction.categoria === category || 
                               transaction.categoria === parseInt(category);
        
        return transactionDate >= start && 
               transactionDate <= end && 
               categoryMatches;
      });
      
      console.log(`Encontradas ${filteredTransactions.length} transações no período selecionado`);
      
      // Processar os dados recebidos para criar resumo específico do período
      // Incluindo salário como ganho para os totais
      const despesas = filteredTransactions.filter(t => t.tipo === 'despesa');
      const ganhos = filteredTransactions.filter(t => t.tipo === 'ganho' || t.tipo === 'salario');
      
      const totalDesp = despesas.reduce((sum, t) => sum + Number(t.valor || 0), 0);
      const totalGan = ganhos.reduce((sum, t) => sum + Number(t.valor || 0), 0);
      
      // Criar resumo mensal com base no período selecionado
      const resumoPeriodo = {
        totalGanhos: totalGan,
        totalDespesas: totalDesp,
        saldo: totalGan - totalDesp,
        periodo: period,
        transactions: filteredTransactions
      };
      
      console.log('Resumo do período:', {
        totalGanhos: formatarMoeda(totalGan),
        totalDespesas: formatarMoeda(totalDesp),
        saldo: formatarMoeda(totalGan - totalDesp)
      });
      
      // Processar os dados filtrados
      processTransactionData(filteredTransactions, resumoPeriodo);
      
      // Atualizar estados
      setTransacoes(filteredTransactions);
      setTotalDespesas(totalDesp);
      setTotalGanhos(totalGan);
      setResumoMensal(resumoPeriodo);
      
    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
      setError(`Erro ao carregar dados: ${error.message}`);
      
      // Definir estados com dados vazios
      setTransacoes([]);
      setResumoMensal({
        totalGanhos: 0,
        totalDespesas: 0,
        saldo: 0
      });
      setChartData({
        labels: [],
        datasets: []
      });
      setInsights([]);
      setCategoryData([]);
      
    } finally {
      setIsLoading(false);
    }
  }, [period, category, getDateRange, processTransactionData]);

  // Função para processar os dados das transações 
  // e gerar gráficos, insights e análises
  const processTransactionData = useCallback((transactions, resumo) => {
    // 1. Preparar dados para o gráfico
    const graphData = prepareChartData(transactions, period);
    setChartData(graphData);
    
    // 2. Preparar dados por categoria
    const categoryStats = prepareCategoryData(transactions);
    setCategoryData(categoryStats);
    
    // 3. Gerar insights
    const insightData = generateInsights(transactions, categoryStats, resumo);
    setInsights(insightData);
  }, [period, prepareChartData, prepareCategoryData, generateInsights]);

  // Preparar dados para o gráfico baseado no período
  const prepareChartData = useCallback((transactions, periodType) => {
    if (!transactions || transactions.length === 0) {
      return {
        labels: [],
        datasets: [
          { label: 'Despesas', data: [], color: '#FF5252' },
          { label: 'Ganhos', data: [], color: '#4CAF50' }
        ]
      };
    }
    
    const today = new Date();
    let labels = [];
    let despesasData = [];
    let ganhosData = [];
    
    switch (periodType) {
      case 'week':
        // Gráfico diário para a semana
        labels = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(today.getDate() - 6 + i);
          return date.toISOString().slice(5, 10).replace('-', '/'); // formato "MM/DD"
        });
        
        // Agrupar transações por dia da semana
        despesasData = new Array(7).fill(0);
        ganhosData = new Array(7).fill(0);
        
        transactions.forEach(t => {
          const date = new Date(t.data);
          const daysDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
          
          if (daysDiff >= 0 && daysDiff < 7) {
            const index = 6 - daysDiff;
            if (t.tipo === 'despesa') {
              despesasData[index] += Number(t.valor || 0);
            } else if (t.tipo === 'ganho' || t.tipo === 'salario') {
              // Incluir salário como ganho nos gráficos
              ganhosData[index] += Number(t.valor || 0);
            }
          }
        });
        break;
        
      case 'month':
        // Gráfico para os últimos 30 dias, dividido em 6 partes (5 dias cada)
        const daysInPeriod = 30;
        const parts = 6; // 5 dias por parte
        
        // Calcular a data de início (30 dias atrás)
        const startDate = new Date();
        startDate.setDate(today.getDate() - (daysInPeriod - 1));
        
        console.log(`Preparando gráfico para período de 30 dias: de ${startDate.toLocaleDateString()} até ${today.toLocaleDateString()}`);
        
        // Criar labels para os 6 períodos de 5 dias cada
        labels = Array.from({ length: parts }, (_, i) => {
          const periodStartDate = new Date();
          periodStartDate.setDate(startDate.getDate() + (i * (daysInPeriod / parts)));
          
          const periodEndDate = new Date();
          periodEndDate.setDate(startDate.getDate() + (i * (daysInPeriod / parts)) + ((daysInPeriod / parts) - 1));
          
          // Se o período cruza meses, adicionar mês abreviado
          if (periodStartDate.getMonth() !== periodEndDate.getMonth()) {
            const startDay = periodStartDate.getDate().toString().padStart(2, '0');
            const startMonth = (periodStartDate.getMonth() + 1).toString().padStart(2, '0');
            const endDay = periodEndDate.getDate().toString().padStart(2, '0');
            const endMonth = (periodEndDate.getMonth() + 1).toString().padStart(2, '0');
            return `${startDay}/${startMonth}-${endDay}/${endMonth}`;
          }
          
          // Formato padrão: "DD-DD"
          return `${periodStartDate.getDate().toString().padStart(2, '0')}-${periodEndDate.getDate().toString().padStart(2, '0')}`;
        });
        
        // Inicializar arrays para cada parte
        despesasData = new Array(parts).fill(0);
        ganhosData = new Array(parts).fill(0);
        
        // Processar transações para os últimos 30 dias
        transactions.forEach(t => {
          // Converter a data da transação para objeto Date
          const transactionDate = new Date(t.data);
          
          // Verificar se a transação está dentro do período de 30 dias
          if (transactionDate >= startDate && transactionDate <= today) {
            // Calcular o índice do período em que a transação se encaixa
            const daysSinceStart = Math.floor((transactionDate - startDate) / (1000 * 60 * 60 * 24));
            const partIndex = Math.min(Math.floor(daysSinceStart / (daysInPeriod / parts)), parts - 1);
            
            // Adicionar o valor ao período correto
            if (t.tipo === 'despesa') {
              despesasData[partIndex] += Number(t.valor || 0);
            } else if (t.tipo === 'ganho' || t.tipo === 'salario') {
              // Incluir salário como ganho nos gráficos
              ganhosData[partIndex] += Number(t.valor || 0);
            }
          }
        });
        
        console.log('Dados do gráfico gerados:', {
          labels,
          despesas: despesasData,
          ganhos: ganhosData
        });
        
        break;
        
      case 'quarter':
      case 'year':
      case 'all':
        // Gráfico por mês
        const monthCount = periodType === 'quarter' ? 3 : 
                          periodType === 'year' ? 12 : 24;
                          
        labels = Array.from({ length: monthCount }, (_, i) => {
          const date = new Date();
          date.setMonth(today.getMonth() - (monthCount - 1) + i);
          return date.toISOString().slice(0, 7).replace('-', '/'); // formato "YYYY/MM"
        });
        
        // Agrupar transações por mês
        despesasData = new Array(monthCount).fill(0);
        ganhosData = new Array(monthCount).fill(0);
        
        transactions.forEach(t => {
          const date = new Date(t.data);
          const monthsDiff = (today.getFullYear() - date.getFullYear()) * 12 + 
                            (today.getMonth() - date.getMonth());
          
          if (monthsDiff >= 0 && monthsDiff < monthCount) {
            const index = monthCount - 1 - monthsDiff;
            
            if (t.tipo === 'despesa') {
              despesasData[index] += Number(t.valor || 0);
            } else if (t.tipo === 'ganho' || t.tipo === 'salario') {
              // Incluir salário como ganho nos gráficos
              ganhosData[index] += Number(t.valor || 0);
            }
          }
        });
        break;
      
      default:
        // Caso padrão
        labels = Array.from({ length: 4 }, (_, i) => `Semana ${i + 1}`);
        despesasData = new Array(4).fill(0);
        ganhosData = new Array(4).fill(0);
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Despesas',
          data: despesasData,
          color: '#FF5252', // Vermelho
        },
        {
          label: 'Ganhos',
          data: ganhosData,
          color: '#4CAF50', // Verde
        },
      ],
    };
  }, []);

  // Preparar dados por categoria
  const prepareCategoryData = useCallback((transactions) => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    // Filtrar apenas despesas para análise de categorias
    // E excluir salários da análise de categorias
    const despesas = transactions.filter(t => t.tipo === 'despesa');
    
    if (despesas.length === 0) {
      return [];
    }
    
    // Agrupar transações por categoria
    const categories = {};
    
    despesas.forEach(t => {
      const categoriaKey = t.categoria.toString();
      const categoriaNome = t.categoriaNome || t.categoriaNome === '' 
        ? t.categoriaNome 
        : (typeof t.categoria === 'string' ? t.categoria : getNomeCategoriaById(t.categoria));
      
      if (!categories[categoriaKey]) {
        categories[categoriaKey] = {
          categoria: t.categoria,
          nome: categoriaNome,
          icone: getIconForCategory(t.categoria),
          color: getCategoryColor(t.categoria),
          total: 0,
          count: 0,
          percentual: 0,
        };
      }
      
      categories[categoriaKey].total += Number(t.valor || 0);
      categories[categoriaKey].count += 1;
    });
    
    // Calcular total e percentuais
    const total = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);
    
    Object.keys(categories).forEach(key => {
      categories[key].percentual = total > 0 ? Math.round((categories[key].total / total) * 100) : 0;
      categories[key].totalFormatado = formatarMoeda(categories[key].total);
    });
    
    // Ordenar categorias por valor total (decrescente)
    return Object.values(categories).sort((a, b) => b.total - a.total);
  }, []);

  // Função auxiliar para obter o nome da categoria pelo ID
  const getNomeCategoriaById = useCallback((categoriaId) => {
    // Mapeamento de IDs de categoria para nomes
    const categoriasMap = {
      1: 'Salário',
      2: 'Freelance',
      3: 'Investimentos',
      4: 'Vendas',
      5: 'Presentes',
      6: 'Alimentação',
      7: 'Transporte',
      8: 'Moradia',
      9: 'Saúde',
      10: 'Educação',
      11: 'Lazer',
      12: 'Compras',
      13: 'Viagens',
      14: 'Vestuário',
      15: 'Eletrônicos',
      16: 'Serviços',
      17: 'Seguros',
      18: 'Dívidas',
      19: 'Impostos',
      20: 'Outros'
    };
    
    return categoriasMap[categoriaId] || `Categoria ${categoriaId}`;
  }, []);

  // Função auxiliar para obter ícone com base na categoria
  const getIconForCategory = useCallback((categoria) => {
    // Convert categoria to string for consistency
    const catStr = String(categoria).toLowerCase();
    
    const iconMap = {
      'alimentação': 'restaurant-outline',
      'alimentos': 'restaurant-outline',
      'alimentacao': 'restaurant-outline',
      'comida': 'restaurant-outline',
      'moradia': 'home-outline',
      'casa': 'home-outline',
      'aluguel': 'home-outline',
      'transporte': 'car-outline',
      'uber': 'car-outline',
      'taxi': 'car-outline',
      'lazer': 'game-controller-outline',
      'diversão': 'game-controller-outline',
      'divertimento': 'game-controller-outline',
      'saúde': 'medical-outline',
      'saude': 'medical-outline',
      'médico': 'medical-outline',
      'medico': 'medical-outline',
      'educação': 'school-outline',
      'educacao': 'school-outline',
      'escola': 'school-outline',
      'faculdade': 'school-outline',
      'compras': 'cart-outline',
      'shopping': 'cart-outline',
      'viagem': 'airplane-outline',
      'férias': 'airplane-outline',
      'ferias': 'airplane-outline',
      'tecnologia': 'hardware-chip-outline',
      'eletrônicos': 'hardware-chip-outline',
      'eletronicos': 'hardware-chip-outline',
      'salário': 'cash-outline',
      'salario': 'cash-outline',
      'renda': 'cash-outline',
      'investimentos': 'trending-up-outline',
      'investimento': 'trending-up-outline',
      'ações': 'trending-up-outline',
      'acoes': 'trending-up-outline',
      'freelance': 'briefcase-outline',
      'trabalho': 'briefcase-outline',
      'serviço': 'briefcase-outline',
      'servico': 'briefcase-outline',
      'vestuário': 'shirt-outline',
      'vestuario': 'shirt-outline',
      'roupas': 'shirt-outline',
      'serviços': 'construct-outline',
      'servicos': 'construct-outline',
      'supermercado': 'basket-outline',
      'mercado': 'basket-outline',
      'entretenimento': 'film-outline',
      'utilidades': 'flash-outline',
      'contas': 'document-text-outline',
      'outros': 'help-circle-outline'
    };
    
    // Verifica se é um número (índice de categoria)
    if (!isNaN(parseInt(catStr))) {
      // Mapeia índices para categorias padrão
      const indexMap = {
        '1': 'cash-outline', // Salário
        '2': 'briefcase-outline', // Freelance
        '3': 'trending-up-outline', // Investimentos
        '4': 'cart-outline', // Vendas
        '5': 'gift-outline', // Presentes
        // Índices para despesas
        '6': 'restaurant-outline', // Alimentação
        '7': 'car-outline', // Transporte
        '8': 'home-outline', // Moradia
        '9': 'medical-outline', // Saúde
        '10': 'school-outline' // Educação
      };
      
      return indexMap[catStr] || 'help-circle-outline';
    }
    
    // Procura por correspondências parciais no nome da categoria
    for (const [key, icon] of Object.entries(iconMap)) {
      if (catStr.includes(key) || key.includes(catStr)) {
        return icon;
      }
    }
    
    // Ícone padrão se nenhuma correspondência for encontrada
    return 'help-circle-outline';
  }, []);
  
  // Função auxiliar para obter cor com base na categoria
  const getCategoryColor = useCallback((categoria) => {
    // Convert categoria to string for consistency
    const catStr = String(categoria).toLowerCase();
    
    const colorMap = {
      'alimentação': '#FF5252',
      'alimentacao': '#FF5252',
      'alimentos': '#FF5252',
      'comida': '#FF5252',
      'moradia': '#2196F3',
      'casa': '#2196F3',
      'aluguel': '#2196F3',
      'transporte': '#FFC107',
      'uber': '#FFC107',
      'taxi': '#FFC107',
      'lazer': '#E040FB',
      'diversão': '#E040FB',
      'divertimento': '#E040FB',
      'saúde': '#F44336',
      'saude': '#F44336',
      'médico': '#F44336',
      'medico': '#F44336',
      'educação': '#4CAF50',
      'educacao': '#4CAF50',
      'escola': '#4CAF50',
      'faculdade': '#4CAF50',
      'compras': '#FF9800',
      'shopping': '#FF9800',
      'viagem': '#00BCD4',
      'férias': '#00BCD4',
      'ferias': '#00BCD4',
      'tecnologia': '#607D8B',
      'eletrônicos': '#607D8B',
      'eletronicos': '#607D8B',
      'salário': '#4CAF50',
      'salario': '#4CAF50',
      'renda': '#4CAF50',
      'investimentos': '#009688',
      'investimento': '#009688',
      'ações': '#009688',
      'acoes': '#009688',
      'freelance': '#8BC34A',
      'trabalho': '#8BC34A',
      'serviço': '#3F51B5',
      'servico': '#3F51B5',
      'vestuário': '#9C27B0',
      'vestuario': '#9C27B0',
      'roupas': '#9C27B0',
      'serviços': '#3F51B5',
      'servicos': '#3F51B5',
      'supermercado': '#FF5722',
      'mercado': '#FF5722',
      'entretenimento': '#673AB7',
      'utilidades': '#795548',
      'contas': '#607D8B',
      'outros': '#9E9E9E'
    };
    
    // Procura por correspondências parciais no nome da categoria
    for (const [key, color] of Object.entries(colorMap)) {
      if (catStr.includes(key) || key.includes(catStr)) {
        return color;
      }
    }
    
    // Cor padrão para categorias não identificadas
    return '#A239FF';
  }, []);

  // Gerar insights com base nas transações e categorias
  const generateInsights = useCallback((transactions, categories, resumo) => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    const insights = [];
    
    // Insight 1: Categoria com maior gasto
    if (categories.length > 0) {
      const topCategory = categories[0];
      insights.push({
        id: 'top-category',
        title: 'Maior categoria de gasto',
        description: `${topCategory.nome} representa ${topCategory.percentual}% do seu gasto total`,
        icon: topCategory.icone,
        color: topCategory.color || '#FF5252',
        value: topCategory.percentual,
        maxValue: 100,
      });
    }
    
    // Insight 2: Relação despesas vs. receitas
    const totalDespesas = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);
      
    const totalGanhos = transactions
      .filter(t => t.tipo === 'ganho' || t.tipo === 'salario')
      .reduce((sum, t) => sum + Number(t.valor || 0), 0);
      
    if (totalGanhos > 0) {
      const percentualGasto = Math.round((totalDespesas / totalGanhos) * 100);
      
      insights.push({
        id: 'expense-income-ratio',
        title: 'Despesas vs. Receitas',
        description: `Você gasta ${percentualGasto}% do que ganha`,
        icon: 'trending-up-outline',
        color: percentualGasto < 80 ? '#4CAF50' : percentualGasto < 100 ? '#FFC107' : '#FF5252',
        value: percentualGasto,
        maxValue: 150, // Máximo para a barra de progresso (acima de 100% é vermelho)
      });
    }
    
    // Insight 3: Média diária de gastos
    if (transactions.length > 0) {
      const despesas = transactions.filter(t => t.tipo === 'despesa');
      
      if (despesas.length > 0) {
        // Ordenar transações por data
        const sortedTransactions = [...despesas].sort((a, b) => 
          new Date(a.data) - new Date(b.data)
        );
        
        // Calcular intervalo de dias
        const firstDate = new Date(sortedTransactions[0].data);
        const lastDate = new Date(sortedTransactions[sortedTransactions.length - 1].data);
        const daysDiff = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
        
        const mediaDiaria = totalDespesas / daysDiff;
        
        insights.push({
          id: 'daily-average',
          title: 'Média diária de gastos',
          description: `Gasto médio de R$ ${mediaDiaria.toFixed(2)} por dia`,
          icon: 'calendar-outline',
          color: '#A239FF',
          value: mediaDiaria,
          maxValue: mediaDiaria * 2, // Para a barra de progresso
        });
      }
    }
    
    // Insight 4: Economia ou Déficit
    const saldo = totalGanhos - totalDespesas;
    const situacao = saldo >= 0 ? 'economizou' : 'teve um déficit de';
    const valor = Math.abs(saldo);
    
    insights.push({
      id: 'savings',
      title: saldo >= 0 ? 'Economia no período' : 'Déficit no período',
      description: `Você ${situacao} R$ ${valor.toFixed(2)} neste período`,
      icon: saldo >= 0 ? 'save-outline' : 'alert-circle-outline',
      color: saldo >= 0 ? '#4CAF50' : '#FF5252',
      value: valor,
      maxValue: totalGanhos * 0.5, // 50% do ganho total como máximo da barra
    });
    
    return insights;
  }, []);

  // Manipulador para atualizar os dados
  const handleRefresh = useCallback(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Carregar dados quando os filtros mudarem
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData, period, category]);

  return {
    isLoading,
    transacoes,
    chartData,
    insights,
    categoryData,
    totalDespesas,
    totalGanhos,
    resumoMensal,
    error,
    handleRefresh
  };
};

export default useReportsData; 