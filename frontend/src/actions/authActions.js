import { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from '../constants/actionTypes';
import { authService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = (email, password) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });
  
  try {
    const response = await authService.login(email, password);
    
    if (response.success) {
      dispatch({
        type: LOGIN_SUCCESS,
        payload: response.user,
      });
      return { success: true };
    } else {
      dispatch({
        type: LOGIN_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: LOGIN_FAILURE,
      payload: error.message || 'Erro ao fazer login',
    });
    return { success: false, message: error.message || 'Erro ao fazer login' };
  }
};

export const register = (nome, email, password) => async (dispatch) => {
  try {
    console.log('🔑 Iniciando registro de novo usuário:', email);
    const response = await authService.register(nome, email, password);
    
    if (response && response.success) {
      console.log('✅ Registro bem-sucedido no backend:', email);
      // Após registro bem-sucedido, faz login automático
      return dispatch(login(email, password));
    } else {
      // Se a resposta não for bem-sucedida, retornamos o erro
      const errorMessage = response?.message || 'Erro ao registrar usuário';
      console.log(`❌ Erro no registro - Resposta da API: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  } catch (error) {
    // Verificamos se é um erro de rede
    if (error.message && error.message.includes('Network Error')) {
      console.log('⚠️ Erro de rede durante registro, mas usuário pode ter sido criado no Firebase');
      // Tentamos realizar login mesmo assim
      try {
        console.log('🔄 Tentando login após erro de rede no registro...');
        // Aguardamos 1 segundo para dar tempo ao Firebase de processar o cadastro
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Tentamos fazer login com as credenciais
        const loginResult = await dispatch(login(email, password));
        
        if (loginResult.success) {
          console.log('✅ Login bem-sucedido após erro de rede no registro!');
          return { 
            success: true, 
            message: 'Registro realizado com sucesso! Conectado automaticamente.'
          };
        } else {
          console.log('❌ Falha no login após erro de rede no registro');
          return { 
            success: false, 
            message: 'Seu registro pode ter sido criado, mas houve um erro de conexão. Tente fazer login.'
          };
        }
      } catch (loginError) {
        console.error('❌ Erro ao tentar login após registro com erro de rede:', loginError);
        return { 
          success: false, 
          message: 'Registro pode ter sido criado, mas não foi possível conectar. Tente fazer login novamente.'
        };
      }
    }
    
    // Se não for erro de rede, reportamos o erro normalmente
    console.error('❌ Erro no registro:', error);
    return { 
      success: false, 
      message: error.message || 'Erro ao registrar usuário'
    };
  }
};

export const logout = () => async (dispatch) => {
  try {
    await authService.logout();
    dispatch({ type: LOGOUT });
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    // Mesmo com erro, realiza logout local
    dispatch({ type: LOGOUT });
    return { success: true };
  }
};

export const checkAuth = () => async (dispatch) => {
  const token = await AsyncStorage.getItem('@VicCoin:token');
  const userData = await AsyncStorage.getItem('@VicCoin:user');
  
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      dispatch({
        type: LOGIN_SUCCESS,
        payload: user,
      });
      return { success: true };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      await AsyncStorage.removeItem('@VicCoin:token');
      await AsyncStorage.removeItem('@VicCoin:user');
    }
  }
  
  return { success: false };
}; 