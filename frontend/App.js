import React from 'react';
import { LogBox } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

// Ignorar avisos específicos (opcional)
LogBox.ignoreLogs(['Warning: ...']); // Adapte conforme necessário

export default function App() {
  return (
    <PaperProvider>
      <AppNavigator />
    </PaperProvider>
  );
} 