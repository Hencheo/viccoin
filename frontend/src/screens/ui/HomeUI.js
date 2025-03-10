import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, FlatList, ActivityIndicator as RNActivityIndicator, Image, Modal, Animated, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import theme from '../../styles/theme';
import Card from '../../components/ui/Card';
import TransactionItem from '../../components/ui/TransactionItem';
import BottomNavBar from '../../components/ui/BottomNavBar';

/**
 * HomeUI - Tela principal do aplicativo VicCoin
 * 
 * ESTRUTURA DA INTERFACE:
 * 1. headerSection - Seção superior com cor de destaque (40% da tela)
 *    - header - Cabeçalho com título e ícone
 *    - financeCardContainer - Container do cartão financeiro (65% da headerSection)
 *      - financeCard - Cartão financeiro principal
 * 
 * 2. contentSection - Seção inferior com lista de transações
 *    - transactionsList - Lista rolável de transações
 * 
 * 3. navigationBar - Barra de navegação inferior fixa
 */
const HomeUI = ({ 
  userData, 
  transactions, 
  loading, 
  handleLogout, 
  navigation,
  error
}) => {
  // Estado para controlar o dropdown
  const [dropdownVisible, setDropdownVisible] = useState(false);
  
  // Estado para armazenar a categoria selecionada
  const [selectedCategory, setSelectedCategory] = useState({
    id: 'daily_expenses',
    title: 'Total diário',
    value: 'R$ 28,75'
  });
  
  // Estado para controlar qual tipo de transação mostrar (despesas ou ganhos)
  const [transactionType, setTransactionType] = useState('all'); // 'all', 'expenses', 'income'
  
  // Valor da animação para transição entre listas
  const [slideAnimation] = useState(new Animated.Value(0));
  
  // Dados fictícios para transações de despesas
  const expensesTransactions = [
    { id: 'exp1', title: 'Supermercado Extra', date: 'Ago 25', time: '14:30', amount: '125,90', type: 'expense', icon: 'cart-outline' },
    { id: 'exp2', title: 'Farmácia São Paulo', date: 'Ago 24', time: '09:15', amount: '78,45', type: 'expense', icon: 'medical-outline' },
    { id: 'exp3', title: 'Posto Shell', date: 'Ago 23', time: '18:45', amount: '150,00', type: 'expense', icon: 'car-outline' },
    { id: 'exp4', title: 'Netflix', date: 'Ago 22', time: '00:01', amount: '39,90', type: 'expense', icon: 'film-outline' },
    { id: 'exp5', title: 'Restaurante Sabor Brasil', date: 'Ago 21', time: '12:30', amount: '65,80', type: 'expense', icon: 'restaurant-outline' }
  ];
  
  // Dados fictícios para transações de ganhos
  const incomeTransactions = [
    { id: 'inc1', title: 'Salário', date: 'Ago 05', time: '08:00', amount: '3.500,00', type: 'income', icon: 'cash-outline' },
    { id: 'inc2', title: 'Freelance Design', date: 'Ago 15', time: '14:20', amount: '750,00', type: 'income', icon: 'brush-outline' },
    { id: 'inc3', title: 'Dividendos', date: 'Ago 12', time: '09:45', amount: '320,80', type: 'income', icon: 'trending-up-outline' },
    { id: 'inc4', title: 'Reembolso', date: 'Ago 18', time: '11:30', amount: '125,40', type: 'income', icon: 'arrow-undo-outline' },
    { id: 'inc5', title: 'Venda online', date: 'Ago 20', time: '16:15', amount: '280,00', type: 'income', icon: 'bag-outline' }
  ];
  
  // Opções do dropdown
  const dropdownOptions = [
    { id: 'daily_expenses', title: 'Total diário', value: 'R$ 28,75' },
    { id: 'monthly_total', title: 'Total mensal', value: 'R$ 862,35' },
    { id: 'yearly_total', title: 'Total anual', value: 'R$ 10.374,20' }
  ];
  
  // Função para selecionar uma categoria
  const selectCategory = (category) => {
    setSelectedCategory(category);
    setDropdownVisible(false); // Fecha o dropdown após seleção
  };

  // Função para selecionar o tipo de transação (despesas ou ganhos) com animação
  const handleTransactionTypeSelect = (type) => {
    if (type === transactionType) return; // Evita animação desnecessária se clicar no mesmo tipo
    
    // Animação deslizando para a direita ou esquerda dependendo do tipo
    const toValue = type === 'expenses' ? -300 : 300;
    
    Animated.timing(slideAnimation, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTransactionType(type);
      
      // Reset da animação para a posição inicial com nova lista
      slideAnimation.setValue(0);
    });
  };

  // Função para lidar com ações do botão de adicionar
  const handleAddAction = (action) => {
    // Se a ação for 'menu', abrimos o menu de opções
    if (action === 'menu') {
      // Aqui podemos criar um modal ou um menu popup
      Alert.alert(
        "Adicionar",
        "O que você deseja adicionar?",
        [
          {
            text: "Adicionar Despesa",
            onPress: () => handleAddActionOption('expense')
          },
          {
            text: "Adicionar Ganho",
            onPress: () => handleAddActionOption('income')
          },
          {
            text: "Ver Relatórios",
            onPress: () => handleAddActionOption('reports')
          },
          {
            text: "Cancelar",
            style: "cancel"
          }
        ]
      );
      return;
    }
    
    // Se não for 'menu', tratamos como ação direta
    handleAddActionOption(action);
  };

  // Função auxiliar para tratar a opção selecionada
  const handleAddActionOption = (option) => {
    console.log(`Ação selecionada: ${option}`);
    
    // Navegação para as telas correspondentes
    switch (option) {
      case 'expense':
        navigation.navigate('AddExpense');
        break;
      case 'income':
        navigation.navigate('AddIncome');
        break;
      case 'reports':
        Alert.alert('Relatórios', 'Funcionalidade em desenvolvimento');
        break;
    }
  };

  // Função para lidar com erros de API sem interromper a experiência
  const ignoreNetworkError = () => {
    console.log('Ignorando erro de rede temporário');
    // O aplicativo continua funcionando com dados offline/locais
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <RNActivityIndicator size="large" color={theme.colors.accent.main} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const renderTransactionItem = ({ item }) => (
    <TransactionItem 
      transaction={item} 
      onPress={() => console.log('Transação selecionada:', item.id)}
    />
  );

  // Formata o saldo para exibição em formato de moeda brasileira
  const formatBalance = (balance) => {
    return balance.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Calcula a porcentagem da barra de progresso do saldo
  const calculateBalancePercentage = () => {
    const maxBalance = 1500; // Valor máximo do saldo para cálculo da barra de progresso
    const currentBalance = userData?.balance || 0;
    return Math.min(Math.max((currentBalance / maxBalance) * 100, 0), 100);
  };

  // Determina quais transações mostrar com base no tipo selecionado
  const getTransactionsToDisplay = () => {
    if (transactionType === 'expenses') {
      return expensesTransactions;
    } else if (transactionType === 'income') {
      return incomeTransactions;
    }
    return transactions; // Retorna as transações originais por padrão
  };

  const displayTransactions = getTransactionsToDisplay();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0A0F2C" barStyle="light-content" />
      
      {/* Seção com área accent e cartão financeiro juntos */}
      <View style={styles.topSection}>
        {/* Área accent com o header - design minimalista */}
        <View style={styles.headerSection}>
          {/* Cabeçalho com título e ícone */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Agosto 2023</Text>
              <TouchableOpacity 
                style={styles.headerIconContainer}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#FFFFFF" style={styles.headerIcon} />
              </TouchableOpacity>
            </View>
            
            {/* Dropdown para seleção de categoria */}
            <TouchableOpacity 
              style={styles.headerSubtitleContainer}
              onPress={() => setDropdownVisible(!dropdownVisible)}
            >
              <Text style={styles.headerSubtitle}>{selectedCategory.title}</Text>
              <MaterialCommunityIcons 
                name={dropdownVisible ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="rgba(255,255,255,0.8)" 
                style={styles.subtitleIcon} 
              />
            </TouchableOpacity>
            
            {/* Modal do dropdown */}
            <Modal
              visible={dropdownVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setDropdownVisible(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setDropdownVisible(false)}
              >
                <View style={styles.dropdownContainer}>
                  {dropdownOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dropdownItem,
                        option.id === selectedCategory.id && styles.dropdownItemSelected
                      ]}
                      onPress={() => selectCategory(option)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        option.id === selectedCategory.id && styles.dropdownItemTextSelected
                      ]}>
                        {option.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>
        
        {/* Seção ilustrativa para gráfico miniatura */}
        <View style={styles.miniChartSection}>
          <View style={styles.miniChartContainer}>
            {/* Barras ilustrativas do gráfico */}
            <View style={[styles.chartBar, { height: 15 }]} />
            <View style={[styles.chartBar, { height: 25 }]} />
            <View style={[styles.chartBar, { height: 18 }]} />
            <View style={[styles.chartBar, { height: 30 }]} />
            <View style={[styles.chartBar, { height: 22 }]} />
            <View style={[styles.chartBar, { height: 28 }]} />
            <View style={[styles.chartBar, { height: 20 }]} />
          </View>
          <View style={styles.miniChartLabels}>
            <Text style={styles.miniChartLabel}>{selectedCategory.title}</Text>
            <Text style={styles.miniChartValue}>{selectedCategory.value}</Text>
          </View>
        </View>
        
        {/* Cartão financeiro posicionado na parte inferior da área accent */}
        <View style={styles.financeCardContainer}>
          <View style={styles.financeCard}>
            {/* Linhas decorativas de fundo */}
            <View style={styles.cardBackground}>
              <View style={styles.cardBackgroundLine1} />
              <View style={styles.cardBackgroundLine2} />
              <View style={styles.cardBackgroundLine3} />
            </View>

            {/* Badge de status no canto superior direito */}
            <View style={styles.statusBadgeContainer}>
              <View style={styles.statusBadge}>
                <MaterialCommunityIcons name="check-circle" size={10} color="#00D0C5" />
                <Text style={styles.statusText}>Ativo</Text>
              </View>
            </View>

            {/* Conteúdo do cartão com layout aprimorado */}
            <View style={styles.cardContent}>
              {/* Nome do titular com ícone de segurança */}
              <View style={styles.nameContainer}>
                <Text style={styles.cardHolderName}>{userData?.name || 'Usuário VicCoin'}</Text>
                <MaterialCommunityIcons name="shield-check" size={14} color="rgba(255,255,255,0.7)" style={styles.securityIcon} />
              </View>
              
              {/* Saldo atual em destaque com label */}
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>
                <Text style={styles.balanceValue}>
                  {formatBalance(userData?.balance || 0)}
                </Text>
              </View>
              
              {/* Barra de progresso do saldo com indicador */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${calculateBalancePercentage()}%` }]} />
                </View>
                <Text style={styles.progressIndicator}>{Math.round(calculateBalancePercentage())}%</Text>
              </View>
              
              {/* Área inferior do cartão com despesas e ganhos */}
              <View style={styles.cardFooter}>
                {/* Despesas (canto inferior esquerdo) */}
                <TouchableOpacity 
                  style={styles.cardFooterItem}
                  onPress={() => handleTransactionTypeSelect('expenses')}
                  activeOpacity={0.7}
                >
                  <View style={styles.footerIconContainer}>
                    <MaterialCommunityIcons name="arrow-down" size={12} color="#FF5C75" style={styles.footerIcon} />
                  </View>
                  <Text style={styles.cardFooterLabel}>Despesas</Text>
                  <Text style={styles.cardFooterValue}>
                    {formatBalance(userData?.expenses || 450)}
                  </Text>
                </TouchableOpacity>
                
                {/* Linha separadora vertical */}
                <View style={styles.footerSeparator} />
                
                {/* Ganho (canto inferior direito) */}
                <TouchableOpacity 
                  style={styles.cardFooterItem}
                  onPress={() => handleTransactionTypeSelect('income')}
                  activeOpacity={0.7}
                >
                  <View style={styles.footerIconContainer}>
                    <MaterialCommunityIcons name="arrow-up" size={12} color="#00D0C5" style={styles.footerIcon} />
                  </View>
                  <Text style={styles.cardFooterLabel}>Ganho</Text>
                  <Text style={styles.cardFooterValue}>
                    {formatBalance(userData?.income || 1250)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Seção de conteúdo com lista de transações */}
      <ScrollView
        contentContainerStyle={styles.contentSection}
        showsVerticalScrollIndicator={false}
      >
        {/* Espaço para compensar o cartão no layout */}
        <View style={styles.contentPlaceholder} />
        
        {/* Lista de transações recentes com animação */}
        <Animated.View 
          style={[
            styles.transactionsList,
            { transform: [{ translateX: slideAnimation }] }
          ]}
        >
          {displayTransactions && displayTransactions.length > 0 ? (
            <>
              {displayTransactions.map((item) => (
                <TransactionItem 
                  key={item.id}
                  transaction={item}
                  onPress={() => console.log('Transação selecionada:', item.id)}
                />
              ))}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.emptyStateText}>Nenhuma transação encontrada</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Barra de navegação inferior */}
      <BottomNavBar 
        navigation={navigation} 
        currentScreen="Home" 
        onAddAction={handleAddAction} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container principal da tela
  container: {
    flex: 1,
    backgroundColor: '#0A0F2C', // Azul escuro profundo
  },
  
  // Container para tela de carregamento
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  
  // Seção superior completa (área accent + cartão)
  topSection: {
    position: 'relative',
    height: '50%', 
    zIndex: 1,
    overflow: 'visible', // Permitir que as sombras dos elementos sejam visíveis
  },
  
  // Área accent com o header - design minimalista
  headerSection: {
    backgroundColor: '#0A0F2C', // Azul escuro profundo
    paddingTop: theme.statusBarHeight + 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 0, // Sem bordas arredondadas para visual minimalista
    borderBottomRightRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  
  // Estilo refinado para o cabeçalho
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm, // Reduzido para dar espaço ao gráfico
    marginBottom: 0,
    marginTop: 10,
    position: 'absolute',
    top: theme.statusBarHeight + 10,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 0,
    color: '#FFFFFF',
    letterSpacing: -0.7,
  },
  
  headerIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerIcon: {
    marginLeft: 0,
    marginTop: 0,
  },
  
  headerSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // Aumentar a área clicável
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 0,
    marginBottom: 10,
    fontWeight: '500',
  },
  
  subtitleIcon: {
    marginLeft: 4,
    marginTop: -4,
  },
  
  // Container do cartão financeiro
  financeCardContainer: {
    position: 'absolute',
    bottom: 10,
    left: '4%',
    right: '4%',
    width: '92%',
    zIndex: 10,
    alignSelf: 'center',
    marginTop: 50, // Adicionado para garantir espaço adequado após o gráfico
  },
  
  // Cartão financeiro principal com design minimalista
  financeCard: {
    height: 220,
    width: '100%',
    backgroundColor: '#151B3D', // Azul um pouco mais claro que o fundo
    borderRadius: 16, // Bordas menos arredondadas para visual minimalista
    position: 'relative',
    overflow: 'hidden',
    padding: theme.spacing.lg,
    // Sombra sutil para efeito de elevação
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  
  // Badge de status no canto superior
  statusBadgeContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 15,
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 208, 197, 0.1)', // Verde-turquesa transparente
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  statusText: {
    color: '#00D0C5', // Verde-turquesa
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  
  // Container para o nome com ícone
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // Estilo para o nome do titular
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  
  securityIcon: {
    marginLeft: 6,
  },
  
  // Container para o saldo
  balanceContainer: {
    marginBottom: 5,
  },
  
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  
  balanceValue: {
    color: '#00D0C5', // Verde-turquesa
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  
  // Container para a barra de progresso com indicador
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    flex: 1,
  },
  
  progressBar: {
    height: '100%',
    backgroundColor: '#00D0C5', // Verde-turquesa
    borderRadius: 3,
  },
  
  progressIndicator: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
    fontWeight: '600',
  },
  
  // Área do rodapé do cartão
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  
  // Item do rodapé (despesas/ganhos)
  cardFooterItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  footerIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  
  footerSeparator: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  
  cardFooterLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  
  cardFooterValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  
  // Linhas decorativas de fundo - mais sutis para minimalismo
  cardBackgroundLine1: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '150%',
    top: '20%',
    left: '-25%',
    transform: [{ rotate: '8deg' }],
  },
  
  cardBackgroundLine2: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    width: '150%',
    top: '40%',
    left: '-25%',
    transform: [{ rotate: '-5deg' }],
  },
  
  cardBackgroundLine3: {
    position: 'absolute',
    height: 1, // Reduzido para ser mais sutil
    backgroundColor: 'rgba(255,255,255,0.03)',
    width: '150%',
    top: '65%',
    left: '-25%',
    transform: [{ rotate: '3deg' }],
  },
  
  // Espaçador para acomodar o cartão
  contentPlaceholder: {
    height: 120,
  },
  
  // Conteúdo principal
  contentSection: {
    paddingBottom: 80,
  },
  
  // Lista de transações
  transactionsList: {
    flex: 1,
  },
  
  // Mensagem quando não há transações
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  
  emptyStateText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: theme.spacing.md,
    fontSize: 16,
  },
  
  // Seção do mini gráfico
  miniChartSection: {
    position: 'absolute',
    top: 130, // Ajuste conforme necessário para posicionar entre o header e o cartão
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    height: 70, // Altura total da seção
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  
  // Container do gráfico em si
  miniChartContainer: {
    width: '65%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
  },
  
  // Barra individual do gráfico
  chartBar: {
    width: 6,
    backgroundColor: '#00D0C5',
    borderRadius: 3,
    opacity: 0.7,
  },
  
  // Container para labels do gráfico
  miniChartLabels: {
    width: '30%',
  },
  
  // Label do gráfico
  miniChartLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  
  // Valor destacado do gráfico
  miniChartValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal overlay para clicar fora e fechar
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  
  // Container do dropdown
  dropdownContainer: {
    position: 'absolute',
    top: 140, // Posicionar abaixo do header
    left: theme.spacing.lg,
    width: 200,
    backgroundColor: '#1A2040',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  
  // Item individual do dropdown
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  
  // Item selecionado
  dropdownItemSelected: {
    backgroundColor: 'rgba(0, 208, 197, 0.1)',
  },
  
  // Texto do item
  dropdownItemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  
  // Texto do item selecionado
  dropdownItemTextSelected: {
    color: '#00D0C5',
    fontWeight: '600',
  },
});

export default HomeUI; 