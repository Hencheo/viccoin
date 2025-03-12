import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  SafeAreaView,
  StatusBar,
  PanResponder
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  Easing,
  withRepeat,
  withSequence,
  runOnJS
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Função para gerar número de cartão aleatório no estilo Matrix
const generateRandomCardNumber = () => {
  let randomNum = '';
  for (let i = 0; i < 16; i++) {
    randomNum += Math.floor(Math.random() * 10);
    if ((i + 1) % 4 === 0 && i < 15) randomNum += ' ';
  }
  return randomNum;
};

function WelcomeScreen({ navigation }) {
  // Estado para animar os números do cartão estilo Matrix
  const [cardNumber, setCardNumber] = useState(generateRandomCardNumber());
  const cardNumberInterval = useRef(null);
  
  // Valores animados - inicializados com 1 para garantir visibilidade constante
  const cardOffset = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(1);
  const buttonOpacity = useSharedValue(1);
  
  // Valores para os elementos flutuantes
  const bubble1Y = useSharedValue(height * 0.2);
  const bubble2Y = useSharedValue(height * 0.3);
  const bubble3Y = useSharedValue(height * 0.7);
  
  // Valor para o botão deslizável
  const buttonOffset = useSharedValue(0);
  const buttonWidth = width * 0.85; // Aumentado para 85% da largura da tela
  const slideThreshold = buttonWidth * 0.3; // 30% do botão precisa ser deslizado para acionar

  // Função para navegar para a próxima tela
  const navigateToLogin = () => {
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  // Configuração do PanResponder para o botão deslizável
  const panResponder = React.useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Limitar o deslizamento para direita e máximo de largura do botão - 60
        const newX = Math.max(0, Math.min(gestureState.dx, buttonWidth - 60));
        buttonOffset.value = newX;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > slideThreshold) {
          // Deslizou o suficiente, animar até o final e navegar
          buttonOffset.value = withTiming(buttonWidth - 60, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          }, () => {
            runOnJS(navigateToLogin)();
          });
        } else {
          // Não deslizou o suficiente, voltar ao início
          buttonOffset.value = withTiming(0, {
            duration: 300,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1)
          });
        }
      }
    });
  }, [navigation]);

  // Efeito para a animação estilo Matrix dos números do cartão
  useEffect(() => {
    // Iniciar animação dos números do cartão
    cardNumberInterval.current = setInterval(() => {
      setCardNumber(generateRandomCardNumber());
    }, 200); // Atualiza a cada 200ms para efeito Matrix

    return () => {
      // Limpar o intervalo quando o componente for desmontado
      if (cardNumberInterval.current) {
        clearInterval(cardNumberInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Animações das bolhas flutuantes
    bubble1Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.22, { duration: 3000 }),
        withTiming(height * 0.2, { duration: 3000 })
      ),
      -1,
      true
    );

    bubble2Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.33, { duration: 4000 }),
        withTiming(height * 0.3, { duration: 4000 })
      ),
      -1,
      true
    );

    bubble3Y.value = withRepeat(
      withSequence(
        withTiming(height * 0.72, { duration: 3500 }),
        withTiming(height * 0.7, { duration: 3500 })
      ),
      -1,
      true
    );
  }, []);

  // Estilos animados
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: cardOffset.value }],
      opacity: cardOpacity.value,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
    };
  });

  const bubbleStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bubble1Y.value }]
    };
  });

  const bubbleStyle2 = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bubble2Y.value }]
    };
  });

  const bubbleStyle3 = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bubble3Y.value }]
    };
  });

  const sliderKnobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: buttonOffset.value }]
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#8A2BE2', '#4B0082', '#191970']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Elementos flutuantes */}
      <Animated.View style={[styles.bubble, styles.bubble1, bubbleStyle1]} />
      <Animated.View style={[styles.bubble, styles.bubble2, bubbleStyle2]} />
      <Animated.View style={[styles.bubble, styles.bubble3, bubbleStyle3]} />

      <SafeAreaView style={styles.content}>
        {/* Cards animados */}
        <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.chipContainer}>
                <View style={styles.chip} />
              </View>
              <Text style={styles.cardNumber}>{cardNumber}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardName}>VicCoin</Text>
            </View>
          </View>
          
          {/* Cartão sombra */}
          <View style={[styles.cardShadow]} />
        </Animated.View>

        {/* Texto principal */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.heading}>Simplifique Sua{'\n'}Vida Financeira</Text>
          <Text style={styles.subheading}>
            Monitore seus saldos, mantenha-se no orçamento{'\n'}
            e melhore sua saúde financeira.
          </Text>
        </Animated.View>

        {/* Botão deslizável - ajustado para ficar mais longe da parte inferior */}
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <Text style={styles.sliderHint}>Deslize para começar</Text>
              <Animated.View 
                style={[styles.sliderKnob, sliderKnobStyle]}
                {...panResponder.panHandlers}
              >
                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.15,
  },
  bubble1: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    left: width * 0.1,
    top: 80,
  },
  bubble2: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    right: width * 0.1,
    top: 120,
  },
  bubble3: {
    width: 50,
    height: 50,
    backgroundColor: '#FFFFFF',
    left: width * 0.2,
    bottom: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 70, // Aumentado para empurrar o botão para cima
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
    height: 200,
  },
  card: {
    width: width * 0.85,
    height: 180,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 2,
  },
  cardShadow: {
    position: 'absolute',
    top: 15,
    width: width * 0.8,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    zIndex: 1,
  },
  cardHeader: {
    marginBottom: 50,
  },
  chipContainer: {
    marginBottom: 20,
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  cardNumber: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  textContainer: {
    marginTop: -height * 0.05, // Ajuste conforme necessário
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30, // Adicionado margin bottom para distanciar da parte inferior
  },
  sliderContainer: {
    width: width * 0.85, // Aumentado para 85% da largura
    height: 64, // Altura aumentada
    borderRadius: 32, // Ajustado para manter o arredondamento correto
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sliderTrack: {
    width: '100%',
    height: '100%',
    backgroundColor: '#A239FF',
    borderRadius: 32, // Ajustado para corresponder ao container
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 17, // Tamanho da fonte aumentado
    fontWeight: '600',
  },
  sliderKnob: {
    position: 'absolute',
    left: 4,
    width: 56, // Tamanho aumentado
    height: 56, // Tamanho aumentado
    borderRadius: 28, // Ajustado para metade da altura
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: 'white',
    fontSize: 22, // Tamanho aumentado
    fontWeight: 'bold',
  },
});

export default WelcomeScreen; 