import React, { useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Text } from 'react-native-paper';
import Animated from 'react-native-reanimated';

// Componentes
import ProfileHeader from './components/ProfileHeader';
import MenuSection from './components/MenuSection';
import AppBottomBar, { handleScroll } from '../../components/AppBottomBar';

// Hooks e utils
import useProfileActions from './hooks/useProfileActions';

function ProfileScreen({ navigation }) {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  
  const { 
    handleLogout, 
    handleUpdateProfile,
    handleToggleBiometricAuth,
  } = useProfileActions();
  
  // Handler para funcionalidades em desenvolvimento
  const handleFeatureInDevelopment = () => {
    Alert.alert(
      "Em desenvolvimento",
      "Esta funcionalidade estará disponível em breve!",
      [{ text: "OK" }]
    );
  };
  
  // Seções de menu do perfil
  const accountSection = [
    { 
      icon: 'person-outline', 
      title: 'Dados Pessoais', 
      onPress: handleFeatureInDevelopment,
      chevron: true,
      iconColor: '#A239FF',
    },
    { 
      icon: 'mail-outline', 
      title: 'Email e Notificações', 
      onPress: handleFeatureInDevelopment,
      chevron: true,
      iconColor: '#A239FF',
    },
  ];
  
  const securitySection = [
    { 
      icon: 'lock-closed-outline', 
      title: 'Alterar Senha', 
      onPress: handleFeatureInDevelopment,
      chevron: true,
      iconColor: '#A239FF',
    },
    { 
      icon: 'finger-print-outline', 
      title: 'Autenticação Biométrica', 
      onPress: handleToggleBiometricAuth,
      toggle: true,
      value: user?.biometricEnabled || false,
      iconColor: '#A239FF',
    },
  ];
  
  const preferencesSection = [
    { 
      icon: 'color-palette-outline', 
      title: 'Tema do Aplicativo', 
      onPress: handleFeatureInDevelopment,
      chevron: true,
      iconColor: '#A239FF',
    },
    { 
      icon: 'notifications-outline', 
      title: 'Notificações', 
      onPress: handleFeatureInDevelopment,
      chevron: true,
      iconColor: '#A239FF',
    },
    { 
      icon: 'language-outline', 
      title: 'Idioma', 
      subtitle: 'Português',
      onPress: handleFeatureInDevelopment,
      chevron: true,
      iconColor: '#A239FF',
    },
  ];
  
  const dangerSection = [
    { 
      icon: 'log-out-outline', 
      title: 'Sair do Aplicativo', 
      onPress: handleLogout,
      textColor: '#FF5252',
      iconColor: '#FF5252',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header padronizado conforme a tela de configurações */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#AAA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerRight} />
      </View>
      
      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <ProfileHeader 
          user={user} 
          onEditPress={() => navigation.navigate('EditProfile')}
        />
        
        <View style={styles.content}>
          <MenuSection 
            title="Conta" 
            items={accountSection} 
            titleColor="#A239FF"
          />
          
          <MenuSection 
            title="Segurança" 
            items={securitySection} 
            titleColor="#A239FF"
          />
          
          <MenuSection 
            title="Preferências" 
            items={preferencesSection} 
            titleColor="#A239FF"
          />
          
          <MenuSection 
            title="" 
            items={dangerSection} 
            style={styles.dangerSection}
          />
        </View>
      </Animated.ScrollView>
      
      {/* BottomBar - Não precisa mais receber isScrollingDown */}
      <AppBottomBar 
        navigation={navigation} 
        activeTab="profile" 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2C',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2C',
  },
  headerRight: {
    width: 36, // Mantém o espaçamento simétrico no header
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dangerSection: {
    marginTop: 40,
  }
});

export default ProfileScreen; 