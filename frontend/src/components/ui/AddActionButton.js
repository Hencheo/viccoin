import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../styles/theme';

/**
 * AddActionButton - Botão de ação flutuante com menu para adicionar transações
 * 
 * Exibe um botão + centralizado na barra de navegação que, ao ser pressionado,
 * mostra um menu com opções para adicionar despesa, ganho ou ver relatórios.
 */
const AddActionButton = ({ onAction }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  
  // Abre o menu com animação
  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Fecha o menu com animação
  const closeMenu = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };
  
  // Manipula a ação selecionada e fecha o menu
  const handleAction = (action) => {
    closeMenu();
    
    // Pequeno atraso para permitir que a animação termine antes de chamar a ação
    setTimeout(() => {
      if (onAction) {
        onAction(action);
      }
    }, 200);
  };
  
  // Calcular valores de animação para o menu
  const menuOpacity = animation;
  const menuTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  
  // Calcular valores de animação para os itens do menu (efeito cascata)
  const createItemAnimation = (index) => {
    return animation.interpolate({
      inputRange: [0, 1],
      outputRange: [40, 0],
      extrapolate: 'clamp',
    });
  };
  
  return (
    <>
      {/* Botão principal de ação (+) */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={openMenu}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Modal para o menu de ações */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          {/* Container do menu animado */}
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                opacity: menuOpacity,
                transform: [{ translateY: menuTranslateY }]
              }
            ]}
          >
            {/* Item: Adicionar Despesa */}
            <Animated.View 
              style={{ 
                transform: [{ translateY: createItemAnimation(0) }] 
              }}
            >
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleAction('expense')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 92, 117, 0.15)' }]}>
                  <Ionicons name="arrow-down-outline" size={18} color="#FF5C75" />
                </View>
                <Text style={styles.menuItemText}>Adicionar Despesa</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Item: Adicionar Ganho */}
            <Animated.View 
              style={{ 
                transform: [{ translateY: createItemAnimation(1) }] 
              }}
            >
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleAction('income')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(0, 208, 197, 0.15)' }]}>
                  <Ionicons name="arrow-up-outline" size={18} color="#00D0C5" />
                </View>
                <Text style={styles.menuItemText}>Adicionar Ganho</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Item: Ver Relatórios */}
            <Animated.View 
              style={{ 
                transform: [{ translateY: createItemAnimation(2) }] 
              }}
            >
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => handleAction('reports')}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
                  <Ionicons name="bar-chart-outline" size={18} color="#FFB800" />
                </View>
                <Text style={styles.menuItemText}>Ver Relatórios</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Botão principal de adicionar
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D0C5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  // Overlay modal para capturar toques fora do menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  // Container do menu principal
  menuContainer: {
    backgroundColor: '#151B3D',
    width: '90%',
    borderRadius: 16,
    marginBottom: 80,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
  },
  
  // Item individual do menu
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  
  // Ícone do item de menu
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  // Texto do item de menu
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddActionButton; 