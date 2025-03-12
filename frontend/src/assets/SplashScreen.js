import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  // Valores animados
  const opacityValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(0.8);

  // Carregar qualquer fonte personalizada se necessário
  const [fontsLoaded] = useFonts({
    // Aqui você pode adicionar fontes personalizadas quando tiver
  });

  useEffect(() => {
    // Iniciar animações quando o componente montar
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Timer para fechar a tela de splash
    const timer = setTimeout(() => {
      // Animar saída
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(onFinish);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Estilos animados
  const animatedStyle = {
    opacity: opacityValue,
    transform: [{ scale: scaleValue }],
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4B0082', '#6A36D9', '#3B0062']}
        style={styles.gradient}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
      >
        {/* Efeitos de fumaça/neblina */}
        <View style={styles.nebulaSmoke1} />
        <View style={styles.nebulaSmoke2} />
        <View style={styles.nebulaSmoke3} />
        <View style={styles.nebulaGlow} />

        <Animated.View style={[styles.content, animatedStyle]}>
          <Text style={styles.title}>VicCoin</Text>
          <Text style={styles.subtitle}>Controle financeiro inteligente</Text>
          
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>V</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4B0082',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nebulaSmoke1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: '#8A2BE2',
    opacity: 0.2,
    top: -width * 0.5,
    left: -width * 0.5,
  },
  nebulaSmoke2: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: '#9370DB',
    opacity: 0.15,
    bottom: -width * 0.3,
    right: -width * 0.3,
  },
  nebulaSmoke3: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#7B68EE',
    opacity: 0.2,
    top: height * 0.2,
    right: -width * 0.2,
  },
  nebulaGlow: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: '#FFF',
    opacity: 0.07,
    top: height * 0.15,
    left: width * 0.15,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
  },
  logoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
});

export default SplashScreen; 