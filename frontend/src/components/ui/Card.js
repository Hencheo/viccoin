import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import theme from '../../styles/theme';

/**
 * Componente Card reutilizável para o novo design
 * Use para criar cards como os da imagem de referência
 */
const Card = ({ 
  children, 
  onPress, 
  style, 
  size = 'medium', // small, medium, large
  ...props 
}) => {
  const cardStyles = [
    styles.card,
    size === 'small' && styles.cardSmall,
    size === 'large' && styles.cardLarge,
    style,
  ];
  
  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    margin: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadow.soft,
  },
  cardSmall: {
    padding: theme.spacing.sm,
  },
  cardLarge: {
    padding: theme.spacing.lg,
  }
});

export default Card; 