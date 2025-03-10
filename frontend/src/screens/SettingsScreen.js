import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import SettingsUI from './ui/SettingsUI';
import theme from '../styles/theme';

/**
 * SettingsScreen - Container para a interface de configurações
 * 
 * Esta tela é responsável por:
 * 1. Carregar as configurações do usuário
 * 2. Fornecer funções para alterar configurações
 * 3. Persistir as alterações de configurações
 */
const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  
  // Simula o carregamento de dados
  useEffect(() => {
    const fetchUserData = async () => {
      // Em um aplicativo real, carregaríamos os dados do usuário de uma API ou localStorage
      try {
        // Simulando um atraso de rede
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Dados fictícios para demonstração
        setUserData({
          id: 'user123',
          name: 'Victor Santos',
          email: 'victor@example.com',
          balance: 1285.62,
          expenses: 450,
          income: 1250,
          settings: {
            paymentDate: 5, // Dia 5 de cada mês
            salary: 3500,
            isRecurringSalary: true,
            darkMode: true,
            notifications: true,
          }
        });
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Função para logout
  const handleLogout = () => {
    // Em um aplicativo real, realizaríamos o logout e redirecionaríamos para a tela de login
    navigation.navigate('Login');
  };
  
  // Função para salvar configurações
  const handleSaveSettings = (settings) => {
    // Em um aplicativo real, salvaríamos as configurações em uma API ou localStorage
    console.log('Salvando configurações:', settings);
    
    // Atualiza o estado local com as novas configurações
    setUserData(prevData => ({
      ...prevData,
      settings
    }));
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent.main} />
      </View>
    );
  }
  
  return (
    <SettingsUI 
      userData={userData}
      handleLogout={handleLogout}
      handleSaveSettings={handleSaveSettings}
      navigation={navigation}
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

export default SettingsScreen; 