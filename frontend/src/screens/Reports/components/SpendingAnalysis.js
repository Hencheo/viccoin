import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatarMoeda } from '../../../utils/formatters';

const CategoryItem = ({ category, color }) => {
  return (
    <View style={styles.categoryItem}>
      <View style={styles.categoryIconContainer}>
        <View style={[styles.categoryIcon, { backgroundColor: color }]}>
          <Icon name={category.icone || 'help-circle-outline'} size={20} color="#FFFFFF" />
        </View>
      </View>
      
      <View style={styles.categoryDetails}>
        <Text style={styles.categoryName}>
          {category.nome || category.categoria || 'Categoria desconhecida'}
        </Text>
        <View style={styles.categoryStatsContainer}>
          <Text style={styles.categoryValue}>
            {category.totalFormatado || formatarMoeda(category.total)}
          </Text>
          <Text style={styles.categoryPercentage}>
            {category.percentual}%
          </Text>
        </View>
        
        {/* Barra de progresso */}
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${category.percentual}%`,
                backgroundColor: category.color || color
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const SpendingAnalysis = ({ categoryData = [], onPressViewAll }) => {
  // Pegar as cores para categorias
  const getColorForCategory = (index) => {
    const colors = [
      '#FF5252', // Vermelho 
      '#A239FF', // Roxo
      '#4CAF50', // Verde
      '#FFC107', // Amarelo
      '#2196F3', // Azul
      '#FF9800', // Laranja
    ];
    
    return colors[index % colors.length];
  };
  
  // Exibir apenas as 5 principais categorias na lista
  const topCategories = categoryData.slice(0, 5);
  
  if (!topCategories || topCategories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Gastos por Categoria</Text>
        <Text style={styles.emptyMessage}>
          Sem dados de gastos por categoria para exibir
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos por Categoria</Text>
      
      <View style={styles.categoriesContainer}>
        {topCategories.map((category, index) => (
          <CategoryItem 
            key={`category-${index}`}
            category={category}
            color={getColorForCategory(index)}
          />
        ))}
      </View>
      
      {categoryData.length > 5 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={onPressViewAll}
        >
          <Text style={styles.viewAllText}>Ver todas as categorias</Text>
          <Icon name="chevron-forward-outline" size={16} color="#A239FF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryIconContainer: {
    marginRight: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryValue: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  categoryPercentage: {
    color: '#BBBBBB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#3A3A3A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2C',
    marginTop: 8,
  },
  viewAllText: {
    color: '#A239FF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyMessage: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

export default SpendingAnalysis; 