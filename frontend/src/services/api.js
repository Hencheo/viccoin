import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { prepareDataForAPI } from '../utils/formatters';

// Definindo a URL base da API
const API_URL = 'https://viccoin.onrender.com/api';

// Criando uma instância do axios com a URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Verificar conectividade com a API
const testarConexaoAPI = async () => {
  try {
    console.log(`🔌 Testando conexão com a API: ${API_URL}`);
    const response = await axios.get('https://viccoin.onrender.com');
    console.log(`✅ API está disponível! Resposta: ${response.status}`);
    console.log(`✅ API endpoints:`, response.data.endpoints);
    return true;
  } catch (error) {
    console.error(`❌ API não está acessível: ${error.message}`);
    console.error('Detalhes:', error.response?.data || 'Sem dados na resposta');
    return false;
  }
};

// Executar teste de conexão
testarConexaoAPI();

// Interceptor para adicionar o token de autenticação a todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@VicCoin:token');
    
    // Lista de endpoints importantes para logging
    const importantEndpoints = [
      '/users/login/',
      '/users/register/',
      '/configuracoes/salario/'
    ];
    
    // Verificar se é um endpoint importante
    const isImportantEndpoint = importantEndpoints.some(endpoint => 
      config.url.includes(endpoint)
    );
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Log apenas para endpoints importantes
      if (isImportantEndpoint) {
        console.log(`🔒 Autenticando requisição para: ${config.url}`);
      }
    } else {
      // Alertar apenas para endpoints que precisam de autenticação e são importantes
      if (isImportantEndpoint) {
        console.warn(`⚠️ ALERTA: Requisição sem token para: ${config.url}`);
      }
    }
    
    // Log de requisição apenas para endpoints importantes
    if (isImportantEndpoint) {
      console.log(`📡 Enviando requisição: ${config.method.toUpperCase()} ${config.url}`);
      
      if (config.data && isImportantEndpoint) {
        console.log('📦 Dados da requisição:', JSON.stringify(config.data, null, 2));
      }
    }
    
    return config;
  },
  (error) => {
    // Sempre loga erros no interceptor
    console.error('❌ Erro no interceptor de requisição:', error.message);
    return Promise.reject(error);
  }
);

// Adicionar interceptor de resposta
api.interceptors.response.use(
  (response) => {
    // Lista de endpoints importantes para logging
    const importantEndpoints = [
      '/users/login/',
      '/users/register/',
      '/configuracoes/salario/'
    ];
    
    // Verificar se é um endpoint importante
    const isImportantEndpoint = importantEndpoints.some(endpoint => 
      response.config.url.includes(endpoint)
    );
    
    // Log apenas para endpoints importantes
    if (isImportantEndpoint) {
      console.log(`✅ Resposta de ${response.config.url} - Status: ${response.status}`);
      
      // Log de dados da resposta apenas para endpoints importantes
      if (typeof response.data === 'object') {
        console.log('📦 Resposta:', JSON.stringify(response.data, null, 2));
      }
    }
    
    return response;
  },
  (error) => {
    // Sempre loga erros de resposta
    console.error(`❌ Erro na resposta de ${error.config?.url || 'desconhecido'} - Status: ${error.response?.status || 'desconhecido'}`);
    console.error('📄 Mensagem de erro:', error.message);
    
    return Promise.reject(error);
  }
);

// Funções para comunicação com o backend
export const authService = {
  // Função para realizar login
  login: async (email, password) => {
    try {
      console.log('Enviando requisição de login para:', `${API_URL}/users/login/`);
      const response = await api.post('/users/login/', { email, password });
      console.log('Resposta completa da API:', response);
      
      if (response.data.success) {
        console.log('Login bem-sucedido, dados do usuário:', response.data.user);
        // Armazenar o token e os dados do usuário no AsyncStorage
        await AsyncStorage.setItem('@VicCoin:token', response.data.token);
        await AsyncStorage.setItem('@VicCoin:user', JSON.stringify(response.data.user));
        
        // Verificar se os dados foram salvos corretamente
        const savedUser = await AsyncStorage.getItem('@VicCoin:user');
        const savedToken = await AsyncStorage.getItem('@VicCoin:token');
        console.log('Dados salvos no AsyncStorage:', { 
          user: savedUser ? 'Presente' : 'Ausente', 
          token: savedToken ? 'Presente' : 'Ausente' 
        });
      } else {
        console.warn('Login falhou:', response.data.message);
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro detalhado ao fazer login:', error);
      console.error('Resposta de erro:', error.response?.data);
      throw error;
    }
  },
  
  // Função para realizar cadastro
  register: async (nome, email, password) => {
    try {
      const response = await api.post('/users/register/', { nome, email, password });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Função para obter dados do perfil do usuário
  getProfile: async () => {
    try {
      const response = await api.get('/users/perfil/');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter perfil:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Função para fazer logout
  logout: async () => {
    try {
      // Remover os dados do AsyncStorage
      await AsyncStorage.removeItem('@VicCoin:token');
      await AsyncStorage.removeItem('@VicCoin:user');
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
      throw error;
    }
  },
};

// Novo serviço para transações financeiras
export const financasService = {
  // Obter URL base da API
  getBaseUrl: () => API_URL,
  
  // Verificar se a API está disponível
  verificarAPI: async () => {
    return await testarConexaoAPI();
  },
  
  // Adicionar uma nova despesa
  adicionarDespesa: async (dados) => {
    try {
      console.log(`🛑 Verificando estrutura da despesa antes de enviar:`, JSON.stringify(dados, null, 2));
      
      // Verificar se o objeto possui todos os campos necessários
      const camposRequeridos = ['valor', 'data', 'categoria'];
      const camposFaltantes = camposRequeridos.filter(campo => !dados[campo]);
      
      if (camposFaltantes.length > 0) {
        console.error(`❌ Erro: Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`);
        return {
          success: false,
          message: `Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`
        };
      }

      // Verificar se o token está presente
      const token = await AsyncStorage.getItem('@VicCoin:token');
      if (!token) {
        console.error('❌ Erro: Token de autenticação ausente');
        return {
          success: false,
          message: 'Token de autenticação ausente. Por favor, faça login novamente.'
        };
      }
      
      // Criar objeto de dados formatado corretamente
      const dadosFormatados = prepareDataForAPI({
        ...dados,
        tipo: 'despesa'
      });
      
      console.log(`📡 Realizando requisição POST para ${API_URL}/transacoes/despesa/ com dados formatados:`, JSON.stringify(dadosFormatados, null, 2));
      
      // Configuração da requisição
      const config = {
        method: 'post',
        url: `${API_URL}/transacoes/despesa/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: dadosFormatados
      };
      console.log('🔧 Configuração completa da requisição:', JSON.stringify(config, null, 2));
      
      // Tentar a requisição
      try {
        // Fazer requisição direto com axios para mais controle
        const response = await axios(config);
        
        console.log('✅ Resposta ao adicionar despesa (status):', response.status);
        console.log('✅ Resposta ao adicionar despesa (dados):', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.status >= 200 && response.status < 300) {
          return {
            success: true,
            message: 'Despesa adicionada com sucesso',
            data: response.data
          };
        } else {
          console.error('⚠️ Resposta sem dados ou com status inesperado:', response.status);
          return {
            success: false,
            message: 'Resposta do servidor sem dados ou com status inesperado'
          };
        }
      } catch (reqError) {
        console.error('❌ Erro na requisição:', reqError.message);
        console.error('📄 Detalhes do erro:', reqError.response?.data || 'Sem dados na resposta');
        console.error('🔍 Status code:', reqError.response?.status || 'Sem status code');
        
        // Tentar alternativa com api.post
        console.log('🔄 Tentando requisição alternativa com api.post...');
        try {
          const altResponse = await api.post('/transacoes/despesa/', dadosFormatados);
          console.log('✅ Requisição alternativa bem-sucedida:', altResponse.status);
          return {
            success: true,
            message: 'Despesa adicionada com sucesso (método alternativo)',
            data: altResponse.data
          };
        } catch (altError) {
          console.error('❌ Requisição alternativa também falhou:', altError.message);
          throw reqError; // Lançar o erro original
        }
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar despesa:', error);
      console.error('📄 Detalhes do erro:', error.response?.data || error.message);
      console.error('🔍 Status code:', error.response?.status);
      console.error('🧩 Headers da resposta:', JSON.stringify(error.response?.headers, null, 2));
      
      // Criar resposta com informações detalhadas sobre o erro
      return {
        success: false,
        message: `Erro ao adicionar despesa: ${error.message}`,
        errorDetails: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
      };
    }
  },
  
  // Adicionar um novo ganho
  adicionarGanho: async (dados) => {
    try {
      console.log(`🛑 Verificando estrutura do ganho antes de enviar:`, JSON.stringify(dados, null, 2));
      
      // Verificar se o objeto possui todos os campos necessários
      const camposRequeridos = ['valor', 'data', 'categoria'];
      const camposFaltantes = camposRequeridos.filter(campo => !dados[campo]);
      
      if (camposFaltantes.length > 0) {
        console.error(`❌ Erro: Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`);
        return {
          success: false,
          message: `Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`
        };
      }

      // Verificar se o token está presente
      const token = await AsyncStorage.getItem('@VicCoin:token');
      if (!token) {
        console.error('❌ Erro: Token de autenticação ausente');
        return {
          success: false,
          message: 'Token de autenticação ausente. Por favor, faça login novamente.'
        };
      }
      
      // Criar objeto de dados formatado corretamente
      const dadosFormatados = prepareDataForAPI({
        ...dados,
        tipo: 'ganho'
      });
      
      console.log(`📡 Realizando requisição POST para ${API_URL}/transacoes/ganho/ com dados formatados:`, JSON.stringify(dadosFormatados, null, 2));
      
      // Configuração da requisição
      const config = {
        method: 'post',
        url: `${API_URL}/transacoes/ganho/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        data: dadosFormatados
      };
      console.log('🔧 Configuração completa da requisição:', JSON.stringify(config, null, 2));
      
      // Tentar a requisição
      try {
        // Fazer requisição direto com axios para mais controle
        const response = await axios(config);
        
        console.log('✅ Resposta ao adicionar ganho (status):', response.status);
        console.log('✅ Resposta ao adicionar ganho (dados):', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.status >= 200 && response.status < 300) {
          return {
            success: true,
            message: 'Ganho adicionado com sucesso',
            data: response.data
          };
        } else {
          console.error('⚠️ Resposta sem dados ou com status inesperado:', response.status);
          return {
            success: false,
            message: 'Resposta do servidor sem dados ou com status inesperado'
          };
        }
      } catch (reqError) {
        console.error('❌ Erro na requisição:', reqError.message);
        console.error('📄 Detalhes do erro:', reqError.response?.data || 'Sem dados na resposta');
        console.error('🔍 Status code:', reqError.response?.status || 'Sem status code');
        
        // Tentar alternativa com api.post
        console.log('🔄 Tentando requisição alternativa com api.post...');
        try {
          const altResponse = await api.post('/transacoes/ganho/', dadosFormatados);
          console.log('✅ Requisição alternativa bem-sucedida:', altResponse.status);
          return {
            success: true,
            message: 'Ganho adicionado com sucesso (método alternativo)',
            data: altResponse.data
          };
        } catch (altError) {
          console.error('❌ Requisição alternativa também falhou:', altError.message);
          throw reqError; // Lançar o erro original
        }
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar ganho:', error);
      console.error('📄 Detalhes do erro:', error.response?.data || error.message);
      console.error('🔍 Status code:', error.response?.status);
      console.error('🧩 Headers da resposta:', JSON.stringify(error.response?.headers, null, 2));
      
      // Criar resposta com informações detalhadas sobre o erro
      return {
        success: false,
        message: `Erro ao adicionar ganho: ${error.message}`,
        errorDetails: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
      };
    }
  },
  
  // Adicionar um novo salário
  adicionarSalario: async (dados) => {
    try {
      console.log(`🛑 Verificando estrutura do salário antes de enviar:`, JSON.stringify(dados, null, 2));
      
      // Verificar se o objeto possui todos os campos necessários
      const camposRequeridos = ['valor', 'data_recebimento'];
      const camposFaltantes = camposRequeridos.filter(campo => !dados[campo]);
      
      if (camposFaltantes.length > 0) {
        console.error(`❌ Erro: Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`);
        return {
          success: false,
          message: `Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`
        };
      }

      // Verificar se o token está presente
      const token = await AsyncStorage.getItem('@VicCoin:token');
      if (!token) {
        console.error('❌ Erro: Token de autenticação ausente');
        return {
          success: false,
          message: 'Token de autenticação ausente. Por favor, faça login novamente.'
        };
      }
      
      // Adicionar campos padrão para salário
      const dadosFormatados = {
        ...dados,
        categoria: dados.categoria || '1', // Categoria padrão para salário
        periodo: dados.periodo || 'mensal',
        recorrente: dados.recorrente !== undefined ? dados.recorrente : true,
        tipo: 'salario',
        // Garantir que o valor seja numérico
        valor: typeof dados.valor === 'string' ? parseFloat(dados.valor) : dados.valor,
        // Garantir formato correto para data_recebimento
        data_recebimento: dados.data_recebimento ? dados.data_recebimento : new Date().toISOString().split('T')[0],
        // Garantir que o campo data também esteja presente
        data: dados.data || new Date().toISOString().split('T')[0] // Data atual do registro se não fornecida
      };
      
      console.log(`📡 Realizando requisição POST para ${API_URL}/transacoes/salario/ com dados formatados:`, JSON.stringify(dadosFormatados, null, 2));
      
      // ALTERAÇÃO: Usar diretamente a instância api em vez de criar uma configuração personalizada
      // Isso garante que todas as configurações padrão da instância api são aplicadas corretamente
      try {
        // Fazer requisição usando a instância api diretamente
        const response = await api.post('/transacoes/salario/', dadosFormatados);
        
        console.log('✅ Resposta ao adicionar salário (status):', response.status);
        console.log('✅ Resposta ao adicionar salário (dados):', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.status >= 200 && response.status < 300) {
          // Se o backend retornar um id específico, usamos ele
          const salarioId = response.data.salario_id || response.data.id || 
                           (typeof response.data === 'object' && response.data.data?.id) || null;
          
          console.log('🔑 ID do salário criado:', salarioId);
          
          // Verificar se o salário foi realmente salvo consultando a API
          try {
            const verificacao = await api.get('/transacoes/listar/', { params: { tipo: 'salario', limite: 1 } });
            console.log('🔍 Verificação após salvar:', verificacao.data.transacoes?.length ? 'Salário encontrado' : 'Salário NÃO encontrado');
          } catch (err) {
            console.log('⚠️ Não foi possível verificar se o salário foi salvo');
          }
          
          return {
            success: true,
            message: 'Salário adicionado com sucesso',
            salario_id: salarioId,
            data: response.data
          };
        } else {
          console.error('⚠️ Resposta sem dados ou com status inesperado:', response.status);
          return {
            success: false,
            message: 'Resposta do servidor sem dados ou com status inesperado'
          };
        }
      } catch (error) {
        console.error('❌ Erro ao adicionar salário:', error);
        console.error('📄 Detalhes do erro:', error.response?.data || error.message);
        console.error('🔍 Status code:', error.response?.status);
        console.error('🧩 Headers da resposta:', JSON.stringify(error.response?.headers, null, 2));
        
        // Criar resposta com informações detalhadas sobre o erro
        return {
          success: false,
          message: `Erro ao adicionar salário: ${error.message}`,
          errorDetails: {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          }
        };
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar salário:', error);
      console.error('📄 Detalhes do erro:', error.response?.data || error.message);
      console.error('🔍 Status code:', error.response?.status);
      console.error('🧩 Headers da resposta:', JSON.stringify(error.response?.headers, null, 2));
      
      // Criar resposta com informações detalhadas sobre o erro
      return {
        success: false,
        message: `Erro ao adicionar salário: ${error.message}`,
        errorDetails: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
      };
    }
  },
  
  // Listar transações
  listarTransacoes: async (tipo, limite) => {
    try {
      const params = {};
      if (tipo) params.tipo = tipo;
      if (limite) params.limite = limite;
      
      // Reduzir logs para esta função que é chamada com frequência
      const isSalaryCheck = tipo === 'salario' && limite === 1;
      
      // Se for apenas uma verificação de salário, não exibir logs
      if (!isSalaryCheck) {
        console.log(`Realizando requisição GET para ${API_URL}/transacoes/listar/ com parâmetros:`, params);
      }
      
      const response = await api.get('/transacoes/listar/', { params });
      
      // Se for apenas uma verificação de salário, não exibir logs
      if (!isSalaryCheck) {
        console.log('Resposta da API para listar transações:', response.data);
      }
      
      return response.data;
    } catch (error) {
      // Sempre registre erros
      console.error('Erro ao listar transações:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      
      // Para não quebrar a aplicação, retornamos um objeto vazio mas com status de erro
      return {
        success: false,
        message: `Erro real ao comunicar com API: ${error.message}`,
        transacoes: [] // Estrutura consistente com o retorno de sucesso
      };
    }
  },
  
  // Obter resumo financeiro
  obterResumoFinanceiro: async () => {
    try {
      console.log(`Realizando requisição GET para ${API_URL}/transacoes/resumo/`);
      const response = await api.get('/transacoes/resumo/');
      console.log('Resposta ao obter resumo financeiro:', response.data);
      
      // Verificar se o objeto de dados existe
      if (!response || !response.data) {
        console.error('Resposta inválida do servidor ao obter resumo financeiro');
        return {
          success: false,
          saldo: 0,
          totalDespesas: 0,
          totalGanhos: 0,
          transacoesRecentes: []
        };
      }
      
      // Se o backend já enviou um objeto formatado com sucesso, usar os valores dele
      if (response.data.success) {
        // Garantir que as propriedades sempre tenham valores numéricos, mesmo para usuários novos
        const totalGanhos = parseFloat(response.data.total_ganhos || 0);
        const totalDespesas = parseFloat(response.data.total_despesas || 0);
        
        // Calcular o saldo manualmente para garantir consistência
        // Usar o valor do backend apenas se não pudermos calcular manualmente
        const saldoCalculado = totalGanhos - totalDespesas;
        const saldoFinal = isNaN(saldoCalculado) 
          ? parseFloat(response.data.saldo || 0) 
          : saldoCalculado;
          
        console.log('📊 Resumo calculado manualmente:', {
          totalGanhos,
          totalDespesas,
          saldoCalculado,
          saldoFinal
        });
          
        return {
          success: true,
          saldo: saldoFinal,
          totalDespesas: totalDespesas,
          totalGanhos: totalGanhos,
          transacoesRecentes: response.data.transacoes_recentes || []
        };
      }
      
      // Se não houver sucesso, fazer uma consulta alternativa para calcular manualmente
      try {
        // Buscar todas as transações para calcular o saldo manualmente
        console.log('Buscando todas as transações para calcular saldo manualmente...');
        const todasTransacoes = await api.get('/transacoes/listar/');
        
        if (todasTransacoes.data.success && todasTransacoes.data.transacoes) {
          const transacoes = todasTransacoes.data.transacoes;
          let totalGanhos = 0;
          let totalDespesas = 0;
          
          // Somar todas as transações manualmente
          transacoes.forEach(transacao => {
            const valor = parseFloat(transacao.valor || 0);
            if (!isNaN(valor)) {
              if (transacao.tipo === 'despesa') {
                totalDespesas += valor;
              } else if (transacao.tipo === 'ganho' || transacao.tipo === 'salario') {
                totalGanhos += valor;
              }
            }
          });
          
          const saldo = totalGanhos - totalDespesas;
          
          console.log('📊 Resumo calculado manualmente a partir de todas as transações:', {
            totalGanhos,
            totalDespesas,
            saldo
          });
          
          return {
            success: true,
            saldo: saldo,
            totalDespesas: totalDespesas,
            totalGanhos: totalGanhos,
            transacoesRecentes: transacoes.slice(0, 5) // Pegar as 5 primeiras como recentes
          };
        }
      } catch (altError) {
        console.error('Erro ao calcular saldo manualmente:', altError.message);
      }
      
      // Se todas as tentativas falharem, retornar objeto com zeros
      return {
        success: false,
        saldo: 0,
        totalDespesas: 0,
        totalGanhos: 0,
        transacoesRecentes: []
      };
    } catch (error) {
      console.error('Erro ao obter resumo financeiro:', error.message);
      // Em caso de erro, retornar objeto com zeros
      return {
        success: false,
        saldo: 0,
        totalDespesas: 0,
        totalGanhos: 0,
        transacoesRecentes: [],
        error: error.message || 'Erro desconhecido'
      };
    }
  },
  
  // Obter relatório por período
  obterRelatorioPorPeriodo: async (periodo, dataInicio, dataFim, tipo, limite) => {
    try {
      const params = {};
      if (periodo) params.periodo = periodo;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      if (tipo) params.tipo = tipo;
      if (limite) params.limite = limite;
      
      console.log(`Realizando requisição GET para ${API_URL}/transacoes/relatorio/ com parâmetros:`, params);
      const response = await api.get('/transacoes/relatorio/', { params });
      console.log('Resposta ao obter relatório:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatório:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      // Retornamos um objeto com erro real para que a UI possa tratar adequadamente
      return {
        success: false,
        message: `Erro ao obter relatório: ${error.message}`,
        data: {
          transacoes: [],
          categoria_mais_gasta: '',
          total_por_categorias: [],
          periodo: periodo || 'mensal'
        }
      };
    }
  },

  // Atualizar uma despesa
  atualizarDespesa: async (id, dados) => {
    try {
      console.log(`Realizando requisição PUT para ${API_URL}/transacoes/despesa/${id}/ com dados:`, dados);
      const response = await api.put(`/transacoes/despesa/${id}/`, dados);
      console.log('Resposta ao atualizar despesa:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      // Retornar resposta com erro real para que a UI possa tratar adequadamente
      return { 
        success: false, 
        message: `Erro ao atualizar despesa: ${error.message}` 
      };
    }
  },

  // Atualizar um ganho
  atualizarGanho: async (id, dados) => {
    try {
      console.log(`Realizando requisição PUT para ${API_URL}/transacoes/ganho/${id}/ com dados:`, dados);
      const response = await api.put(`/transacoes/ganho/${id}/`, dados);
      console.log('Resposta ao atualizar ganho:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar ganho:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      // Retornar resposta com erro real para que a UI possa tratar adequadamente
      return { 
        success: false, 
        message: `Erro ao atualizar ganho: ${error.message}` 
      };
    }
  },

  // Obter configuração de salário
  obterSalario: async () => {
    try {
      // Usar diretamente a busca de transações do tipo salário
      // já que a rota /configuracoes/salario/ não existe
      const response = await api.get('/transacoes/listar/', { 
        params: { tipo: 'salario', limite: 1 } 
      });
      
      if (response.data && response.data.success && 
          response.data.transacoes && response.data.transacoes.length > 0) {
        return {
          success: true,
          salario: response.data.transacoes[0]
        };
      }
      
      // Se não encontrar nada, retornar vazio
      return {
        success: true,
        salario: null
      };
    } catch (error) {
      console.error('Erro ao obter configuração de salário:', error.message);
      // Para não quebrar a aplicação, retornamos um objeto com status de erro
      return {
        success: false,
        message: 'Erro ao obter configuração de salário',
        salario: null
      };
    }
  },
  
  // Configurar salário (adicionar ou atualizar)
  configurarSalario: async (dados, id = null) => {
    try {
      console.log(`🔍 Iniciando configurarSalario - ${id ? 'Atualização' : 'Criação'}`);
      
      // Verificar token
      const token = await AsyncStorage.getItem('@VicCoin:token');
      if (!token) {
        console.error('❌ Erro: Token de autenticação ausente');
        return {
          success: false,
          message: 'Token de autenticação ausente. Por favor, faça login novamente.'
        };
      }
      
      // Adicionar campos padrão
      const dadosFormatados = {
        ...dados,
        categoria: dados.categoria || '1',
        periodo: dados.periodo || 'mensal',
        recorrente: dados.recorrente !== undefined ? dados.recorrente : true,
        tipo: 'salario', // Usar tipo salario em vez de configuracao_salario
        valor: typeof dados.valor === 'string' ? parseFloat(dados.valor) : dados.valor,
        data_recebimento: dados.data_recebimento || new Date().toISOString().split('T')[0],
        data: dados.data || new Date().toISOString().split('T')[0] // Data atual do registro se não fornecida
      };
      
      console.log(`📦 Dados formatados do salário:`, JSON.stringify(dadosFormatados, null, 2));
      
      let response;
      
      if (id) {
        // Atualizar configuração existente
        console.log(`📡 Atualizando salário existente (ID: ${id})`);
        response = await api.put(`/transacoes/salario/${id}/`, dadosFormatados);
      } else {
        // Adicionar nova configuração
        console.log(`📡 Criando novo salário`);
        response = await api.post('/transacoes/salario/', dadosFormatados);
      }
      
      // Verificar se a resposta contém dados
      if (response && response.data) {
        console.log(`✅ Resposta do servidor:`, JSON.stringify(response.data, null, 2));
        
        const salarioId = response.data.id || response.data.salario_id || null;
        console.log(`🔑 ID do salário: ${salarioId || 'Não retornado'}`);
        
        return {
          success: true,
          message: 'Configurações de salário salvas com sucesso',
          salario_id: salarioId,
          data: response.data
        };
      } else {
        console.error(`⚠️ Resposta sem dados ou inesperada:`, response);
        return {
          success: false,
          message: 'Resposta do servidor sem dados ou inesperada'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao configurar salário:', error.message);
      console.error('📄 Detalhes do erro:', error.response?.data || error.message);
      console.error('🔍 Status code:', error.response?.status || 'Desconhecido');
      
      return { 
        success: false, 
        message: `Erro ao configurar salário: ${error.message}` 
      };
    }
  },

  // Atualizar um salário
  atualizarSalario: async (id, dados) => {
    try {
      console.log(`Realizando requisição PUT para ${API_URL}/transacoes/salario/${id}/ com dados:`, dados);
      
      // Verificar se o ID é válido
      if (!id) {
        console.error('❌ Erro: ID do salário não informado');
        return {
          success: false,
          message: 'ID do salário não informado'
        };
      }
      
      // Adicionar campos padrão para garantir consistência
      const dadosFormatados = {
        ...dados,
        categoria: dados.categoria || '1', // Categoria padrão para salário
        periodo: dados.periodo || 'mensal',
        recorrente: dados.recorrente !== undefined ? dados.recorrente : true,
        tipo: 'salario',
        // Garantir que o valor seja numérico
        valor: typeof dados.valor === 'string' ? parseFloat(dados.valor) : dados.valor,
        // Garantir formato correto para data_recebimento
        data_recebimento: dados.data_recebimento ? dados.data_recebimento : new Date().toISOString().split('T')[0],
        // Garantir que o campo data também esteja presente
        data: dados.data || new Date().toISOString().split('T')[0] // Data atual do registro se não fornecida
      };
      
      console.log('📝 Dados formatados para atualização:', JSON.stringify(dadosFormatados, null, 2));
      
      const response = await api.put(`/transacoes/salario/${id}/`, dadosFormatados);
      console.log('Resposta ao atualizar salário:', response.data);
      return {
        ...response.data,
        success: response.data.success !== false
      };
    } catch (error) {
      console.error('Erro ao atualizar salário:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      // Tentar método alternativo para atualizar
      try {
        console.log('🔄 Tentando método alternativo para atualizar salário...');
        const altResponse = await api.patch(`/transacoes/salario/${id}/`, dados);
        console.log('✅ Requisição alternativa bem-sucedida:', altResponse.status);
        return {
          ...altResponse.data,
          success: true,
          message: 'Salário atualizado com sucesso (método alternativo)'
        };
      } catch (altError) {
        console.error('❌ Método alternativo também falhou:', altError.message);
      }
      
      // Retornar resposta com erro real para que a UI possa tratar adequadamente
      return { 
        success: false, 
        message: `Erro ao atualizar salário: ${error.message}` 
      };
    }
  }
};

export default api; 