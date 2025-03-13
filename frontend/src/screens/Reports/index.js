import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated from 'react-native-reanimated';

// Componentes
import FilterBar from './components/FilterBar';
import ChartSection from './components/ChartSection';
import InsightCards from './components/InsightCards';
import SpendingAnalysis from './components/SpendingAnalysis';
import AppBottomBar, { handleScroll } from '../../components/AppBottomBar';

// Hook personalizado para dados
import useReportsData from './hooks/useReportsData';

const ReportsScreen = ({ navigation }) => {
  // Estados para filtros
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Usar o hook para carregar dados
  const { 
    isLoading,
    chartData,
    insights,
    categoryData,
    totalDespesas,
    totalGanhos,
    error,
    handleRefresh
  } = useReportsData(selectedPeriod, selectedCategory);

  // Manipulador para mudança de período
  const handlePeriodChange = useCallback((period) => {
    setSelectedPeriod(period);
  }, []);

  // Manipulador para mudança de categoria
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // Manipulador para o botão "Ver todas as categorias"
  const handleViewAllCategories = useCallback(() => {
    Alert.alert(
      'Funcionalidade em Desenvolvimento',
      'O detalhamento completo de todas as categorias estará disponível em breve!',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#121212" 
      />
      
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#AAA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>
      
      {/* Conteúdo principal */}
      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={handleRefresh} 
            colors={['#A239FF']} 
            tintColor="#A239FF"
          />
        }
      >
        {/* Exibir mensagem de erro se houver */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={24} color="#FF5252" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Barra de filtros */}
        <FilterBar 
          selectedPeriod={selectedPeriod}
          onChangePeriod={handlePeriodChange}
          selectedCategory={selectedCategory}
          onChangeCategory={handleCategoryChange}
          categories={categoryData}
        />
        
        {/* Gráfico e resumo */}
        <ChartSection 
          chartData={chartData}
          totalDespesas={totalDespesas}
          totalGanhos={totalGanhos}
        />
        
        {/* Cards de insights */}
        <InsightCards 
          insights={insights}
          categoryData={categoryData}
        />
        
        {/* Análise de gastos por categoria */}
        <SpendingAnalysis 
          categoryData={categoryData}
          onPressViewAll={handleViewAllCategories}
        />
      </Animated.ScrollView>
      
      {/* AppBottomBar */}
      <AppBottomBar 
        navigation={navigation} 
        activeTab="reports" 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2C',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightPlaceholder: {
    width: 36, // Mantém o espaçamento simétrico no header
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 80,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF5252',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
});

export default ReportsScreen; 