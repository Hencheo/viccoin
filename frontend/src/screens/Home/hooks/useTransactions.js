import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { financasService } from '../../../services/api';
import { formatarMoeda } from '../../../utils/formatters';

/**
 * Hook personalizado para gerenciar todas as transações e dados financeiros da tela Home
 */
export default function useTransactions() {
  const [transacoes, setTransacoes] = useState([]);
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [despesasTotal, setDespesasTotal] = useState(0);
  const [ganhosTotal, setGanhosTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const user = useSelector(state => state.auth.user);
  
  // Função para carregar transações do servidor
  const carregarTransacoes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user || !user.uid) {
        // Se não houver usuário logado, usar dados de exemplo para demonstração
        exibirDadosExemplo();
        return;
      }
      
      const response = await financasService.listarTransacoes(user.uid);
      
      if (response.success) {
        const { transacoes, resumo } = response.data;
        
        setTransacoes(transacoes || []);
        setSaldoDisponivel(resumo?.saldo_disponivel || 0);
        setDespesasTotal(resumo?.despesas_total || 0);
        setGanhosTotal(resumo?.ganhos_total || 0);
      } else {
        setError('Erro ao carregar transações');
        // Usar dados de exemplo em caso de erro
        exibirDadosExemplo();
      }
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setError('Falha ao carregar suas transações. Tente novamente.');
      // Usar dados de exemplo em caso de erro
      exibirDadosExemplo();
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Função para exibir dados de exemplo quando não há dados reais
  const exibirDadosExemplo = useCallback(() => {
    // Dados fictícios para demonstração
    const dataAtual = new Date();
    const dataOntem = new Date(dataAtual);
    dataOntem.setDate(dataAtual.getDate() - 1);
    
    const transacoesExemplo = [
      {
        id: '1',
        tipo: 'despesa',
        categoria: 'Alimentação',
        valor: 45.90,
        descricao: 'Almoço com colegas',
        data: dataAtual.toISOString(),
        icone: 'fast-food-outline'
      },
      {
        id: '2',
        tipo: 'ganho',
        categoria: 'Freelance',
        valor: 350.00,
        descricao: 'Projeto website',
        data: dataOntem.toISOString(),
        icone: 'briefcase-outline'
      },
      {
        id: '3',
        tipo: 'despesa',
        categoria: 'Transporte',
        valor: 120.00,
        descricao: 'Combustível',
        data: dataOntem.toISOString(),
        icone: 'car-outline'
      }
    ];
    
    setTransacoes(transacoesExemplo);
    setSaldoDisponivel(2500.00);
    setDespesasTotal(650.90);
    setGanhosTotal(3150.90);
  }, []);
  
  // Função para adicionar uma nova transação
  const adicionarTransacao = useCallback(async (novaTransacao) => {
    try {
      setIsLoading(true);
      
      if (!user || !user.uid) {
        // Modo de demonstração - apenas adiciona localmente
        const novaTransacaoCompleta = {
          id: Date.now().toString(),
          ...novaTransacao,
          data: new Date().toISOString()
        };
        
        setTransacoes(prev => [novaTransacaoCompleta, ...prev]);
        
        // Atualiza os totais
        if (novaTransacao.tipo === 'despesa') {
          setDespesasTotal(prev => prev + Number(novaTransacao.valor));
          setSaldoDisponivel(prev => prev - Number(novaTransacao.valor));
        } else {
          setGanhosTotal(prev => prev + Number(novaTransacao.valor));
          setSaldoDisponivel(prev => prev + Number(novaTransacao.valor));
        }
        
        return { success: true };
      }
      
      // Se houver usuário, enviar para o servidor
      const response = await financasService.adicionarTransacao(
        user.uid,
        novaTransacao
      );
      
      if (response.success) {
        // Recarregar os dados para obter os valores atualizados do servidor
        await carregarTransacoes();
        return { success: true };
      } else {
        throw new Error(response.message || 'Erro ao adicionar transação');
      }
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      setError('Falha ao adicionar transação. Tente novamente.');
      return { 
        success: false, 
        message: err.message || 'Erro desconhecido ao adicionar transação'
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, carregarTransacoes]);
  
  // Carregar transações quando o componente for montado ou o usuário mudar
  useEffect(() => {
    carregarTransacoes();
  }, [carregarTransacoes]);
  
  // Retornar todos os dados e funções que serão usados na tela Home
  return {
    transacoes,
    saldoDisponivel,
    despesasTotal,
    ganhosTotal,
    isLoading,
    error,
    carregarTransacoes,
    adicionarTransacao,
    formatarMoeda
  };
} 