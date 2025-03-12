import {
  FETCH_RESUMO_REQUEST,
  FETCH_RESUMO_SUCCESS,
  FETCH_RESUMO_FAILURE,
} from '../constants/actionTypes';

const initialState = {
  saldo: 0,
  total_despesas: 0,
  total_ganhos: 0,
  transacoes_recentes: [],
  loading: false,
  error: null,
};

export default function resumoReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_RESUMO_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
      
    case FETCH_RESUMO_SUCCESS:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
      };
      
    case FETCH_RESUMO_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
      
    default:
      return state;
  }
} 