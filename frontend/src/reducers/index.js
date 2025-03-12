import { combineReducers } from 'redux';
import authReducer from './authReducer';
import transacoesReducer from './transacoesReducer';
import resumoReducer from './resumoReducer';
import relatoriosReducer from './relatoriosReducer';
import categoriasReducer from './categoriasReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  transacoes: transacoesReducer,
  resumo: resumoReducer,
  relatorios: relatoriosReducer,
  categorias: categoriasReducer,
});

export default rootReducer; 