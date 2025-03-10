import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Habilitar modo offline para trabalhar com dados fictícios
const OFFLINE_MODE = false;

// URL base da API Django no Render - Atualizada com o endereço correto
const API_URL = 'https://viccoin.onrender.com';

// Cria uma instância do axios com a URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Configurações para ajudar a lidar com CORS
  withCredentials: false,  // Não enviar cookies com as requisições
  timeout: 10000,  // 10 segundos de timeout
});

// Interceptor para adicionar o token JWT nas requisições
api.interceptors.request.use(
  async (config) => {
    // Em modo offline, interrompe as requisições e simula respostas
    if (OFFLINE_MODE) {
      // Este truque impede que a requisição continue, mas de forma "silenciosa"
      throw { 
        __OFFLINE_MODE__: true, 
        config, 
        message: 'Aplicativo em modo offline, usando dados locais'
      };
    }

    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Verifica se é "erro" de modo offline (que na verdade é intencional)
    if (error.__OFFLINE_MODE__) {
      // Log silencioso para desenvolvimento, não expondo erros ao usuário
      console.log('[Modo Offline] Usando dados locais em vez de API');
      return Promise.reject({
        offline: true,
        message: 'Usando dados locais',
      });
    }

    // Apenas loga erros reais em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro na requisição API:', error.message || 'Erro desconhecido');
      if (error.response) {
        console.error('Status:', error.response.status);
      }
    }
    
    return Promise.reject(error);
  }
);

// Dados fictícios para uso offline
const dadosFictícios = {
  usuario: {
    token: 'teste_token_123',
    user: {
      id: 'user_teste_123',
      name: 'Usuário Teste',
      email: 'hencheo96@gmail.com',
    }
  }
};

// Função para testar a conexão com diferentes endpoints
export const testeAPI = {
  // Tenta descobrir endpoints de autenticação
  descobrirEndpoints: async () => {
    // Lista de possíveis endpoints para testar
    const endpointsTeste = [
      '/api/login/',
      '/api/register/',
      '/login/',
      '/register/',
      '/api/token/',
      '/auth/login/',
      '/auth/register/',
      '/users/login/',
      '/users/register/',
    ];

    const resultados = {};

    // Testa cada endpoint com uma requisição OPTIONS para descobrir se existe
    for (const endpoint of endpointsTeste) {
      try {
        const response = await api.options(endpoint);
        resultados[endpoint] = {
          status: response.status,
          headers: response.headers,
          data: response.data,
        };
      } catch (error) {
        resultados[endpoint] = {
          erro: true,
          status: error.response?.status,
          mensagem: error.message,
        };
      }
    }

    console.log('Resultados dos testes de endpoint:', resultados);
    return resultados;
  },

  // Tenta fazer uma requisição GET para a raiz da API
  testarRaiz: async () => {
    try {
      const response = await api.get('/');
      console.log('Resposta da raiz da API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao acessar a raiz da API:', error);
      throw error;
    }
  },
};

// Serviço de autenticação
export const authService = {
  // Função para registrar um novo usuário
  register: async (nome, email, senha) => {
    // Em modo offline, simular uma resposta bem-sucedida
    if (OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simular atraso de rede
      
      // Simular dados de registro
      const dadosRegistro = {
        ...dadosFictícios.usuario,
        user: {
          ...dadosFictícios.usuario.user,
          name: nome,
          email: email
        }
      };
      
      // Salvar token fictício
      await AsyncStorage.setItem('jwt_token', dadosRegistro.token);
      
      return dadosRegistro;
    }

    try {
      // Código original para registro online
      const endpoint = '/api/register/';
      
      const response = await api.post(endpoint, {
        name: nome,
        email: email,
        password: senha,
        username: email,
        nome: nome,
        senha: senha,
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('jwt_token', response.data.token);
      } else if (response.data.access) {
        await AsyncStorage.setItem('jwt_token', response.data.access);
      }
      
      return response.data;
    } catch (error) {
      if (error.offline) {
        // Se estiver offline, não trate como erro
        return dadosFictícios.usuario;
      }
      throw error;
    }
  },

  // Função para fazer login
  login: async (email, senha) => {
    console.log('=== INICIANDO LOGIN REAL ===');
    console.log('Email:', email);
    
    try {
      // Tentativa de login real com a API diretamente
      console.log('Tentando login direto com Firebase Authentication...');
      
      // URLs que tentaremos
      const loginUrls = [
        `${API_URL}/api/auth/login/`,  
        `${API_URL}/api/accounts/login/`,
        `${API_URL}/rest-auth/login/`,
        `${API_URL}/api/login/`
      ];
      
      // Tentar cada URL de login possível
      for (const loginUrl of loginUrls) {
        try {
          console.log(`Tentando URL: ${loginUrl}`);
          
          // Usar fetch em vez de axios para ter mais controle
          const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              password: senha
            })
          });
          
          console.log(`Status da resposta: ${response.status}`);
          
          if (response.ok) {
            // Se tivermos uma resposta bem-sucedida, processar os dados
            const data = await response.json();
            console.log('Resposta de login (resumo):', JSON.stringify(data).substring(0, 300));
            
            // Procurar o token em vários formatos possíveis
            let token = null;
            if (data.token) token = data.token;
            else if (data.key) token = data.key;
            else if (data.access) token = data.access;
            else if (data.auth_token) token = data.auth_token;
            else if (data.accessToken) token = data.accessToken;
            else if (data.idToken) token = data.idToken;
            
            // Se encontramos um token, salvar e retornar
            if (token) {
              console.log('Token real encontrado:', token.substring(0, 15) + '...');
              await AsyncStorage.setItem('jwt_token', token);
              
              // Salvar também o user_id se disponível
              let userId = null;
              if (data.user_id) userId = data.user_id;
              else if (data.userId) userId = data.userId;
              else if (data.id) userId = data.id;
              else if (data.uid) userId = data.uid;
              else if (data.user && data.user.id) userId = data.user.id;
              
              if (userId) {
                console.log('User ID encontrado:', userId);
                await AsyncStorage.setItem('user_id', userId.toString());
              } else {
                // Se não temos um user_id, usar o email como identificador
                const emailId = email.replace('@', '_at_').replace('.', '_dot_');
                console.log('User ID não encontrado, usando email como ID:', emailId);
                await AsyncStorage.setItem('user_id', emailId);
              }
              
              // Login bem-sucedido, retornar os dados
              return data;
            } else {
              console.warn('Resposta sem token. Formato inesperado:', data);
            }
          } else {
            // Resposta de erro - tentar obter detalhes
            try {
              const errorText = await response.text();
              console.warn(`Erro na resposta (${loginUrl}):`, errorText);
            } catch (e) {
              console.warn(`Erro na resposta (${loginUrl}):`, response.status);
            }
          }
        } catch (urlError) {
          console.warn(`Erro ao tentar ${loginUrl}:`, urlError.message);
        }
      }
      
      // Se chegamos aqui, nenhuma URL funcionou
      // Fazer autenticação direta com o Firebase Auth API
      console.log('\nTentando login diretamente na API do Firebase...');
      
      try {
        // API key do Firebase Web
        // Esta é a chave pública do Firebase, usada pelo SDKs de cliente
        const API_KEY = 'AIzaSyBVpAK1Aw1S33TpUTjxnxwVJXI1knhrZ4A';
        
        // Referência: https://firebase.google.com/docs/reference/rest/auth
        const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        
        console.log('Usando Firebase Auth REST API:', firebaseAuthUrl);
        
        const firebaseResponse = await fetch(firebaseAuthUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            password: senha,
            returnSecureToken: true
          })
        });
        
        console.log('Status da resposta Firebase:', firebaseResponse.status);
        
        if (firebaseResponse.ok) {
          const firebaseData = await firebaseResponse.json();
          console.log('Resposta Firebase (resumo):', JSON.stringify(firebaseData).substring(0, 300));
          
          // O token do Firebase está em idToken
          if (firebaseData.idToken) {
            const idToken = firebaseData.idToken;
            const userId = firebaseData.localId;
            
            console.log('Token do Firebase obtido:', idToken.substring(0, 15) + '...');
            console.log('User ID do Firebase:', userId);
            
            // Salvar o token e user ID
            await AsyncStorage.setItem('jwt_token', idToken);
            await AsyncStorage.setItem('user_id', userId);
            
            // Retornar os dados para o fluxo de login
            return {
              token: idToken,
              user_id: userId,
              email: email,
              firebase: true,
              refreshToken: firebaseData.refreshToken
            };
          }
        } else {
          // Resposta de erro do Firebase
          try {
            const firebaseError = await firebaseResponse.json();
            console.warn('Erro do Firebase:', firebaseError);
          } catch (e) {
            console.warn('Erro do Firebase (status):', firebaseResponse.status);
          }
        }
      } catch (firebaseError) {
        console.warn('Erro na tentativa Firebase:', firebaseError.message);
      }
      
      // Se chegamos aqui, todas as tentativas falharam.
      // IMPORTANTE: Não vamos mais usar token fictício!
      console.error('Todas as tentativas de login falharam.');
      throw new Error('Não foi possível autenticar. Verifique suas credenciais e conexão.');
      
    } catch (error) {
      console.error('Erro geral no login:', error.message);
      throw error;
    }
  },

  // Função para fazer logout
  logout: async () => {
    try {
      await AsyncStorage.removeItem('jwt_token');
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Função para verificar se o usuário está autenticado
  isAuthenticated: async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      return !!token;
    } catch (error) {
      return false;
    }
  },
};

export default api; 