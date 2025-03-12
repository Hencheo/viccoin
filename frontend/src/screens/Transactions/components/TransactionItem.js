import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

// Constantes
const SWIPE_THRESHOLD = -80;

function TransactionItem({ transaction, onEdit, formatCurrency }) {
  // Valores animados para o swipe
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(70); // Altura padrão do item
  const opacity = useSharedValue(1);
  
  // Determinar ícone e cor com base no tipo de transação
  const getIconAndColor = useCallback(() => {
    if (transaction.tipo === 'despesa') {
      return { 
        icon: transaction.icone || 'arrow-down',
        color: '#FF5252', // Vermelho para despesas
        backgroundColor: 'rgba(255, 82, 82, 0.1)'
      };
    } else if (transaction.tipo === 'ganho') {
      return { 
        icon: transaction.icone || 'arrow-up',
        color: '#4CAF50', // Verde para ganhos
        backgroundColor: 'rgba(76, 175, 80, 0.1)'
      };
    } else {
      return { 
        icon: transaction.icone || 'cash-outline',
        color: '#2196F3', // Azul para outros
        backgroundColor: 'rgba(33, 150, 243, 0.1)'
      };
    }
  }, [transaction]);
  
  // Formatar data e hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.toLocaleDateString('pt-BR')} · ${date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };
  
  // Handler para gestos de arrastar
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      // Limitar o swipe para a esquerda apenas (valores negativos)
      translateX.value = Math.min(0, ctx.startX + event.translationX);
    },
    onEnd: (event) => {
      // Se arrastar além do limite, mostrar botão de editar
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(SWIPE_THRESHOLD);
      } else {
        // Caso contrário, voltar à posição original
        translateX.value = withTiming(0);
      }
    },
  });
  
  // Estilo animado para o container principal
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      height: itemHeight.value,
      opacity: opacity.value,
    };
  });
  
  // Estilo animado para os botões de ação (editar)
  const animatedActionsStyle = useAnimatedStyle(() => {
    const opacity = translateX.value < -20 ? 1 : 0;
    return {
      opacity: withTiming(opacity, { duration: 150 }),
      right: 16,
    };
  });
  
  // Extrair dados da transação
  const { icon, color, backgroundColor } = getIconAndColor();
  
  return (
    <View style={styles.itemContainer}>
      {/* Botões de ação (visíveis após arrastar) */}
      <Animated.View style={[styles.actionsContainer, animatedActionsStyle]}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#A239FF' }]}
          onPress={onEdit}
        >
          <Icon name="create-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Container arrastável */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          {/* Ícone da categoria */}
          <View style={[styles.iconContainer, { backgroundColor }]}>
            <Icon name={icon} size={18} color={color} />
          </View>
          
          {/* Detalhes da transação */}
          <View style={styles.detailsContainer}>
            <Text style={styles.categoryText}>
              {transaction.categoria || 'Sem categoria'}
            </Text>
            <Text style={styles.descriptionText}>
              {transaction.descricao || 'Sem descrição'}
            </Text>
          </View>
          
          {/* Valor e data */}
          <View style={styles.valueContainer}>
            <Text style={[
              styles.valueText, 
              { color: transaction.tipo === 'despesa' ? '#FF5252' : '#4CAF50' }
            ]}>
              {transaction.tipo === 'despesa' ? '-' : '+'} 
              {formatCurrency(transaction.valor)}
            </Text>
            <Text style={styles.dateText}>
              {formatDateTime(transaction.data)}
            </Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginVertical: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 2,
  },
  descriptionText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  valueText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  dateText: {
    color: '#888888',
    fontSize: 10,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: -1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default React.memo(TransactionItem); 