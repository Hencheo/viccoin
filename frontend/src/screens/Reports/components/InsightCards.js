import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatCurrency } from '../../../utils/formatters';

const InsightCard = ({ title, description, icon, color, value, maxValue }) => {
  // Calcular a porcentagem para a barra de progresso
  const progressPercentage = Math.min(100, (value / maxValue) * 100);
  
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      
      <Text style={styles.cardDescription}>{description}</Text>
      
      {/* Barra de progresso */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${progressPercentage}%`,
              backgroundColor: color
            }
          ]} 
        />
      </View>
    </View>
  );
};

const InsightCards = ({ insights = [], categoryData = [] }) => {
  if ((!insights || insights.length === 0) && 
      (!categoryData || categoryData.length === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.emptyMessage}>
          Sem dados suficientes para mostrar insights
        </Text>
      </View>
    );
  }

  // Preparar o card de top categorias se não estiver nos insights
  const hasTopCategoryInsight = insights.some(i => i.id === 'top-category');
  const topCategoriesCards = !hasTopCategoryInsight && categoryData.length > 0 
    ? categoryData.slice(0, 3).map((category, index) => ({
        id: `category-${index}`,
        title: category.categoria,
        description: `${formatCurrency(category.total)} (${category.percentual}% do total)`,
        icon: category.icone || 'help-circle-outline',
        color: getColorForCategory(index),
        value: category.percentual,
        maxValue: 100
      }))
    : [];

  const allCards = [...insights, ...topCategoriesCards];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContainer}
      >
        {allCards.map(insight => (
          <InsightCard
            key={insight.id}
            title={insight.title}
            description={insight.description}
            icon={insight.icon}
            color={insight.color}
            value={insight.value}
            maxValue={insight.maxValue}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Função para gerar cores para categorias
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
  cardsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 8,
  },
  card: {
    width: 200,
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cardDescription: {
    color: '#BBBBBB',
    fontSize: 12,
    marginBottom: 12,
    height: 32, // Altura fixa para duas linhas
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#3A3A3A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  emptyMessage: {
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

export default InsightCards; 