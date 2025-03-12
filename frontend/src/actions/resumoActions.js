import {
  FETCH_RESUMO_REQUEST,
  FETCH_RESUMO_SUCCESS,
  FETCH_RESUMO_FAILURE,
} from '../constants/actionTypes';
import { financasService } from '../services/api';

export const obterResumoFinanceiro = () => async (dispatch) => {
  dispatch({ type: FETCH_RESUMO_REQUEST });
  
  try {
    const response = await financasService.obterResumoFinanceiro();
    
    if (response.success) {
      dispatch({
        type: FETCH_RESUMO_SUCCESS,
        payload: {
          saldo: response.saldo,
          total_despesas: response.total_despesas,
          total_ganhos: response.total_ganhos,
          transacoes_recentes: response.transacoes_recentes || [],
        },
      });
      return { success: true };
    } else {
      dispatch({
        type: FETCH_RESUMO_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: FETCH_RESUMO_FAILURE,
      payload: error.message || 'Erro ao obter resumo financeiro',
    });
    return { success: false, message: error.message || 'Erro ao obter resumo financeiro' };
  }
}; 