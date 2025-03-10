import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import HomeUI from '../screens/ui/HomeUI';

/**
 * Container que mantém toda a lógica da HomeScreen existente
 * Separado do componente de UI para manter o design desacoplado
 */
const HomeContainer = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

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
          name: 'Usuário VicCoin',
          email: 'usuario@exemplo.com',
          balance: 1000.50,
          lastAccess: new Date().toLocaleString('pt-BR'),
        };

        // Dados simulados de transações para a tela de atividade
        const dummyTransactions = [
          {
            id: '1',
            title: "Zaporiz'ke Hwy, 40",
            date: 'Aug 23',
            time: '7:03 PM',
            amount: 88.14,
            type: 'expense',
          },
          {
            id: '2',
            title: "Zaporiz'ke Hwy, 40",
            date: 'Aug 20',
            time: '6:02 PM',
            amount: 109.76,
            type: 'expense',
          },
          {
            id: '3',
            title: 'Mechnykova St, 19',
            date: 'Aug 20',
            time: '3:48 PM',
            amount: 113.75,
            type: 'expense',
          },
          {
            id: '4',
            title: "Zaporiz'ke Hwy, 40",
            date: 'Aug 19',
            time: '5:15 PM',
            amount: 95.30,
            type: 'expense',
          },
        ];
        
        setUserData(dummyData);
        setTransactions(dummyTransactions);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        Alert.alert('Erro', 'Não foi possível carregar seus dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigation]);

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

  return (
    <HomeUI
      userData={userData}
      transactions={transactions}
      loading={loading}
      handleLogout={handleLogout}
      navigation={navigation}
    />
  );
};

export default HomeContainer; 