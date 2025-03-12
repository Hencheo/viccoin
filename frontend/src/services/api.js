import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definindo a URL base da API
const API_URL = 'https://viccoin.onrender.com/api';

// Criando uma instância do axios com a URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação a todas as requisições
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@VicCoin:token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
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
  // Adicionar uma nova despesa
  adicionarDespesa: async (dados) => {
    try {
      const response = await api.post('/transacoes/despesa/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Adicionar um novo ganho
  adicionarGanho: async (dados) => {
    try {
      const response = await api.post('/transacoes/ganho/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar ganho:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Adicionar um novo salário
  adicionarSalario: async (dados) => {
    try {
      const response = await api.post('/transacoes/salario/', dados);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar salário:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Listar transações
  listarTransacoes: async (tipo, limite) => {
    try {
      const params = {};
      if (tipo) params.tipo = tipo;
      if (limite) params.limite = limite;
      
      const response = await api.get('/transacoes/listar/', { params });
      return response.data;
    } catch (error) {
      console.log('API indisponível para listar transações:', error.message || 'Sem detalhes');
      // Retornar um objeto com estrutura consistente para desenvolvimento
      return {
        success: false,
        message: 'API indisponível durante desenvolvimento',
        data: { transacoes: [] }
      };
    }
  },
  
  // Obter resumo financeiro
  obterResumoFinanceiro: async () => {
    try {
      const response = await api.get('/transacoes/resumo/');
      return response.data;
    } catch (error) {
      console.log('API indisponível para obter resumo financeiro:', error.message || 'Sem detalhes');
      // Retornar dados de exemplo para desenvolvimento
      return {
        success: true,
        saldo: 0,
        totalDespesas: 0,
        totalGanhos: 0,
        transacoes_recentes: []
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
      
      console.log('Solicitando relatório com parâmetros:', params);
      const response = await api.get('/transacoes/relatorio/', { params });
      return response.data;
    } catch (error) {
      console.log('API indisponível para obter relatório:', error.message || 'Sem detalhes');
      // Retornar dados de exemplo para desenvolvimento
      return {
        success: true,
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
      const response = await api.put(`/transacoes/despesa/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.log('API indisponível para atualizar despesa:', error.message || 'Sem detalhes');
      // Retornar resposta de sucesso simulada para desenvolvimento
      return { success: true, message: 'Atualização simulada com sucesso (modo desenvolvimento)' };
    }
  },

  // Atualizar um ganho
  atualizarGanho: async (id, dados) => {
    try {
      const response = await api.put(`/transacoes/ganho/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.log('API indisponível para atualizar ganho:', error.message || 'Sem detalhes');
      // Retornar resposta de sucesso simulada para desenvolvimento
      return { success: true, message: 'Atualização simulada com sucesso (modo desenvolvimento)' };
    }
  },

  // Atualizar um salário
  atualizarSalario: async (id, dados) => {
    try {
      const response = await api.put(`/transacoes/salario/${id}/`, dados);
      return response.data;
    } catch (error) {
      console.log('API indisponível para atualizar salário:', error.message || 'Sem detalhes');
      // Retornar resposta de sucesso simulada para desenvolvimento
      return { success: true, message: 'Atualização simulada com sucesso (modo desenvolvimento)' };
    }
  }
};

export default api; 