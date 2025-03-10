import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../styles/theme';

/**
 * Componente para renderizar um item de transação na lista de atividades
 * Adaptado para exibir tanto despesas quanto ganhos
 */
const TransactionItem = ({ 
  transaction, 
  onPress,
  style,
}) => {
  // Formata o valor da transação para o formato de moeda brasileira
  const formatCurrency = (value) => {
    const isIncome = transaction.type === 'income';
    const prefix = isIncome ? '+ ' : '- ';
    return `${prefix}R$ ${value}`;
  };

  // Define a cor do valor com base no tipo de transação
  const getValueColor = () => {
    return transaction.type === 'income' ? '#00D0C5' : '#FF5C75';
  };

  // Seleciona o ícone apropriado para a transação
  const getIcon = () => {
    return transaction.icon || (transaction.type === 'income' ? 'arrow-up-outline' : 'arrow-down-outline');
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Ícone da transação */}
      <View style={[
        styles.iconContainer, 
        { backgroundColor: transaction.type === 'income' ? 'rgba(0, 208, 197, 0.15)' : 'rgba(255, 92, 117, 0.15)' }
      ]}>
        <Ionicons name={getIcon()} size={18} color={transaction.type === 'income' ? '#00D0C5' : '#FF5C75'} />
      </View>
      
      {/* Informações principais */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{transaction.title || "Zaporiz'ke Hwy, 40"}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.dateTime}>{transaction.date || "Aug 23"}, {transaction.time || "7:03 PM"}</Text>
        </View>
      </View>
      
      {/* Valor da transação */}
      <Text style={[styles.amount, { color: getValueColor() }]}>
        {formatCurrency(transaction.amount || "88.14")}
      </Text>
      
      {/* Botão de detalhes */}
      <View style={styles.chevronContainer}>
        <View style={styles.chevronBackground}>
          <Ionicons name="chevron-forward" size={18} color="#999999" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border.light,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateTime: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: 0,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  chevronContainer: {
    paddingLeft: theme.spacing.md,
  },
  chevronBackground: {
    width: 28,
    height: 28,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TransactionItem; 