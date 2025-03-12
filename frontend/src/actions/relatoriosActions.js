import {
  FETCH_RELATORIO_REQUEST,
  FETCH_RELATORIO_SUCCESS,
  FETCH_RELATORIO_FAILURE,
} from '../constants/actionTypes';
import { financasService } from '../services/api';

export const obterRelatorioPorPeriodo = (periodo, dataInicio, dataFim, tipo, limite) => async (dispatch) => {
  dispatch({ type: FETCH_RELATORIO_REQUEST });
  
  try {
    const response = await financasService.obterRelatorioPorPeriodo(periodo, dataInicio, dataFim, tipo, limite);
    
    if (response.success) {
      dispatch({
        type: FETCH_RELATORIO_SUCCESS,
        payload: response.relatorio,
      });
      return { success: true, data: response.relatorio };
    } else {
      dispatch({
        type: FETCH_RELATORIO_FAILURE,
        payload: response.message,
      });
      return { success: false, message: response.message };
    }
  } catch (error) {
    dispatch({
      type: FETCH_RELATORIO_FAILURE,
      payload: error.message || 'Erro ao obter relatório',
    });
    return { success: false, message: error.message || 'Erro ao obter relatório' };
  }
}; 