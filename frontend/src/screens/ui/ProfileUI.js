import React from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../styles/theme';
import BottomNavBar from '../../components/ui/BottomNavBar';

/**
 * ProfileUI - Tela de perfil do usuário
 * 
 * ESTRUTURA DA INTERFACE:
 * 1. headerSection - Seção superior com cor de destaque
 *    - header - Cabeçalho com título
 * 
 * 2. userInfoSection - Seção com informações do usuário
 *    - avatar - Foto de perfil
 *    - nome, email, etc.
 * 
 * 3. statsSection - Seção com estatísticas do usuário
 *    - Saldo, despesas e ganhos do mês atual
 */
const ProfileUI = ({ 
  userData = {}, // Dados fictícios para demonstração
  navigation,
  handleEditProfile = () => console.log('Editar perfil') // Função fictícia
}) => {
  // Formatação do saldo para exibição em formato de moeda brasileira
  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Função para lidar com ações do botão de adicionar
  const handleAddAction = (action) => {
    console.log(`Ação selecionada: ${action}`);
    
    // Em um aplicativo real, navegaríamos para as telas correspondentes
    switch (action) {
      case 'expense':
        Alert.alert('Adicionar despesa', 'Funcionalidade em desenvolvimento');
        break;
      case 'income':
        Alert.alert('Adicionar ganho', 'Funcionalidade em desenvolvimento');
        break;
      case 'reports':
        Alert.alert('Relatórios', 'Funcionalidade em desenvolvimento');
        break;
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0A0F2C" barStyle="light-content" />
      
      {/* Seção superior com cabeçalho */}
      <View style={styles.headerSection}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
      </View>
      
      {/* Conteúdo principal com informações do usuário */}
      <ScrollView
        contentContainerStyle={styles.contentSection}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção de informações do usuário */}
        <View style={styles.userInfoSection}>
          {/* Avatar e nome */}
          <View style={styles.avatarContainer}>
            {/* Avatar placeholder */}
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            
            {/* Nome e email */}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userData.name || 'Usuário VicCoin'}</Text>
              <Text style={styles.userEmail}>{userData.email || 'usuario@exemplo.com'}</Text>
            </View>
            
            {/* Botão de editar perfil */}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Seção de estatísticas do usuário */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumo do Mês</Text>
          
          <View style={styles.statsContainer}>
            {/* Card: Saldo */}
            <View style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 208, 197, 0.1)' }]}>
                <Ionicons name="wallet-outline" size={20} color="#00D0C5" />
              </View>
              <Text style={styles.statLabel}>Saldo Atual</Text>
              <Text style={[styles.statValue, { color: '#00D0C5' }]}>
                {formatCurrency(userData.balance || 0)}
              </Text>
            </View>
            
            {/* Card: Despesas */}
            <View style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 92, 117, 0.1)' }]}>
                <Ionicons name="arrow-down-outline" size={20} color="#FF5C75" />
              </View>
              <Text style={styles.statLabel}>Despesas</Text>
              <Text style={[styles.statValue, { color: '#FF5C75' }]}>
                {formatCurrency(userData.expenses || 0)}
              </Text>
            </View>
            
            {/* Card: Ganhos */}
            <View style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 208, 197, 0.1)' }]}>
                <Ionicons name="arrow-up-outline" size={20} color="#00D0C5" />
              </View>
              <Text style={styles.statLabel}>Ganhos</Text>
              <Text style={[styles.statValue, { color: '#00D0C5' }]}>
                {formatCurrency(userData.income || 0)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Seção de informações da conta */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Informações da Conta</Text>
          
          {/* Membro desde */}
          <View style={styles.accountItem}>
            <View style={styles.accountIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.accountContent}>
              <Text style={styles.accountLabel}>Membro desde</Text>
              <Text style={styles.accountValue}>Agosto 2023</Text>
            </View>
          </View>
          
          {/* Dias de uso */}
          <View style={styles.accountItem}>
            <View style={styles.accountIconContainer}>
              <Ionicons name="time-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.accountContent}>
              <Text style={styles.accountLabel}>Dias de uso</Text>
              <Text style={styles.accountValue}>213 dias</Text>
            </View>
          </View>
          
          {/* Transações realizadas */}
          <View style={styles.accountItem}>
            <View style={styles.accountIconContainer}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.accountContent}>
              <Text style={styles.accountLabel}>Transações realizadas</Text>
              <Text style={styles.accountValue}>437</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Barra de navegação inferior */}
      <BottomNavBar 
        navigation={navigation} 
        currentScreen="Profile" 
        onAddAction={handleAddAction} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: '#0A0F2C', // Azul escuro profundo (mantendo consistência)
  },
  
  // Seção superior com cabeçalho
  headerSection: {
    backgroundColor: '#0A0F2C',
    paddingTop: theme.statusBarHeight + 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  
  // Estilo para o cabeçalho
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    marginBottom: 0,
    marginTop: 10,
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
    color: '#FFFFFF',
    letterSpacing: -0.7,
  },
  
  // Conteúdo principal
  contentSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 80, // Espaço para o bottom navigation
  },
  
  // Seção de informações do usuário
  userInfoSection: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  
  // Container do avatar e informações
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  // Avatar do usuário
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#151B3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  
  // Inicial do nome no avatar
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D0C5',
  },
  
  // Detalhes do usuário (nome e email)
  userDetails: {
    flex: 1,
  },
  
  // Nome do usuário
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  
  // Email do usuário
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  
  // Botão de editar perfil
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Título das seções
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
  },
  
  // Seção de estatísticas
  statsSection: {
    marginBottom: theme.spacing.xl,
  },
  
  // Container das estatísticas
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  // Card de estatística individual
  statCard: {
    flex: 1,
    backgroundColor: '#151B3D',
    borderRadius: 12,
    padding: theme.spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  
  // Container do ícone
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // Label da estatística
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  
  // Valor da estatística
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Seção de informações da conta
  accountSection: {
    marginBottom: theme.spacing.xxl,
  },
  
  // Item de informação da conta
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  // Container do ícone da informação da conta
  accountIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 208, 197, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  // Conteúdo da informação da conta
  accountContent: {
    flex: 1,
  },
  
  // Label da informação da conta
  accountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  
  // Valor da informação da conta
  accountValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default ProfileUI; 