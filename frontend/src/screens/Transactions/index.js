import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

// Componentes
import TransactionItem from './components/TransactionItem';
import TransactionEditModal from './components/TransactionEditModal';

// Serviços e utilitários
import { financasService } from '../../services/api';
import { formatarMoeda } from '../../utils/formatters';

// Constantes
const SWIPE_THRESHOLD = -80;

function TransactionsScreen({ navigation, route }) {
  // Estado para armazenar as transações
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Inicializar o filtro com o parâmetro de rota, se disponível, senão usar 'all'
  const [activeFilter, setActiveFilter] = useState(route.params?.filter || 'all');
  // Estado para totais de ganhos e despesas
  const [totals, setTotals] = useState({ totalGanhos: 0, totalDespesas: 0 });
  
  // Estado para edição de transação
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Obtém o usuário autenticado do Redux
  const user = useSelector(state => state.auth.user);
  
  // Carregar transações
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Aqui enviamos o tipo apenas se não for 'all'
      const tipo = activeFilter !== 'all' ? activeFilter : null;
      
      console.log(`Buscando transações com filtro de tipo: ${tipo || 'todas'}`);
      
      // Fazer a requisição para obter todas as transações (não passamos limite)
      const response = await financasService.listarTransacoes(tipo);
      
      if (response.success) {
        console.log(`Transações carregadas com sucesso. Total: ${response.transacoes?.length || 0}`);
        
        // Ordenar transações por data, mais recentes primeiro
        const sortedTransactions = [...(response.transacoes || [])].sort(
          (a, b) => new Date(b.data) - new Date(a.data)
        );
        
        setTransactions(sortedTransactions);
        setTotals({
          totalGanhos: response.total_ganhos || 0,
          totalDespesas: response.total_despesas || 0
        });
      } else {
        // Se a resposta não tem sucesso, mostrar mensagem de erro
        Alert.alert('Erro', response.message || 'Não foi possível carregar as transações.');
        setTransactions([]);
        setTotals({ totalGanhos: 0, totalDespesas: 0 });
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      Alert.alert('Erro', 'Não foi possível carregar as transações. Verifique sua conexão com a internet.');
      setTransactions([]);
      setTotals({ totalGanhos: 0, totalDespesas: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);
  
  // Efeito para atualizar o filtro quando receber um novo parâmetro na rota
  useEffect(() => {
    if (route.params?.filter) {
      const newFilter = route.params.filter;
      console.log(`Atualizando filtro para: ${newFilter}`);
      setActiveFilter(newFilter);
    }
  }, [route.params?.filter]);
  
  // Carregar dados quando o componente montar ou o filtro mudar
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  // Filtra as transações com base no filtro ativo
  const filteredTransactions = useCallback(() => {
    if (activeFilter === 'all') return transactions;
    return transactions.filter(t => t.tipo === activeFilter);
  }, [transactions, activeFilter]);
  
  // Handler para abrir o modal de edição
  const handleEditTransaction = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  }, []);
  
  // Handler para salvar a edição da transação
  const handleSaveEdit = useCallback(async (editedTransaction) => {
    try {
      setIsLoading(true);
      
      // Lógica para identificar o tipo de transação e chamar o endpoint correto
      const { id, tipo, ...dados } = editedTransaction;
      
      try {
        console.log('Atualizando transação:', { id, tipo, dados });
        let response;
        
        if (tipo === 'despesa') {
          response = await financasService.atualizarDespesa(id, dados);
        } else if (tipo === 'ganho') {
          response = await financasService.atualizarGanho(id, dados);
        } else {
          response = await financasService.atualizarSalario(id, dados);
        }
        
        if (response && response.success) {
          Alert.alert('Sucesso', 'Transação atualizada com sucesso');
          fetchTransactions(); // Recarregar a lista
        } else {
          Alert.alert('Erro', response.message || 'Não foi possível atualizar a transação.');
        }
      } catch (error) {
        console.error('Erro ao atualizar transação:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao atualizar a transação. Tente novamente mais tarde.');
      }
    } catch (error) {
      // Log mais amigável
      console.log('Erro ao processar atualização:', error.message || 'Erro desconhecido');
      Alert.alert('Aviso', 'Ocorreu um erro ao atualizar a transação. Tente novamente mais tarde.');
    } finally {
      setEditModalVisible(false);
      setSelectedTransaction(null);
      setIsLoading(false);
    }
  }, [fetchTransactions]);
  
  // Renderizar cabeçalho
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>
          {activeFilter === 'all' ? 'Todas Transações' : 
           activeFilter === 'despesa' ? 'Todas Despesas' : 'Todos Ganhos'}
        </Text>
      </View>
    </View>
  );
  
  // Renderizar filtros
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'all' && styles.activeFilter
        ]}
        onPress={() => setActiveFilter('all')}
      >
        <Text style={[
          styles.filterText,
          activeFilter === 'all' && styles.activeFilterText
        ]}>
          Todas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'despesa' && styles.activeFilter
        ]}
        onPress={() => setActiveFilter('despesa')}
      >
        <Text style={[
          styles.filterText,
          activeFilter === 'despesa' && styles.activeFilterText
        ]}>
          Despesas
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeFilter === 'ganho' && styles.activeFilter
        ]}
        onPress={() => setActiveFilter('ganho')}
      >
        <Text style={[
          styles.filterText,
          activeFilter === 'ganho' && styles.activeFilterText
        ]}>
          Ganhos
        </Text>
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar item da lista
  const renderItem = ({ item }) => (
    <TransactionItem 
      transaction={item}
      onEdit={() => handleEditTransaction(item)}
      formatCurrency={formatarMoeda}
    />
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {renderHeader()}
      {renderFilters()}
      
      <FlatList
        data={filteredTransactions()}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={fetchTransactions}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color="#A239FF" style={styles.loadingIndicator} />
                <Text style={styles.loadingText}>Carregando transações...</Text>
              </>
            ) : (
              <>
                <Icon name="document-text-outline" size={60} color="#444" />
                <Text style={styles.emptyText}>
                  {activeFilter === 'all' 
                    ? 'Nenhuma transação encontrada' 
                    : `Nenhuma ${activeFilter === 'despesa' ? 'despesa' : 'receita'} encontrada`}
                </Text>
              </>
            )}
          </View>
        )}
      />
      
      {selectedTransaction && (
        <TransactionEditModal
          visible={editModalVisible}
          transaction={selectedTransaction}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedTransaction(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#121212',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  activeFilter: {
    backgroundColor: '#A239FF',
  },
  filterText: {
    color: '#BBBBBB',
    fontWeight: '500',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
  },
  loadingIndicator: {
    marginBottom: 16,
  },
  loadingText: {
    color: '#A239FF',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#BBBBBB',
    fontSize: 16,
    marginTop: 16,
  },
});

export default TransactionsScreen; 