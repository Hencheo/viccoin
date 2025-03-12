import { SET_CATEGORIAS, ADD_CATEGORIA } from '../constants/actionTypes';

const initialState = {
  despesas: [],
  ganhos: [],
  salarios: [],
};

export default function categoriasReducer(state = initialState, action) {
  switch (action.type) {
    case SET_CATEGORIAS:
      return {
        ...state,
        ...action.payload,
      };
      
    case ADD_CATEGORIA:
      const { tipo, categoria } = action.payload;
      
      if (tipo === 'despesa') {
        return {
          ...state,
          despesas: [...state.despesas, categoria],
        };
      } else if (tipo === 'ganho') {
        return {
          ...state,
          ganhos: [...state.ganhos, categoria],
        };
      } else if (tipo === 'salario') {
        return {
          ...state,
          salarios: [...state.salarios, categoria],
        };
      }
      
      return state;
      
    default:
      return state;
  }
} 