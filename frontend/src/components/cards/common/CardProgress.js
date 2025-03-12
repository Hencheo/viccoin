import React from 'react';
import { View, StyleSheet } from 'react-native';

// Componente de barra de progresso para os cartões, com memoização para evitar rerenderizações desnecessárias
export const CardProgress = React.memo(({ 
  value = 0, 
  progressStyle 
}) => {
  // Limitar o valor entre 0 e 100
  const limitedValue = Math.min(100, Math.max(0, value));
  
  return (
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill,
          progressStyle,
          { width: `${limitedValue}%` }
        ]} 
      />
    </View>
  );
});

const styles = StyleSheet.create({
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  }
}); 