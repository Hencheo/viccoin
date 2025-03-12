import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import * as biometricService from '../services/BiometricService';

// Criando o contexto de autenticação
const AuthContext = createContext({});

// Provider que proverá o contexto para a aplicação
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Carrega os dados do usuário do AsyncStorage e verifica suporte à biometria
  useEffect(() => {
    async function loadStorageData() {
      try {
        // Busca os dados do usuário e do token do AsyncStorage
        const storedUser = await AsyncStorage.getItem('@VicCoin:user');
        const storedToken = await AsyncStorage.getItem('@VicCoin:token');

        if (storedUser && storedToken) {
          console.log('Dados encontrados no AsyncStorage:', storedUser);
          setUser(JSON.parse(storedUser));
        } else {
          console.log('Nenhum dado de usuário encontrado no AsyncStorage');
        }
        
        // Verifica suporte à biometria
        const available = await biometricService.isBiometricAvailable();
        setBiometricSupported(available);
        
        if (available) {
          // Obtém os tipos de biometria disponíveis
          const types = await biometricService.getBiometricTypes();
          setBiometricType(types.length > 0 ? types[0] : null);
          
          // Verifica se a biometria está habilitada
          const enabled = await biometricService.isBiometricEnabled();
          setBiometricEnabled(enabled);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do storage:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  // Função para realizar login
  async function signIn(email, password) {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Tentando fazer login com:', email);
      const response = await authService.login(email, password);
      console.log('Resposta do login:', response);
      
      if (response.success) {
        console.log('Login bem-sucedido, definindo usuário:', response.user);
        setUser(response.user);
        
        // Verificar se o usuário foi definido corretamente
        setTimeout(() => {
          console.log('Estado do usuário após login:', user);
          console.log('Signed:', !!user);
        }, 100);
        
        return { success: true };
      } else {
        setError(response.message || 'Erro ao fazer login');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Erro completo no login:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao se conectar ao servidor';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }

  // Função para realizar login com biometria
  async function signInWithBiometrics() {
    try {
      setError(null);
      setLoading(true);
      
      // Verifica se a biometria está habilitada
      const enabled = await biometricService.isBiometricEnabled();
      if (!enabled) {
        return { success: false, message: 'Autenticação biométrica não está habilitada' };
      }
      
      // Autentica com biometria
      const result = await biometricService.authenticateWithBiometrics();
      
      if (result.success) {
        // Obtém os dados do usuário salvos para biometria
        const userData = await biometricService.getBiometricUserData();
        
        if (userData) {
          setUser(userData);
          return { success: true };
        } else {
          return { success: false, message: 'Dados do usuário não encontrados' };
        }
      } else {
        return { success: false, message: 'Autenticação biométrica falhou' };
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      return { success: false, message: 'Erro na autenticação biométrica' };
    } finally {
      setLoading(false);
    }
  }

  // Função para realizar cadastro
  async function signUp(nome, email, password) {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.register(nome, email, password);
      
      if (response.success) {
        return { success: true };
      } else {
        setError(response.message || 'Erro ao criar conta');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao se conectar ao servidor';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }

  // Função para realizar logout
  async function signOut() {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  }

  // Função para habilitar/desabilitar biometria
  async function toggleBiometricAuth(enabled) {
    try {
      console.log(`Tentando ${enabled ? 'habilitar' : 'desabilitar'} a autenticação biométrica`);
      console.log('Dados do usuário atual:', user);
      
      if (enabled && !user) {
        console.error('Erro: Tentativa de habilitar biometria sem usuário autenticado');
        return { 
          success: false, 
          message: 'Não é possível habilitar a biometria sem um usuário conectado' 
        };
      }
      
      // Verifica se o dispositivo suporta biometria
      const available = await biometricService.isBiometricAvailable();
      console.log('Biometria disponível no dispositivo:', available);
      
      if (enabled && !available) {
        console.error('Erro: Tentativa de habilitar biometria em dispositivo não compatível');
        return { 
          success: false, 
          message: 'Seu dispositivo não suporta autenticação biométrica' 
        };
      }
      
      console.log('Salvando configuração de biometria:', enabled);
      const result = await biometricService.setBiometricEnabled(enabled, user);
      console.log('Resultado da operação setBiometricEnabled:', result);
      
      if (result) {
        setBiometricEnabled(enabled);
        console.log('Estado de biometria atualizado com sucesso');
        return { success: true };
      } else {
        console.error('Falha ao configurar biometria no AsyncStorage');
        return { 
          success: false, 
          message: 'Erro ao salvar configuração de biometria' 
        };
      }
    } catch (error) {
      console.error('Erro completo ao configurar biometria:', error);
      return { 
        success: false, 
        message: `Erro ao configurar autenticação biométrica: ${error.message}` 
      };
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error,
        signed: !!user, 
        signIn, 
        signUp, 
        signOut,
        biometricSupported,
        biometricType,
        biometricEnabled,
        signInWithBiometrics,
        toggleBiometricAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto de autenticação
function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth }; 