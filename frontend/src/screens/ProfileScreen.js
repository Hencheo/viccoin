import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import ProfileUI from './ui/ProfileUI';
import theme from '../styles/theme';

/**
 * ProfileScreen - Container para a interface de perfil do usuário
 * 
 * Esta tela é responsável por:
 * 1. Carregar os dados do perfil do usuário
 * 2. Fornecer funções para edição de perfil
 */
const ProfileScreen = ({ navigation }) => {
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
          income: 1250
        });
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Função para editar perfil
  const handleEditProfile = () => {
    // Em um aplicativo real, abriríamos um formulário para edição
    console.log('Editar perfil');
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent.main} />
      </View>
    );
  }
  
  return (
    <ProfileUI 
      userData={userData}
      handleEditProfile={handleEditProfile}
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

export default ProfileScreen; 