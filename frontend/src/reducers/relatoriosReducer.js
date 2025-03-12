import {
  FETCH_RELATORIO_REQUEST,
  FETCH_RELATORIO_SUCCESS,
  FETCH_RELATORIO_FAILURE,
} from '../constants/actionTypes';

const initialState = {
  periodo: {
    tipo: null,
    data_inicio: null,
    data_fim: null,
  },
  transacoes: [],
  total_despesas: 0,
  total_ganhos: 0,
  saldo_periodo: 0,
  categorias: {},
  loading: false,
  error: null,
};

export default function relatoriosReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_RELATORIO_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
      
    case FETCH_RELATORIO_SUCCESS:
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
      };
      
    case FETCH_RELATORIO_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
      
    default:
      return state;
  }
} 