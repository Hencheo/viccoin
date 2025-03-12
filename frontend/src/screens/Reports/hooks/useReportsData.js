import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { financasService } from '../../../services/api';

const useReportsData = (period = 'month', category = 'all') => {
  const [isLoading, setIsLoading] = useState(true);
  const [transacoes, setTransacoes] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [resumoMensal, setResumoMensal] = useState({});

  const user = useSelector(state => state.auth.user);

  // Função para carregar dados das transações
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!user || !user.uid) {
        console.log('Usuário não autenticado. Usando dados de exemplo.');
        loadMockData();
        return;
      }
      
      // Lógica para determinar o período de datas
      const { startDate, endDate } = getDateRange(period);
      
      try {
        // Chamar API com os filtros
        const response = await financasService.listarTransacoes(
          user.uid, 
          { startDate, endDate, category }
        );
        
        if (response && response.success) {
          const { transacoes, resumo } = response.data || {};
          
          // Processar os dados recebidos
          setTransacoes(transacoes || []);
          processTransactionData(transacoes || [], resumo || {});
        } else {
          // Carregar dados de exemplo em caso de falha da API
          console.log('Resposta da API sem sucesso. Usando dados de exemplo.');
          loadMockData();
        }
      } catch (error) {
        // API indisponível, usar dados de exemplo
        console.log('API indisponível para relatórios. Usando dados de exemplo:', error.message || 'Sem detalhes');
        loadMockData();
      }
    } catch (error) {
      // Erro geral, usar dados de exemplo
      console.log('Erro ao processar dados de relatórios. Usando dados de exemplo:', error.message || 'Erro desconhecido');
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  }, [user, period, category, loadMockData, getDateRange, processTransactionData]);

  // Função para processar os dados das transações 
  // e gerar gráficos, insights e análises
  const processTransactionData = useCallback((transactions, resumo) => {
    // 1. Calcular totais de despesas e ganhos
    const despesas = transactions.filter(t => t.tipo === 'despesa');
    const ganhos = transactions.filter(t => t.tipo === 'ganho');
    
    const totalDesp = despesas.reduce((sum, t) => sum + Number(t.valor), 0);
    const totalGan = ganhos.reduce((sum, t) => sum + Number(t.valor), 0);
    
    setTotalDespesas(totalDesp);
    setTotalGanhos(totalGan);
    setResumoMensal(resumo);
    
    // 2. Preparar dados para o gráfico
    const graphData = prepareChartData(transactions, period);
    setChartData(graphData);
    
    // 3. Preparar dados por categoria
    const categoryStats = prepareCategoryData(transactions);
    setCategoryData(categoryStats);
    
    // 4. Gerar insights
    const insightData = generateInsights(transactions, categoryStats, resumo);
    setInsights(insightData);
  }, [period]);

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
        // Mês atual
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
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
        // Mês atual (padrão)
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: today.toISOString()
    };
  }, []);

  // Preparar dados para o gráfico baseado no período
  const prepareChartData = useCallback((transactions, periodType) => {
    if (!transactions || transactions.length === 0) {
      return [];
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
          return date.toISOString().slice(5, 10); // formato "MM-DD"
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
              despesasData[index] += Number(t.valor);
            } else {
              ganhosData[index] += Number(t.valor);
            }
          }
        });
        break;
        
      case 'month':
        // Gráfico por semana para o mês
        const weeksInMonth = 4;
        labels = Array.from({ length: weeksInMonth }, (_, i) => `Semana ${i + 1}`);
        
        // Agrupar transações por semana do mês
        despesasData = new Array(weeksInMonth).fill(0);
        ganhosData = new Array(weeksInMonth).fill(0);
        
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        transactions.forEach(t => {
          const date = new Date(t.data);
          
          if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
            const index = Math.min(weekOfMonth, weeksInMonth - 1);
            
            if (t.tipo === 'despesa') {
              despesasData[index] += Number(t.valor);
            } else {
              ganhosData[index] += Number(t.valor);
            }
          }
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
          return date.toISOString().slice(0, 7); // formato "YYYY-MM"
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
              despesasData[index] += Number(t.valor);
            } else {
              ganhosData[index] += Number(t.valor);
            }
          }
        });
        break;
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
    
    // Agrupar transações por categoria
    const categories = {};
    
    transactions.forEach(t => {
      if (!categories[t.categoria]) {
        categories[t.categoria] = {
          categoria: t.categoria,
          icone: t.icone || 'help-circle-outline',
          total: 0,
          count: 0,
          percentual: 0,
        };
      }
      
      categories[t.categoria].total += Number(t.valor);
      categories[t.categoria].count += 1;
    });
    
    // Calcular total e percentuais
    const total = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);
    
    Object.keys(categories).forEach(key => {
      categories[key].percentual = Math.round((categories[key].total / total) * 100);
    });
    
    // Ordenar categorias por valor total (decrescente)
    return Object.values(categories).sort((a, b) => b.total - a.total);
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
        description: `${topCategory.categoria} representa ${topCategory.percentual}% do seu gasto total`,
        icon: topCategory.icone,
        color: '#FF5252',
        value: topCategory.percentual,
        maxValue: 100,
      });
    }
    
    // Insight 2: Relação despesas vs. receitas
    const totalDespesas = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + Number(t.valor), 0);
      
    const totalGanhos = transactions
      .filter(t => t.tipo === 'ganho')
      .reduce((sum, t) => sum + Number(t.valor), 0);
      
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
    
    // Insight 4: Tendência de gastos (comparado com o mês anterior)
    if (resumo && resumo.comparativo_mes_anterior) {
      const { percentual_variacao, direcao } = resumo.comparativo_mes_anterior;
      
      insights.push({
        id: 'spending-trend',
        title: 'Tendência de gastos',
        description: `${direcao === 'aumento' ? 'Aumento' : 'Redução'} de ${percentual_variacao}% em relação ao mês anterior`,
        icon: direcao === 'aumento' ? 'trending-up-outline' : 'trending-down-outline',
        color: direcao === 'aumento' ? '#FF5252' : '#4CAF50',
        value: percentual_variacao,
        maxValue: 100,
      });
    }
    
    return insights;
  }, []);

  // Função para carregar dados mockados de exemplo
  const loadMockData = useCallback(() => {
    // Dados de exemplo para o gráfico
    const mockChartData = getMockChartData(period);
    setChartData(mockChartData);
    
    // Dados de exemplo para categorias
    const mockCategoryData = getMockCategoryData();
    setCategoryData(mockCategoryData);
    
    // Dados de exemplo para insights
    const mockInsights = getMockInsights();
    setInsights(mockInsights);
    
    // Totais de exemplo
    setTotalDespesas(3000);
    setTotalGanhos(5000);
    setResumoMensal({
      saldo: 2000,
      categoria_mais_gasta: 'Alimentação',
      percentual_economia: 40
    });
    
    // Transações de exemplo
    setTransacoes(getMockTransactions());
  }, [period]);

  // Manipulador para atualizar os dados
  const handleRefresh = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Carregar dados quando os filtros mudarem
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions, period, category]);

  // Função para gerar transações mockadas
  const getMockTransactions = () => {
    const today = new Date();
    const getDates = () => {
      return Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - i);
        return date.toISOString();
      });
    };
    
    const dates = getDates();
    
    return [
      // Despesas
      { id: '1', tipo: 'despesa', categoria: 'Alimentação', valor: 450.90, descricao: 'Supermercado', data: dates[2], icone: 'fast-food-outline' },
      { id: '2', tipo: 'despesa', categoria: 'Alimentação', valor: 120.00, descricao: 'Restaurante', data: dates[5], icone: 'fast-food-outline' },
      { id: '3', tipo: 'despesa', categoria: 'Transporte', valor: 180.00, descricao: 'Combustível', data: dates[7], icone: 'car-outline' },
      { id: '4', tipo: 'despesa', categoria: 'Lazer', valor: 250.00, descricao: 'Cinema e jantar', data: dates[10], icone: 'game-controller-outline' },
      { id: '5', tipo: 'despesa', categoria: 'Moradia', valor: 1500.00, descricao: 'Aluguel', data: dates[15], icone: 'home-outline' },
      { id: '6', tipo: 'despesa', categoria: 'Saúde', valor: 320.00, descricao: 'Consulta médica', data: dates[18], icone: 'medkit-outline' },
      { id: '7', tipo: 'despesa', categoria: 'Educação', valor: 450.00, descricao: 'Curso online', data: dates[22], icone: 'school-outline' },
      { id: '8', tipo: 'despesa', categoria: 'Alimentação', valor: 380.50, descricao: 'Supermercado', data: dates[25], icone: 'fast-food-outline' },
      { id: '9', tipo: 'despesa', categoria: 'Transporte', valor: 150.00, descricao: 'Combustível', data: dates[27], icone: 'car-outline' },
      
      // Ganhos
      { id: '10', tipo: 'ganho', categoria: 'Salário', valor: 4500.00, descricao: 'Salário mensal', data: dates[1], icone: 'cash-outline' },
      { id: '11', tipo: 'ganho', categoria: 'Freelance', valor: 1200.00, descricao: 'Projeto website', data: dates[12], icone: 'briefcase-outline' },
      { id: '12', tipo: 'ganho', categoria: 'Investimentos', valor: 350.00, descricao: 'Dividendos', data: dates[20], icone: 'trending-up-outline' },
    ];
  };

  // Função para gerar dados de exemplo para o gráfico
  const getMockChartData = (periodType) => {
    let labels = [];
    let despesasData = [];
    let ganhosData = [];

    switch (periodType) {
      case 'week':
        labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        despesasData = [120, 180, 90, 350, 200, 430, 280];
        ganhosData = [0, 1200, 0, 0, 800, 0, 0];
        break;
      case 'month':
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        despesasData = [620, 890, 750, 980];
        ganhosData = [1200, 0, 800, 3000];
        break;
      case 'quarter':
        labels = ['Jan', 'Fev', 'Mar'];
        despesasData = [2800, 3100, 3300];
        ganhosData = [5000, 5200, 5300];
        break;
      case 'year':
        labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        despesasData = [2800, 3100, 3300, 2900, 3000, 3200, 3100, 3400, 3000, 3100, 3200, 3500];
        ganhosData = [5000, 5200, 5300, 5000, 5200, 5300, 5100, 5200, 5000, 5100, 5200, 5300];
        break;
      default:
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        despesasData = [620, 890, 750, 980];
        ganhosData = [1200, 0, 800, 3000];
    }

    return {
      labels,
      datasets: [
        {
          label: 'Despesas',
          data: despesasData,
          color: '#FF5252',
        },
        {
          label: 'Ganhos',
          data: ganhosData,
          color: '#4CAF50',
        },
      ],
    };
  };

  // Função para gerar dados de exemplo para categorias
  const getMockCategoryData = () => {
    return [
      { categoria: 'Alimentação', percentual: 25, valor: 951.40, icone: 'fast-food-outline', cor: '#FF9800' },
      { categoria: 'Moradia', percentual: 40, valor: 1500.00, icone: 'home-outline', cor: '#03A9F4' },
      { categoria: 'Transporte', percentual: 10, valor: 330.00, icone: 'car-outline', cor: '#4CAF50' },
      { categoria: 'Saúde', percentual: 8, valor: 320.00, icone: 'medkit-outline', cor: '#F44336' },
      { categoria: 'Educação', percentual: 12, valor: 450.00, icone: 'school-outline', cor: '#9C27B0' },
      { categoria: 'Lazer', percentual: 5, valor: 250.00, icone: 'game-controller-outline', cor: '#3F51B5' },
    ];
  };

  // Função para gerar insights de exemplo
  const getMockInsights = () => {
    return [
      {
        titulo: 'Redução em Gastos',
        descricao: 'Você gastou 15% menos em comparação ao mês anterior.',
        tipo: 'positivo',
        icone: 'trending-down-outline',
      },
      {
        titulo: 'Categoria Principal',
        descricao: 'Moradia representa 40% dos seus gastos mensais.',
        tipo: 'neutro',
        icone: 'pie-chart-outline',
      },
      {
        titulo: 'Dica de Economia',
        descricao: 'Seus gastos com alimentação aumentaram 8% este mês.',
        tipo: 'negativo',
        icone: 'fast-food-outline',
      },
    ];
  };

  return {
    isLoading,
    transacoes,
    chartData,
    insights,
    categoryData,
    totalDespesas,
    totalGanhos,
    resumoMensal,
    handleRefresh
  };
};

export default useReportsData; 