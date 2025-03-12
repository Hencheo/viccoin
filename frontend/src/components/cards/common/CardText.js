import React from 'react';
import { Text } from 'react-native';

// Componente de texto simples para os cartões, com memoização para evitar rerenderizações desnecessárias
export const CardText = React.memo(({ 
  style, 
  children, 
  fontSize = 28, 
  fontWeight = 'bold', 
  color = 'white', 
  fontFamily = null 
}) => {
  return (
    <Text 
      style={[
        { 
          fontSize, 
          fontWeight, 
          color,
          ...(fontFamily ? { fontFamily } : {})
        }, 
        style
      ]}
    >
      {children}
    </Text>
  );
}); 