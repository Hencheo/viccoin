import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Importação direta das telas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddIncomeScreen from '../screens/AddIncomeScreen';

// Criação do Stack Navigator
const Stack = createStackNavigator();

/**
 * AppNavigator - Sistema de navegação principal do aplicativo
 * 
 * Gerencia a navegação entre telas com as seguintes características:
 * - Modo header: 'none' para todas as telas (header customizado em cada tela)
 * - Animações de transição suaves
 * - Hierarquia de telas organizada (auth e app)
 */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0A0F2C' },
          animationEnabled: true,
          gestureEnabled: false,
        }}
      >
        {/* Telas de autenticação */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Telas do aplicativo */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
        {/* Telas de transações financeiras */}
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
        <Stack.Screen name="AddIncome" component={AddIncomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 