import {
  FETCH_TRANSACOES_REQUEST,
  FETCH_TRANSACOES_SUCCESS,
  FETCH_TRANSACOES_FAILURE,
  ADD_TRANSACAO_REQUEST,
  ADD_TRANSACAO_SUCCESS,
  ADD_TRANSACAO_FAILURE,
} from '../constants/actionTypes';
import { financasService } from '../services/api';

export const listarTransacoes = (tipo, limite) => async (dispatch) => {
  dispatch({ type: FETCH_TRANSACOES_REQUEST });
  
  try {
    const response = await financasService.listarTransacoes(tipo, limite);
    
    if (response.success) {
      dispatch({
        type: FETCH_TRANSACOES_SUCCESS,
        payload: response.transacoes,
      });
      return { success: true, data: response.transacoes };
    } else {
      dispatch({
        type: FETCH_TRANSACOES_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: FETCH_TRANSACOES_FAILURE,
      payload: error.message || 'Erro ao listar transações',
    });
    return { success: false, message: error.message || 'Erro ao listar transações' };
  }
};

export const adicionarDespesa = (dados) => async (dispatch) => {
  dispatch({ type: ADD_TRANSACAO_REQUEST });
  
  try {
    const response = await financasService.adicionarDespesa(dados);
    
    if (response.success) {
      const novaDespesa = {
        id: response.despesa_id,
        ...dados,
        tipo: 'despesa',
      };
      
      dispatch({
        type: ADD_TRANSACAO_SUCCESS,
        payload: novaDespesa,
      });
      return { success: true, data: novaDespesa };
    } else {
      dispatch({
        type: ADD_TRANSACAO_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: ADD_TRANSACAO_FAILURE,
      payload: error.message || 'Erro ao adicionar despesa',
    });
    return { success: false, message: error.message || 'Erro ao adicionar despesa' };
  }
};

export const adicionarGanho = (dados) => async (dispatch) => {
  dispatch({ type: ADD_TRANSACAO_REQUEST });
  
  try {
    const response = await financasService.adicionarGanho(dados);
    
    if (response.success) {
      const novoGanho = {
        id: response.ganho_id,
        ...dados,
        tipo: 'ganho',
      };
      
      dispatch({
        type: ADD_TRANSACAO_SUCCESS,
        payload: novoGanho,
      });
      return { success: true, data: novoGanho };
    } else {
      dispatch({
        type: ADD_TRANSACAO_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: ADD_TRANSACAO_FAILURE,
      payload: error.message || 'Erro ao adicionar ganho',
    });
    return { success: false, message: error.message || 'Erro ao adicionar ganho' };
  }
};

export const adicionarSalario = (dados) => async (dispatch) => {
  dispatch({ type: ADD_TRANSACAO_REQUEST });
  
  try {
    const response = await financasService.adicionarSalario(dados);
    
    if (response.success) {
      const novoSalario = {
        id: response.salario_id,
        ...dados,
        tipo: 'salario',
      };
      
      dispatch({
        type: ADD_TRANSACAO_SUCCESS,
        payload: novoSalario,
      });
      return { success: true, data: novoSalario };
    } else {
      dispatch({
        type: ADD_TRANSACAO_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: ADD_TRANSACAO_FAILURE,
      payload: error.message || 'Erro ao adicionar salário',
    });
    return { success: false, message: error.message || 'Erro ao adicionar salário' };
  }
}; 