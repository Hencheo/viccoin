import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../styles/theme';
import AddActionButton from './AddActionButton';

/**
 * BottomNavBar - Barra de navegação inferior reutilizável
 * 
 * Componente que implementa a barra de navegação inferior com 4 botões:
 * - Início
 * - Configurações
 * - Adicionar
 * - Perfil
 */
const BottomNavBar = ({ navigation, currentScreen, onAddAction }) => {
  const isActive = (screenName) => currentScreen === screenName;
  
  // Navega para a tela selecionada
  const navigateTo = (screenName) => {
    if (currentScreen !== screenName) {
      navigation.navigate(screenName);
    }
  };
  
  return (
    <View style={styles.navigationBar}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigateTo('Home')}
      >
        <Ionicons 
          name={isActive('Home') ? "home" : "home-outline"} 
          size={24} 
          color={isActive('Home') ? theme.colors.ui.iconActive : theme.colors.ui.iconInactive} 
        />
        <Text style={isActive('Home') ? styles.navItemTextActive : styles.navItemText}>
          Início
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigateTo('Settings')}
      >
        <Ionicons 
          name={isActive('Settings') ? "settings" : "settings-outline"} 
          size={24} 
          color={isActive('Settings') ? theme.colors.ui.iconActive : theme.colors.ui.iconInactive} 
        />
        <Text style={isActive('Settings') ? styles.navItemTextActive : styles.navItemText}>
          Config.
        </Text>
      </TouchableOpacity>
      
      {/* Botão de adicionar (+) agora como parte da navegação */}
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onAddAction && onAddAction('menu')}
      >
        <View style={styles.addButtonContainer}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.navItemText}>
          Adicionar
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigateTo('Profile')}
      >
        <Ionicons 
          name={isActive('Profile') ? "person" : "person-outline"} 
          size={24} 
          color={isActive('Profile') ? theme.colors.ui.iconActive : theme.colors.ui.iconInactive} 
        />
        <Text style={isActive('Profile') ? styles.navItemTextActive : styles.navItemText}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Barra de navegação inferior
  navigationBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0F2C', // Cor de fundo sólida
    height: theme.bottomNavHeight,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  
  // Item da navegação
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    flex: 1,
  },
  
  // Texto dos itens da navegação
  navItemText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  
  // Texto do item ativo
  navItemTextActive: {
    color: theme.colors.ui.iconActive,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  
  // Container para o botão adicionar
  addButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00D0C5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});

export default BottomNavBar; 