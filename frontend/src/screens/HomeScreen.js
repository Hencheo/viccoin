import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import HomeUI from './ui/HomeUI';
import theme from '../styles/theme';
import { API_URL } from '../config';

/**
 * HomeScreen - Container para a interface principal
 * 
 * Esta tela é responsável por:
 * 1. Carregar os dados do usuário
 * 2. Carregar as transações
 * 3. Gerenciar o estado de carregamento
 * 4. Fornecer função de logout
 */
const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(0);

  // Buscar dados do usuário ao carregar a tela
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Em uma aplicação real, aqui você faria uma requisição para obter os dados do usuário
        // Usando o token JWT armazenado no AsyncStorage
        const token = await AsyncStorage.getItem('jwt_token');
        
        if (!token) {
          // Se não houver token, redireciona para a tela de login
          navigation.replace('Login');
          return;
        }
        
        // Como é apenas um teste, vamos simular os dados do usuário
        // Em um app real, você deve buscar do backend:
        // const response = await api.get('/user/profile');
        
        // Simulando a resposta da API
        const dummyData = {
          name: 'Victor Santos',
          email: 'victor@exemplo.com',
          expenses: 450,
          income: 1250,
          lastAccess: new Date().toLocaleString('pt-BR'),
        };

        // Buscar saldo e transações usando as novas funções
        await fetchUserBalance();
        await fetchTransactions();

        // Atualizar os dados do usuário
        setUserData(dummyData);
      } catch (fetchError) {
        console.error('Erro ao buscar dados:', fetchError);
        setError('Falha ao carregar dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Atualizar dados quando voltar para esta tela
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    
    return unsubscribe;
  }, [navigation]);

  // Função para determinar o ícone com base na categoria
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return 'cash-outline';
    
    const categoryLower = categoryName.toLowerCase();
    
    if (categoryLower.includes('aliment') || categoryLower.includes('mercado')) {
      return 'cart-outline';
    }
    if (categoryLower.includes('transporte') || categoryLower.includes('carro')) {
      return 'car-outline';
    }
    if (categoryLower.includes('casa') || categoryLower.includes('moradia')) {
      return 'home-outline';
    }
    if (categoryLower.includes('saude') || categoryLower.includes('médico')) {
      return 'medical-outline';
    }
    if (categoryLower.includes('educação') || categoryLower.includes('estudo')) {
      return 'school-outline';
    }
    if (categoryLower.includes('lazer') || categoryLower.includes('entreten')) {
      return 'film-outline';
    }
    
    return 'cash-outline';
  };

  // Função de logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Limpar token armazenado
      await AsyncStorage.removeItem('jwt_token');
      
      // Chamar o serviço de logout (se disponível)
      try {
        await authService.logout();
        console.log('Logout realizado com sucesso no servidor');
      } catch (error) {
        console.warn('Erro ao realizar logout no servidor:', error);
        // Continuamos com o logout local mesmo se o servidor falhar
      }
      
      // Redirecionar para login
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Falha ao encerrar sessão. Tente novamente.');
      setLoading(false);
    }
  };

  // Função para buscar o saldo atual do usuário
  const fetchUserBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const userId = await AsyncStorage.getItem('user_id') || 'anonymous';
      
      // Endpoint oficial
      const endpoint = `${API_URL}/api/health/`;
      
      console.log('Tentando buscar saldo através do endpoint:', endpoint);
      console.log('User ID:', userId);
      
      try {
        const response = await fetch(`${endpoint}?user_id=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`Status da resposta (${endpoint}):`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Dados de saldo recebidos:`, data);
          
          // Tentar encontrar o saldo nos dados retornados
          if (data && data.saldo && typeof data.saldo === 'number') {
            setBalance(data.saldo);
            return;
          } else if (data && data.balance && typeof data.balance === 'number') {
            setBalance(data.balance);
            return;
          } else if (data && data.user && data.user.saldo && typeof data.user.saldo === 'number') {
            setBalance(data.user.saldo);
            return;
          }
        } else {
          // Tentar ler a mensagem de erro
          try {
            const errorText = await response.text();
            console.warn(`Erro (${response.status}):`, errorText);
          } catch (e) {
            console.warn(`Erro ${response.status} ao acessar ${endpoint}`);
          }
        }
      } catch (endpointError) {
        console.warn(`Erro ao acessar o endpoint de saldo:`, endpointError.message);
      }
      
      // Se chegou aqui, não conseguiu obter o saldo
      console.warn('Não foi possível obter o saldo atual. Usando valor padrão.');
      // Usar valor de saldo padrão para testes
      setBalance(2547.85);
    } catch (error) {
      console.error('Erro ao buscar saldo atual:', error);
      // Usar valor de saldo padrão para testes
      setBalance(2547.85);
    }
  };

  // Função para buscar transações recentes
  const fetchTransactions = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      const userId = await AsyncStorage.getItem('user_id') || 'anonymous';
      
      // Tentar primeiro despesas, depois receitas
      const endpoints = [
        `${API_URL}/api/despesas/`,
        `${API_URL}/api/receitas/`
      ];
      
      console.log('Tentando buscar transações nos endpoints oficiais');
      console.log('User ID:', userId);
      
      let allTransactions = [];
      
      for (const endpoint of endpoints) {
        console.log(`Tentando endpoint: ${endpoint}`);
        
        try {
          const response = await fetch(`${endpoint}?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          console.log(`Status da resposta (${endpoint}):`, response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Transações recebidas (${endpoint.includes('despesas') ? 'despesas' : 'receitas'}): ${Array.isArray(data) ? data.length : 0}`);
            
            if (Array.isArray(data) && data.length > 0) {
              // É uma despesa ou receita baseado no endpoint
              const tipo = endpoint.includes('despesas') ? 'expense' : 'income';
              
              // Mapear transações para o formato esperado pela UI
              const formattedTransactions = data.map(t => {
                const date = new Date(t.data);
                // Para despesas, garantir que o valor é negativo
                const valor = tipo === 'expense' ? 
                  (t.valor > 0 ? -t.valor : t.valor) : 
                  (t.valor < 0 ? -t.valor : t.valor);
                  
                return {
                  id: t.id || Math.random().toString(36).substring(7),
                  title: t.descricao,
                  date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
                  time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  amount: valor,
                  type: tipo,
                  icon: getCategoryIcon(t.categoria_nome || t.categoria?.nome || (tipo === 'income' ? 'Receita' : 'Despesa'))
                };
              });
              
              allTransactions = [...allTransactions, ...formattedTransactions];
            }
          } else {
            console.warn(`Erro ao buscar ${endpoint.includes('despesas') ? 'despesas' : 'receitas'}: ${response.status}`);
          }
        } catch (endpointError) {
          console.warn(`Erro no endpoint ${endpoint}:`, endpointError.message);
        }
      }
      
      if (allTransactions.length > 0) {
        // Ordenar por data mais recente
        allTransactions.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateB - dateA;
        });
        
        // Limitar a 10 transações
        setTransactions(allTransactions.slice(0, 10));
        return;
      }
      
      // Se chegou aqui, usar transações padrão
      console.warn('Não foi possível obter transações. Usando valores padrão.');
      // Usar transações padrão para testes
      const defaultTransactions = [
        {
          id: '1',
          title: 'Supermercado Extra',
          date: 'Mai 23',
          time: '19:03',
          amount: -156.78,
          type: 'expense',
          icon: 'cart-outline'
        },
        {
          id: '2',
          title: 'Salário',
          date: 'Mai 20',
          time: '10:00',
          amount: 3200.00,
          type: 'income',
          icon: 'cash-outline'
        },
        {
          id: '3',
          title: 'Netflix',
          date: 'Mai 18',
          time: '15:48',
          amount: -39.90,
          type: 'expense',
          icon: 'tv-outline'
        },
        {
          id: '4',
          title: 'Uber',
          date: 'Mai 15',
          time: '17:15',
          amount: -24.50,
          type: 'expense',
          icon: 'car-outline'
        },
        {
          id: '5',
          title: 'Farmácia',
          date: 'Mai 12',
          time: '11:30',
          amount: -62.35,
          type: 'expense',
          icon: 'medical-outline'
        },
      ];
      
      setTransactions(defaultTransactions);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      // Dados simulados de transações para a tela de atividade
      const defaultTransactions = [
        {
          id: '1',
          title: 'Supermercado Extra',
          date: 'Mai 23',
          time: '19:03',
          amount: -156.78,
          type: 'expense',
          icon: 'cart-outline'
        },
        {
          id: '2',
          title: 'Salário',
          date: 'Mai 20',
          time: '10:00',
          amount: 3200.00,
          type: 'income',
          icon: 'cash-outline'
        },
        {
          id: '3',
          title: 'Netflix',
          date: 'Mai 18',
          time: '15:48',
          amount: -39.90,
          type: 'expense',
          icon: 'tv-outline'
        },
        {
          id: '4',
          title: 'Uber',
          date: 'Mai 15',
          time: '17:15',
          amount: -24.50,
          type: 'expense',
          icon: 'car-outline'
        },
        {
          id: '5',
          title: 'Farmácia',
          date: 'Mai 12',
          time: '11:30',
          amount: -62.35,
          type: 'expense',
          icon: 'medical-outline'
        },
      ];
      
      setTransactions(defaultTransactions);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent.main} />
      </View>
    );
  }
  
  return (
    <HomeUI
      userData={userData}
      transactions={transactions}
      loading={loading}
      handleLogout={handleLogout}
      navigation={navigation}
      error={error}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
});

export default HomeScreen; 