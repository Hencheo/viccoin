import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Image,
  SafeAreaView,
  StatusBar,
  PanResponder,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Usamos Animated nativo do React Native em vez do Reanimated
// para maior estabilidade em dispositivos variados

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
  
  // Estados para controlar visibilidade dos elementos de forma explícita
  const [cardVisible, setCardVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  
  // Estados para controlar animações
  const [animationComplete, setAnimationComplete] = useState(false);
  const animationStarted = useRef(false);
  
  // Usando Animated nativo do React Native
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardPosition = useRef(new Animated.Value(50)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // Animated values para os elementos flutuantes
  const bubble1Position = useRef(new Animated.Value(0)).current;
  const bubble2Position = useRef(new Animated.Value(0)).current;
  const bubble3Position = useRef(new Animated.Value(0)).current;
  
  // Animated value para o botão deslizável
  const sliderPosition = useRef(new Animated.Value(0)).current;
  const buttonWidth = width * 0.85;
  const slideThreshold = buttonWidth * 0.3;

  // Função para navegar para a próxima tela
  const navigateToLogin = () => {
    console.log('Navegando para login após animação');
    
    // Fade out de todos os elementos
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start(() => {
      // Só navegamos após concluir as animações
      if (navigation) {
        navigation.navigate('Login');
      }
    });
  };

  // Configuração do PanResponder para o botão deslizável
  const panResponder = React.useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Limitar o deslizamento para direita
        const newX = Math.max(0, Math.min(gestureState.dx, buttonWidth - 60));
        sliderPosition.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > slideThreshold) {
          // Deslizou o suficiente, animar até o final
          Animated.timing(sliderPosition, {
            toValue: buttonWidth - 60,
            duration: 300,
            useNativeDriver: true
          }).start(() => {
            // Após a animação, navegamos para a próxima tela
            navigateToLogin();
          });
        } else {
          // Não deslizou o suficiente, voltar ao início
          Animated.timing(sliderPosition, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          }).start();
        }
      }
    });
  }, [navigation, buttonWidth, slideThreshold]);

  // Iniciar as animações de entrada
  useEffect(() => {
    // Evitar executar as animações mais de uma vez
    if (animationStarted.current) return;
    animationStarted.current = true;
    
    console.log('Iniciando sequência de animações');
    
    // Animação de entrada do cartão
    const cardAnimation = () => {
      console.log('Animando cartão');
      
      // Mover o cartão para a posição e mostrar
      Animated.parallel([
        Animated.timing(cardPosition, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        })
      ]).start();
      
      // Atualizar o estado React para redundância
      setCardVisible(true);
    };
    
    // Animação do texto
    const textAnimation = () => {
      console.log('Animando texto');
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }).start();
      
      // Atualizar o estado React para redundância
      setTextVisible(true);
    };
    
    // Animação do botão
    const buttonAnimation = () => {
      console.log('Animando botão');
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }).start(() => {
        // Marcar como concluído após a última animação
        setAnimationComplete(true);
      });
      
      // Atualizar o estado React para redundância
      setButtonVisible(true);
    };
    
    // Timers para sequenciar as animações
    const timers = [];
    
    // Iniciar cartão após 1 segundo
    const timer1 = setTimeout(cardAnimation, 1000);
    timers.push(timer1);
    
    // Iniciar efeito matriz após 1.5 segundos
    const timer2 = setTimeout(() => {
      console.log('Iniciando efeito matriz');
      cardNumberInterval.current = setInterval(() => {
        setCardNumber(generateRandomCardNumber());
      }, 250);
    }, 1500);
    timers.push(timer2);
    
    // Iniciar texto após 2.5 segundos
    const timer3 = setTimeout(textAnimation, 2500);
    timers.push(timer3);
    
    // Iniciar botão após 3.5 segundos
    const timer4 = setTimeout(buttonAnimation, 3500);
    timers.push(timer4);
    
    // Timer de segurança - garantir que tudo está visível após 4.5 segundos
    const timer5 = setTimeout(() => {
      console.log('Verificação de segurança - garantindo visibilidade');
      setCardVisible(true);
      setTextVisible(true);
      setButtonVisible(true);
      setAnimationComplete(true);
      
      // Forçar valores de animação para garantir visibilidade
      cardOpacity.setValue(1);
      cardPosition.setValue(0);
      textOpacity.setValue(1);
      buttonOpacity.setValue(1);
    }, 4500);
    timers.push(timer5);
    
    // Limpar timers na desmontagem
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      if (cardNumberInterval.current) {
        clearInterval(cardNumberInterval.current);
      }
    };
  }, []);

  // Animar bolhas flutuantes
  useEffect(() => {
    // Função para criar animação oscilante
    const createFloatingAnimation = (animatedValue, baseValue, amplitude, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: baseValue + amplitude,
            duration: duration,
            useNativeDriver: true
          }),
          Animated.timing(animatedValue, {
            toValue: baseValue - amplitude,
            duration: duration,
            useNativeDriver: true
          })
        ])
      ).start();
    };
    
    // Iniciar animações flutuantes com valores diferentes para não sincronizar
    createFloatingAnimation(bubble1Position, 0, 10, 3000);
    createFloatingAnimation(bubble2Position, 0, 15, 4000);
    createFloatingAnimation(bubble3Position, 0, 12, 3500);
  }, []);

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
      <Animated.View 
        style={[
          styles.bubble, 
          styles.bubble1,
          { transform: [{ translateY: bubble1Position }] }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bubble, 
          styles.bubble2,
          { transform: [{ translateY: bubble2Position }] }
        ]} 
      />
      <Animated.View 
        style={[
          styles.bubble, 
          styles.bubble3,
          { transform: [{ translateY: bubble3Position }] }
        ]} 
      />

      <SafeAreaView style={styles.content}>
        {/* Cards animados */}
        <Animated.View 
          style={[
            styles.cardContainer, 
            { 
              opacity: cardOpacity,
              transform: [{ translateY: cardPosition }] 
            },
            // Backup de visibilidade usando estado React
            cardVisible && animationComplete ? { opacity: 1 } : {}
          ]}
        >
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
        <Animated.View 
          style={[
            styles.textContainer, 
            { opacity: textOpacity },
            // Backup de visibilidade usando estado React
            textVisible && animationComplete ? { opacity: 1 } : {}
          ]}
        >
          <Text style={styles.heading}>Simplifique Sua{'\n'}Vida Financeira</Text>
          <Text style={styles.subheading}>
            Monitore seus saldos, mantenha-se no orçamento{'\n'}
            e melhore sua saúde financeira.
          </Text>
        </Animated.View>

        {/* Botão deslizável */}
        <Animated.View 
          style={[
            styles.buttonContainer, 
            { opacity: buttonOpacity },
            // Backup de visibilidade usando estado React
            buttonVisible && animationComplete ? { opacity: 1 } : {}
          ]}
        >
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <Text style={styles.sliderHint}>Deslize para começar</Text>
              <Animated.View 
                style={[
                  styles.sliderKnob, 
                  { transform: [{ translateX: sliderPosition }] }
                ]}
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