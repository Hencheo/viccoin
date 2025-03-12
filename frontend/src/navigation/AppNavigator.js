import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Importando telas
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ConfigScreen from '../screens/ConfigScreen';

// Importando as novas telas de perfil
import ProfileScreen from '../screens/Profile';
import EditProfile from '../screens/Profile/EditProfile';

// Importando a tela de relatórios
import ReportsScreen from '../screens/Reports';

// Importando a tela de transações
import TransactionsScreen from '../screens/Transactions';

const Stack = createStackNavigator();

function AppNavigator() {
  // Verificar se o usuário está autenticado
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Welcome"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Fluxo de autenticação */}
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Telas protegidas (requerem autenticação)
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Config" component={ConfigScreen} />
            
            {/* Telas de Perfil */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            
            {/* Tela de Relatórios */}
            <Stack.Screen name="Reports" component={ReportsScreen} />
            
            {/* Tela de Transações */}
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
            
            {/* Telas adicionais do perfil */}
            <Stack.Screen name="PersonalData" component={EditProfile} />
            <Stack.Screen name="EmailSettings" component={ConfigScreen} />
            <Stack.Screen name="ChangePassword" component={ConfigScreen} />
            <Stack.Screen name="AppTheme" component={ConfigScreen} />
            <Stack.Screen name="NotificationSettings" component={ConfigScreen} />
            <Stack.Screen name="LanguageSettings" component={ConfigScreen} />
            <Stack.Screen name="HelpCenter" component={ConfigScreen} />
            <Stack.Screen name="ContactUs" component={ConfigScreen} />
            <Stack.Screen name="RateApp" component={ConfigScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator; 