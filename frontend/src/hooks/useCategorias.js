import { useDispatch, useSelector } from 'react-redux';
import { carregarCategorias, adicionarCategoria } from '../actions/categoriasActions';

export const useCategorias = () => {
  const dispatch = useDispatch();
  const categorias = useSelector(state => state.categorias);
  
  const inicializarCategorias = async () => {
    return await dispatch(carregarCategorias());
  };
  
  const novaCategoria = async (tipo, categoria) => {
    return await dispatch(adicionarCategoria(tipo, categoria));
  };
  
  // Obtém lista de categorias com base no tipo
  const getCategoriasPorTipo = (tipo) => {
    if (tipo === 'despesa') {
      return categorias.despesas;
    } else if (tipo === 'ganho') {
      return categorias.ganhos;
    } else if (tipo === 'salario') {
      return categorias.salarios;
    }
    return [];
  };
  
  return {
    categorias,
    getCategoriasPorTipo,
    inicializarCategorias,
    novaCategoria,
  };
}; 