import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/Ionicons';

const BOTTOM_BAR_HEIGHT = 70;

// Estado compartilhado para controle de scroll entre telas
const scrollState = {
  lastScrollY: 0,
  isScrollingDown: false,
  isAnimating: false,
  timestamp: 0
};

// Função otimizada para controle preciso do scroll
export function handleScroll(event) {
  const currentScrollY = event.nativeEvent.contentOffset.y;
  const now = Date.now();
  
  // Ignorar eventos muito próximos para evitar oscilação
  if (now - scrollState.timestamp < 16) return;
  
  // Verificar se estamos no topo da tela
  if (currentScrollY <= 5) {
    scrollState.isScrollingDown = false;
    scrollState.timestamp = now;
    return;
  }
  
  // Detectar direção com base na posição anterior
  const prevScrollY = scrollState.lastScrollY;
  
  // Atualizar direção apenas com movimento significativo (evita jitter)
  if (Math.abs(currentScrollY - prevScrollY) > 1) {
    const isDown = currentScrollY > prevScrollY;
    if (isDown !== scrollState.isScrollingDown) {
      scrollState.isScrollingDown = isDown;
      scrollState.timestamp = now;
    }
  }
  
  // Sempre atualizar a última posição
  scrollState.lastScrollY = currentScrollY;
}

const AppBottomBar = ({ navigation, activeTab = 'home' }) => {
  // Criar referência para animação
  const translateY = useRef(new Animated.Value(0)).current;
  const lastDirection = useRef(null);
  const animationRef = useRef(null);
  
  // Controlar animação com base no estado de scroll
  useEffect(() => {
    function checkScrollDirection() {
      // Sempre mostrar barra quando estiver no topo
      if (scrollState.lastScrollY <= 5) {
        if (lastDirection.current !== 'up') {
          if (animationRef.current) animationRef.current.stop();
          
          animationRef.current = Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 9
          });
          
          animationRef.current.start();
          lastDirection.current = 'up';
        }
        return;
      }
      
      // Animar baseado na direção de scroll
      if (scrollState.isScrollingDown) {
        if (lastDirection.current !== 'down') {
          if (animationRef.current) animationRef.current.stop();
          
          animationRef.current = Animated.spring(translateY, {
            toValue: BOTTOM_BAR_HEIGHT + 35,
            useNativeDriver: true,
            tension: 100,
            friction: 10
          });
          
          animationRef.current.start();
          lastDirection.current = 'down';
        }
      } else {
        if (lastDirection.current !== 'up') {
          if (animationRef.current) animationRef.current.stop();
          
          animationRef.current = Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120, // Mais rápido para aparecer
            friction: 8
          });
          
          animationRef.current.start();
          lastDirection.current = 'up';
        }
      }
    }
    
    // Verificar a cada 100ms - frequência suficiente para UI suave
    // mas não tão frequente que cause problemas de performance
    const interval = setInterval(checkScrollDirection, 100);
    
    return () => {
      clearInterval(interval);
      if (animationRef.current) animationRef.current.stop();
    };
  }, [translateY]);

  const handleTabPress = (tabName) => {
    if (tabName === 'home' && navigation) {
      navigation.navigate('Home');
    } else if (tabName === 'settings' && navigation) {
      navigation.navigate('Config');
    } else if (tabName === 'profile' && navigation) {
      navigation.navigate('Profile');
    } else if (tabName === 'reports' && navigation) {
      navigation.navigate('Reports');
    }
  };

  // Renderiza um item do menu de navegação
  const renderNavItem = (name, iconName) => {
    const isActive = activeTab === name;
    
    return (
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handleTabPress(name)}
        activeOpacity={0.7}
      >
        <View style={styles.navItemContent}>
          <View 
            style={[
              styles.iconContainer, 
              isActive && styles.activeHomeContainer
            ]}
          >
            <Icon 
              name={iconName} 
              size={isActive ? 26 : 22} 
              color={isActive ? '#A239FF' : '#888888'} 
              style={isActive && styles.activeIcon}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Conteúdo interno do BottomBar
  const renderContent = () => (
    <View style={styles.content}>
      {renderNavItem('home', 'home')}
      {renderNavItem('reports', 'stats-chart')}
      {renderNavItem('settings', 'settings')}
      {renderNavItem('profile', 'person')}
    </View>
  );

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }]
        }
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={65} style={styles.blurContainer} tint="dark">
          {renderContent()}
        </BlurView>
      ) : (
        <View style={styles.androidContainer}>
          {renderContent()}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 35,
    left: 20,
    right: 20,
    height: BOTTOM_BAR_HEIGHT,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: 'rgba(55, 55, 55, 0.75)',
  },
  androidContainer: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: 'rgba(55, 55, 55, 0.85)',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeHomeContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  activeIcon: {
    textShadowColor: 'rgba(162, 57, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  }
});

export default AppBottomBar; 