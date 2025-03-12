import {
  FETCH_TRANSACOES_REQUEST,
  FETCH_TRANSACOES_SUCCESS,
  FETCH_TRANSACOES_FAILURE,
  ADD_TRANSACAO_SUCCESS,
} from '../constants/actionTypes';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

export default function transacoesReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_TRANSACOES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
      
    case FETCH_TRANSACOES_SUCCESS:
      return {
        ...state,
        items: action.payload,
        loading: false,
        error: null,
      };
      
    case FETCH_TRANSACOES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
      
    case ADD_TRANSACAO_SUCCESS:
      return {
        ...state,
        items: [action.payload, ...state.items],
      };
      
    default:
      return state;
  }
} 