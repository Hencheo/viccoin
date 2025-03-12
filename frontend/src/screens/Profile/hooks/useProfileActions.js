import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import * as LocalAuthentication from 'expo-local-authentication';

// Este hook centraliza todas as ações relacionadas ao perfil do usuário
export default function useProfileActions() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  
  // Função para fazer logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sair do aplicativo',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => {
            // Aqui você despacharia a ação de logout do Redux
            dispatch({ type: 'LOGOUT' });
          },
        },
      ]
    );
  }, [dispatch]);
  
  // Função para atualizar o perfil
  const handleUpdateProfile = useCallback(async (profileData) => {
    try {
      // Aqui você despacharia a ação para atualizar o perfil no Redux e no servidor
      const action = {
        type: 'UPDATE_PROFILE_REQUEST',
        payload: profileData
      };
      
      dispatch(action);
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao atualizar perfil' 
      };
    }
  }, [dispatch]);
  
  // Função para alternar a autenticação biométrica
  const handleToggleBiometricAuth = useCallback(async () => {
    try {
      // Verificar se o dispositivo suporta biometria
      const compatible = await LocalAuthentication.hasHardwareAsync();
      
      if (!compatible) {
        Alert.alert(
          'Biometria não disponível',
          'Seu dispositivo não suporta autenticação biométrica.'
        );
        return;
      }
      
      // Verificar que tipo de biometria está disponível
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // Verificar se o usuário tem biometria registrada
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!enrolled) {
        Alert.alert(
          'Biometria não configurada',
          'Por favor, configure a biometria nas configurações do seu dispositivo primeiro.'
        );
        return;
      }
      
      const biometricEnabled = user?.biometricEnabled || false;
      
      if (!biometricEnabled) {
        // Se estiver habilitando, precisamos autenticar primeiro
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Autenticar para ativar biometria',
          cancelLabel: 'Cancelar',
          disableDeviceFallback: true,
        });
        
        if (result.success) {
          // Após autenticação bem-sucedida, atualizar o perfil
          dispatch({ 
            type: 'UPDATE_PROFILE_REQUEST',
            payload: { biometricEnabled: true }
          });
        }
      } else {
        // Se estiver desabilitando, apenas atualizar o perfil
        dispatch({ 
          type: 'UPDATE_PROFILE_REQUEST',
          payload: { biometricEnabled: false }
        });
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao configurar a autenticação biométrica.'
      );
    }
  }, [dispatch, user]);
  
  // Função para excluir a conta
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Aqui você despacharia a ação para excluir a conta no Redux e no servidor
              dispatch({ type: 'DELETE_ACCOUNT_REQUEST' });
              
              // Após exclusão bem-sucedida, fazer logout
              dispatch({ type: 'LOGOUT' });
            } catch (error) {
              console.error('Erro ao excluir conta:', error);
              Alert.alert(
                'Erro',
                'Ocorreu um erro ao excluir sua conta. Tente novamente mais tarde.'
              );
            }
          },
        },
      ]
    );
  }, [dispatch]);
  
  return {
    handleLogout,
    handleUpdateProfile,
    handleToggleBiometricAuth,
    handleDeleteAccount
  };
} 