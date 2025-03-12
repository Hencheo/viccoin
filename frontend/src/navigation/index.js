import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform } from 'react-native';

// Importando telas
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';

// Importando o contexto de autenticação
import { useAuth } from '../contexts/AuthContext';

// Criando navegadores
const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

// Função para renderizar as rotas de autenticação (quando não estiver logado)
function AuthRoutes() {
  return (
    <AuthStack.Navigator 
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
    </AuthStack.Navigator>
  );
}

// Função para renderizar as rotas do app (quando estiver logado)
function AppRoutes() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      <AppStack.Screen name="Home" component={Home} />
    </AppStack.Navigator>
  );
}

// Componente principal de navegação
function Navigation() {
  const { signed, loading, user } = useAuth();

  console.log('Estado de navegação:', { signed, loading, hasUser: !!user });

  // Renderizando um splash screen enquanto carrega os dados de autenticação
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar 
        backgroundColor="#f5f5f5" 
        barStyle="dark-content" 
        translucent={Platform.OS === 'android'}
      />
      {signed ? (
        <AppRoutes />
      ) : (
        <AuthRoutes />
      )}
    </NavigationContainer>
  );
}

export default Navigation; 