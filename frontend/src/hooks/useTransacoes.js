import { useDispatch, useSelector } from 'react-redux';
import { 
  listarTransacoes, 
  adicionarDespesa, 
  adicionarGanho, 
  adicionarSalario 
} from '../actions/transacoesActions';
import { obterResumoFinanceiro } from '../actions/resumoActions';

export const useTransacoes = () => {
  const dispatch = useDispatch();
  const transacoes = useSelector(state => state.transacoes);
  const resumo = useSelector(state => state.resumo);
  
  const buscarTransacoes = async (tipo, limite) => {
    return await dispatch(listarTransacoes(tipo, limite));
  };
  
  const buscarResumo = async () => {
    return await dispatch(obterResumoFinanceiro());
  };
  
  const novaDespesa = async (dados) => {
    const resultado = await dispatch(adicionarDespesa(dados));
    if (resultado.success) {
      // Atualiza o resumo financeiro após adicionar uma despesa
      dispatch(obterResumoFinanceiro());
    }
    return resultado;
  };
  
  const novoGanho = async (dados) => {
    const resultado = await dispatch(adicionarGanho(dados));
    if (resultado.success) {
      // Atualiza o resumo financeiro após adicionar um ganho
      dispatch(obterResumoFinanceiro());
    }
    return resultado;
  };
  
  const novoSalario = async (dados) => {
    const resultado = await dispatch(adicionarSalario(dados));
    if (resultado.success) {
      // Atualiza o resumo financeiro após adicionar um salário
      dispatch(obterResumoFinanceiro());
    }
    return resultado;
  };
  
  return {
    transacoes: transacoes.items,
    carregando: transacoes.loading,
    erro: transacoes.error,
    
    resumo: {
      saldo: resumo.saldo,
      totalDespesas: resumo.total_despesas,
      totalGanhos: resumo.total_ganhos,
      transacoesRecentes: resumo.transacoes_recentes,
      carregando: resumo.loading,
      erro: resumo.error,
    },
    
    // Métodos para manipular transações
    buscarTransacoes,
    buscarResumo,
    novaDespesa,
    novoGanho,
    novoSalario,
  };
}; 