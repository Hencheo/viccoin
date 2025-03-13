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
import { useSelector } from 'react-redux';

// Constantes
const SWIPE_THRESHOLD = -80;

// Função helper para ajustar problema de fuso horário
const adjustForTimezone = (date) => {
  if (!date) return null;
  
  // Criar nova instância de data para não modificar a original
  const newDate = new Date(date);
  
  // Extrair dia, mês e ano da data
  const dia = newDate.getDate();
  const mes = newDate.getMonth();
  const ano = newDate.getFullYear();
  
  // Preservar informações de hora e minuto para exibição
  const hora = newDate.getHours();
  const minuto = newDate.getMinutes();
  
  // Criar nova data preservando apenas as informações necessárias
  // Isso elimina os problemas de conversão de fuso horário
  const dataAjustada = new Date();
  dataAjustada.setFullYear(ano, mes, dia);
  dataAjustada.setHours(hora, minuto, 0, 0);
  
  return dataAjustada;
};

function TransactionItem({ transaction, onEdit, formatCurrency }) {
  // Corrigir a forma como as categorias são obtidas do Redux
  const categoriasState = useSelector(state => state.categorias);
  
  // Função para obter o nome da categoria do Redux
  const getCategoryNameFromRedux = (categoryId, tipo) => {
    if (typeof categoryId === 'string' && isNaN(parseInt(categoryId))) {
      return categoryId; // Se for uma string não numérica, retorna ela mesma
    }
    
    // Se for número ou string numérica, tenta encontrar pelo índice
    const idNumber = parseInt(categoryId);
    
    // Categorias padrão para quando o estado estiver vazio
    const categoriasPadrao = {
      despesas: [
        'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
        'Lazer', 'Compras', 'Viagem', 'Tecnologia', 'Vestuário',
        'Serviços', 'Supermercado', 'Entretenimento', 'Utilidades'
      ],
      ganhos: [
        'Salário', 'Freelance', 'Investimentos', 'Vendas', 'Presentes'
      ],
      salarios: [
        'Mensal', 'Quinzenal', 'Semanal', 'Bônus', 'Participação'
      ]
    };
    
    // Verificar se o estado tem categorias, caso contrário usar as padrão
    const despesas = categoriasState.despesas?.length > 0 ? categoriasState.despesas : categoriasPadrao.despesas;
    const ganhos = categoriasState.ganhos?.length > 0 ? categoriasState.ganhos : categoriasPadrao.ganhos;
    const salarios = categoriasState.salarios?.length > 0 ? categoriasState.salarios : categoriasPadrao.salarios;
    
    // Log para depuração
    console.log(`TransactionItem - Verificando categoria ID ${categoryId} com tipo ${tipo || 'desconhecido'}`);
    
    try {
      // Para transações de despesa, usar o array de despesas
      if (tipo === 'despesa' && idNumber > 0 && idNumber <= despesas.length) {
        return despesas[idNumber - 1];
      }
      
      // Para transações de ganho, usar o array de ganhos
      if (tipo === 'ganho' && idNumber > 0 && idNumber <= ganhos.length) {
        return ganhos[idNumber - 1];
      }
      
      // Se o tipo for desconhecido, tentar localizar em todos os arrays
      if (idNumber > 0) {
        // Tentar em despesas (categoria mais comum)
        if (idNumber <= despesas.length) {
          return despesas[idNumber - 1];
        }
        
        // Tentar em ganhos
        if (idNumber <= ganhos.length) {
          return ganhos[idNumber - 1];
        }
        
        // Tentar em salários
        if (idNumber <= salarios.length) {
          return salarios[idNumber - 1];
        }
      }
    } catch (error) {
      console.error('Erro ao mapear categoria:', error);
    }
    
    // Se não encontrar em nenhuma lista, retorna o formato padrão
    return `Categoria ${categoryId}`;
  };
  
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
  
  // Formatar data e hora com correção de fuso horário
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    // Corrigir problema de fuso horário
    const date = adjustForTimezone(dateString);
    
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
            {/* Log para depuração da categoria */}
            {console.log('TransactionItem - Categoria:', transaction.categoria, typeof transaction.categoria)}
            <Text style={styles.categoryText}>
              {typeof transaction.categoria === 'string' 
                ? transaction.categoria
                : getCategoryNameFromRedux(transaction.categoria, transaction.tipo)}
            </Text>
            {transaction.descricao ? (
              <Text style={styles.descriptionText}>
                {transaction.descricao}
              </Text>
            ) : null}
            <Text style={styles.dateText}>
              {formatDateTime(transaction.data)}
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
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  descriptionText: {
    color: '#BBBBBB',
    fontSize: 13,
    marginBottom: 2,
  },
  valueContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  valueText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 0,
  },
  dateText: {
    color: '#888888',
    fontSize: 12,
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