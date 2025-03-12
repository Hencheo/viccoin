import { useDispatch, useSelector } from 'react-redux';
import { obterRelatorioPorPeriodo } from '../actions/relatoriosActions';

export const useRelatorios = () => {
  const dispatch = useDispatch();
  const relatorios = useSelector(state => state.relatorios);
  
  const buscarRelatorioPorPeriodo = async (periodo, dataInicio, dataFim, tipo, limite) => {
    return await dispatch(obterRelatorioPorPeriodo(periodo, dataInicio, dataFim, tipo, limite));
  };
  
  return {
    relatorio: {
      periodo: relatorios.periodo,
      transacoes: relatorios.transacoes,
      totalDespesas: relatorios.total_despesas,
      totalGanhos: relatorios.total_ganhos,
      saldoPeriodo: relatorios.saldo_periodo,
      categorias: relatorios.categorias,
    },
    carregando: relatorios.loading,
    erro: relatorios.error,
    
    // Métodos
    buscarRelatorioPorPeriodo,
  };
}; 