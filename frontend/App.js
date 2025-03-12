import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import StoreProvider from './src/contexts/StoreProvider';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <StoreProvider>
      <StatusBar barStyle="light-content" backgroundColor="#8A2BE2" />
      <AppNavigator />
    </StoreProvider>
  );
}
