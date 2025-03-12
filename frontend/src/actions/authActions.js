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
    const response = await authService.register(nome, email, password);
    
    if (response.success) {
      // Após registro bem-sucedido, faz login automático
      return dispatch(login(email, password));
    } else {
      return { success: false, message: response.message };
    }
  } catch (error) {
    return { success: false, message: error.message || 'Erro ao registrar' };
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