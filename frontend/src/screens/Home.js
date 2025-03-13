import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, RefreshControl, Platform, ActionSheetIOS } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, TextInput, Avatar, Portal, Modal, List, Divider, Menu } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';
import { financasService } from '../services/api';
import { formatarMoeda } from '../utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

function Home({ navigation }) {
  const { user, signOut } = useAuth();
  const [resumo, setResumo] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoTransacao, setTipoTransacao] = useState('');
  
  // Estados para os formulários
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [local, setLocal] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [recorrente, setRecorrente] = useState(false);
  
  // Estados para categorias personalizáveis
  const [categoriasPadraoDespesas, setCategoriasPadraoDespesas] = useState([
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
    'Lazer', 'Supermercado', 'Vestuário', 'Outras'
  ]);
  const [categoriasPadraoGanhos, setCategoriasPadraoGanhos] = useState([
    'Salário', 'Freelance', 'Investimentos', 'Vendas', 'Presentes', 'Outras'
  ]);
  const [categoriasPadraoSalario, setCategoriasPadraoSalario] = useState([
    'Mensal', 'Quinzenal', 'Semanal', 'Bônus', 'Participação', 'Outras'
  ]);
  
  // Estado para modal de nova categoria
  const [categoriaModalVisible, setCategoriaModalVisible] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  
  // Carregar categorias personalizadas ao iniciar
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        // Carregar do AsyncStorage
        const despesasString = await AsyncStorage.getItem('@VicCoin:categoriasDespesas');
        const ganhosString = await AsyncStorage.getItem('@VicCoin:categoriasGanhos');
        const salarioString = await AsyncStorage.getItem('@VicCoin:categoriasSalario');
        
        if (despesasString) {
          setCategoriasPadraoDespesas(JSON.parse(despesasString));
        }
        
        if (ganhosString) {
          setCategoriasPadraoGanhos(JSON.parse(ganhosString));
        }
        
        if (salarioString) {
          setCategoriasPadraoSalario(JSON.parse(salarioString));
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    
    carregarCategorias();
  }, []);
  
  // Função para adicionar nova categoria
  const adicionarNovaCategoria = async () => {
    if (novaCategoria.trim() === '') {
      Alert.alert('Erro', 'O nome da categoria não pode ser vazio');
      return;
    }
    
    try {
      let categorias;
      let chaveStorage;
      
      if (tipoTransacao === 'despesa') {
        // Verifica se a categoria já existe
        if (!categoriasPadraoDespesas.includes(novaCategoria)) {
          categorias = [...categoriasPadraoDespesas, novaCategoria];
          setCategoriasPadraoDespesas(categorias);
          chaveStorage = '@VicCoin:categoriasDespesas';
        } else {
          Alert.alert('Atenção', 'Esta categoria já existe');
          return;
        }
      } else if (tipoTransacao === 'ganho') {
        // Verifica se a categoria já existe
        if (!categoriasPadraoGanhos.includes(novaCategoria)) {
          categorias = [...categoriasPadraoGanhos, novaCategoria];
          setCategoriasPadraoGanhos(categorias);
          chaveStorage = '@VicCoin:categoriasGanhos';
        } else {
          Alert.alert('Atenção', 'Esta categoria já existe');
          return;
        }
      } else {
        // Verifica se a categoria já existe
        if (!categoriasPadraoSalario.includes(novaCategoria)) {
          categorias = [...categoriasPadraoSalario, novaCategoria];
          setCategoriasPadraoSalario(categorias);
          chaveStorage = '@VicCoin:categoriasSalario';
        } else {
          Alert.alert('Atenção', 'Esta categoria já existe');
          return;
        }
      }
      
      // Salvar no AsyncStorage
      await AsyncStorage.setItem(chaveStorage, JSON.stringify(categorias));
      
      // Usar imediatamente
      setCategoria(novaCategoria);
      setCategoriaModalVisible(false);
      setNovaCategoria('');
      
      Alert.alert('Sucesso', 'Categoria adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a categoria');
    }
  };
  
  // Carregar dados do usuário
  const carregarDados = async () => {
    setLoading(true);
    try {
      // Obter resumo financeiro
      const resumoData = await financasService.obterResumoFinanceiro();
      setResumo(resumoData);
      
      // Obter transações
      const transacoesData = await financasService.listarTransacoes(null, 10);
      setTransacoes(transacoesData.transacoes || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados financeiros.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    carregarDados();
  }, []);
  
  // Função para atualizar dados (pull-to-refresh)
  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };
  
  // Abrir modal para adicionar transação
  const abrirModal = (tipo) => {
    setTipoTransacao(tipo);
    setValor('');
    setDescricao('');
    setCategoria('');
    setLocal('');
    setData(new Date().toISOString().split('T')[0]);
    setRecorrente(false);
    setModalVisible(true);
  };
  
  // Obter lista de categorias com base no tipo de transação
  const getCategorias = () => {
    if (tipoTransacao === 'despesa') {
      return categoriasPadraoDespesas;
    } else if (tipoTransacao === 'ganho') {
      return categoriasPadraoGanhos;
    } else {
      return categoriasPadraoSalario;
    }
  };
  
  // Salvar nova transação
  const salvarTransacao = async () => {
    // Validação inicial do valor
    if (!valor || isNaN(parseFloat(valor))) {
      Alert.alert('Erro', 'Por favor, informe um valor válido.');
      return;
    }
    
    // Validação da categoria
    if (!categoria) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria.');
      return;
    }

    try {
      setLoading(true);
      
      // Verificar token de autenticação
      const token = await AsyncStorage.getItem('@VicCoin:token');
      console.log('🔑 Token de autenticação:', token ? `${token.substring(0, 10)}... (${token.length} caracteres)` : 'Ausente');
      
      if (!token) {
        console.warn('⚠️ Token não encontrado! O usuário pode não estar autenticado corretamente.');
        Alert.alert('Erro de Autenticação', 'Parece que você não está logado. Por favor, faça login novamente.');
        signOut(); // Redirecionar para login
        return;
      }
      
      // Construir dados base da transação
      let dados = {
        valor: parseFloat(valor.replace(',', '.')), // Garantir formato numérico correto
        descricao: descricao || `${tipoTransacao} sem descrição`,
        categoria: categoria,
        data: data,
        recorrente: recorrente || false,
      };
      
      // Adicionar local se for uma despesa
      if (tipoTransacao === 'despesa' && local) {
        dados.local = local;
      }
      
      console.log('📊 Dados a serem enviados:', JSON.stringify(dados, null, 2));
      
      let resposta;
      
      try {
        console.log(`🔄 Iniciando envio de ${tipoTransacao} para a API...`);
        
        if (tipoTransacao === 'despesa') {
          console.log('💸 Enviando despesa para API...');
          resposta = await financasService.adicionarDespesa(dados);
        } else if (tipoTransacao === 'ganho') {
          console.log('💰 Enviando ganho para API...');
          resposta = await financasService.adicionarGanho(dados);
        } else if (tipoTransacao === 'salario') {
          // Ajustar dados específicos para salário
          const dadosSalario = {
            valor: parseFloat(valor.replace(',', '.')),
            descricao: descricao || 'Salário',
            categoria: categoria,
            data_recebimento: data,
            periodo: 'mensal',
            recorrente: true
          };
          
          console.log('💼 Enviando salário para API com dados:', JSON.stringify(dadosSalario, null, 2));
          resposta = await financasService.adicionarSalario(dadosSalario);
        }
        
        console.log('✅ Resposta da API:', JSON.stringify(resposta, null, 2));
      } catch (error) {
        console.error('❌ Erro na requisição à API:', error.message || error);
        console.error('❌ Tipo do erro:', typeof error);
        
        // Tentar obter mais detalhes do erro
        if (error.response) {
          console.error('📄 Dados da resposta:', error.response.data);
          console.error('🔍 Status code:', error.response.status);
          console.error('🧩 Headers:', JSON.stringify(error.response.headers, null, 2));
        } else if (error.request) {
          console.error('📡 Erro de comunicação - sem resposta do servidor');
        }
        
        // Mostrar mensagem amigável ao usuário
        Alert.alert(
          'Erro na Comunicação',
          'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      // Verificar resultado da operação
      if (resposta && resposta.success) {
        console.log('✅ Transação salva com sucesso!');
        Alert.alert(
          'Sucesso!', 
          `${tipoTransacao.charAt(0).toUpperCase() + tipoTransacao.slice(1)} adicionado(a) com sucesso!`
        );
        setModalVisible(false);
        // Limpar campos do formulário
        setValor('');
        setDescricao('');
        setCategoria('');
        setLocal('');
        setData(new Date().toISOString().split('T')[0]);
        setRecorrente(false);
        // Recarregar dados
        carregarDados();
      } else {
        const mensagemErro = resposta?.message || 'Ocorreu um erro desconhecido ao salvar.';
        console.error('❌ Erro ao salvar:', mensagemErro);
        Alert.alert('Erro', mensagemErro);
      }
    } catch (error) {
      console.error('❌ Erro geral ao salvar transação:', error);
      Alert.alert('Erro', 'Não foi possível salvar a transação. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Obter ícone de acordo com o tipo de transação
  const getIcone = (tipo) => {
    switch (tipo) {
      case 'despesa':
        return 'arrow-down';
      case 'ganho':
        return 'arrow-up';
      case 'salario':
        return 'cash';
      default:
        return 'help-circle';
    }
  };
  
  // Renderizar item da lista de transações
  const renderItem = ({ item }) => (
    <List.Item
      title={item.descricao || (item.tipo === 'salario' ? 'Salário' : 'Sem descrição')}
      description={`${item.categoria || 'Sem categoria'} • ${item.data || item.data_recebimento || 'Data não informada'}`}
      left={props => <List.Icon {...props} icon={getIcone(item.tipo)} />}
      right={props => (
        <Text style={[
          styles.valorTransacao,
          item.tipo === 'despesa' ? styles.despesa : styles.ganho
        ]}>
          {item.tipo === 'despesa' ? '-' : '+'} {formatarMoeda(item.valor)}
        </Text>
      )}
    />
  );
  
  // Renderiza o seletor de categorias
  const renderCategoriaPicker = () => {
    const categorias = getCategorias();
    
    if (Platform.OS === 'ios') {
      return (
        <>
          <Text style={styles.inputLabel}>Categoria</Text>
          <TouchableOpacity
            style={styles.pickerButtonIOS}
            onPress={() => {
              // Mostrar ActionSheet ou outra interface mais amigável para iOS
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  options: [...categorias, '+ Adicionar nova categoria', 'Cancelar'],
                  cancelButtonIndex: categorias.length + 1,
                },
                (buttonIndex) => {
                  if (buttonIndex === categorias.length) {
                    // Última opção antes do cancelar: Adicionar nova
                    setCategoriaModalVisible(true);
                  } else if (buttonIndex < categorias.length) {
                    // Selecionou uma categoria existente
                    setCategoria(categorias[buttonIndex]);
                  }
                }
              );
            }}
          >
            <Text style={categoria ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
              {categoria || 'Selecione uma categoria'}
            </Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </>
      );
    } else {
      // Para Android, mantemos o Picker nativo que funciona bem
      return (
        <>
          <Text style={styles.inputLabel}>Categoria</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={categoria}
              onValueChange={(itemValue) => {
                if (itemValue === 'ADICIONAR_NOVA') {
                  setCategoriaModalVisible(true);
                } else {
                  setCategoria(itemValue);
                }
              }}
              style={styles.picker}
            >
              <Picker.Item label="Selecione uma categoria" value="" />
              {categorias.map((cat, index) => (
                <Picker.Item key={index} label={cat} value={cat} />
              ))}
              <Picker.Item label="+ Adicionar nova categoria" value="ADICIONAR_NOVA" />
            </Picker>
          </View>
        </>
      );
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Cabeçalho com saldo */}
        <Card style={styles.cardSaldo}>
          <Card.Content>
            <Title>Olá, {user?.nome || 'Usuário'}</Title>
            <Paragraph>Seu saldo atual</Paragraph>
            <Title style={styles.saldo}>
              {resumo ? formatarMoeda(resumo.saldo) : 'Carregando...'}
            </Title>
            
            <View style={styles.resumoRow}>
              <View style={styles.resumoItem}>
                <Paragraph>Receitas</Paragraph>
                <Text style={styles.ganho}>
                  {resumo ? formatarMoeda(resumo.total_ganhos) : '-'}
                </Text>
              </View>
              
              <View style={styles.resumoItem}>
                <Paragraph>Despesas</Paragraph>
                <Text style={styles.despesa}>
                  {resumo ? formatarMoeda(resumo.total_despesas) : '-'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        {/* Botões de ação rápida */}
        <View style={styles.acoes}>
          <Button 
            mode="contained" 
            icon="cash-minus" 
            style={[styles.botaoAcao, styles.botaoDespesa]}
            onPress={() => abrirModal('despesa')}
          >
            Despesa
          </Button>
          
          <Button 
            mode="contained" 
            icon="cash-plus" 
            style={[styles.botaoAcao, styles.botaoGanho]}
            onPress={() => abrirModal('ganho')}
          >
            Ganho
          </Button>
          
          <Button 
            mode="contained" 
            icon="cash-multiple" 
            style={[styles.botaoAcao, styles.botaoSalario]}
            onPress={() => abrirModal('salario')}
          >
            Salário
          </Button>
        </View>
        
        {/* Lista de transações */}
        <Card style={styles.cardTransacoes}>
          <Card.Title title="Últimas Transações" />
          <Card.Content>
            {transacoes.length > 0 ? (
              <FlatList
                data={transacoes}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id || `transacao-${index}`}
                ItemSeparatorComponent={() => <Divider />}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.empty}>Nenhuma transação encontrada</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      
      {/* Modal para adicionar transação */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>
            {tipoTransacao === 'despesa' ? 'Nova Despesa' : 
             tipoTransacao === 'ganho' ? 'Novo Ganho' : 'Novo Salário'}
          </Title>
          
          <TextInput
            label="Valor"
            value={valor}
            onChangeText={setValor}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <TextInput
            label="Descrição"
            value={descricao}
            onChangeText={setDescricao}
            style={styles.input}
          />
          
          {/* Seletor de categorias */}
          {renderCategoriaPicker()}
          
          {tipoTransacao === 'despesa' && (
            <TextInput
              label="Local"
              value={local}
              onChangeText={setLocal}
              style={styles.input}
            />
          )}
          
          <TextInput
            label={tipoTransacao === 'salario' ? 'Data de Recebimento' : 'Data'}
            value={data}
            onChangeText={setData}
            style={styles.input}
          />
          
          <List.Item
            title="Recorrente"
            right={() => (
              <TouchableOpacity onPress={() => setRecorrente(!recorrente)}>
                <List.Icon icon={recorrente ? 'checkbox-marked' : 'checkbox-blank-outline'} />
              </TouchableOpacity>
            )}
          />
          
          <View style={styles.botoesModal}>
            <Button 
              mode="outlined" 
              onPress={() => setModalVisible(false)}
              style={styles.botaoModal}
            >
              Cancelar
            </Button>
            
            <Button 
              mode="contained" 
              onPress={salvarTransacao}
              style={styles.botaoModal}
              loading={loading}
              disabled={loading}
            >
              Salvar
            </Button>
          </View>
        </Modal>
        
        {/* Modal para adicionar nova categoria */}
        <Modal
          visible={categoriaModalVisible}
          onDismiss={() => setCategoriaModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Adicionar Nova Categoria</Title>
          
          <TextInput
            label="Nome da categoria"
            value={novaCategoria}
            onChangeText={setNovaCategoria}
            style={styles.input}
          />
          
          <View style={styles.botoesModal}>
            <Button 
              mode="outlined" 
              onPress={() => setCategoriaModalVisible(false)}
              style={styles.botaoModal}
            >
              Cancelar
            </Button>
            
            <Button 
              mode="contained" 
              onPress={adicionarNovaCategoria}
              style={styles.botaoModal}
            >
              Adicionar
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Botão de logout */}
      <FAB
        style={styles.fab}
        icon="logout"
        onPress={signOut}
        label="Sair"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  cardSaldo: {
    margin: 16,
    elevation: 4,
  },
  saldo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resumoItem: {
    alignItems: 'center',
    flex: 1,
  },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  botaoAcao: {
    flex: 1,
    marginHorizontal: 4,
  },
  botaoDespesa: {
    backgroundColor: '#F44336',
  },
  botaoGanho: {
    backgroundColor: '#4CAF50',
  },
  botaoSalario: {
    backgroundColor: '#2196F3',
  },
  cardTransacoes: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  despesa: {
    color: '#F44336',
  },
  ganho: {
    color: '#4CAF50',
  },
  valorTransacao: {
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  empty: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#757575',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF9800',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  input: {
    marginBottom: 12,
  },
  botoesModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  botaoModal: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 4,
    marginTop: 8,
  },
  picker: {
    height: 50,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pickerButtonIOS: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 4,
  },
  pickerTextSelected: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerTextPlaceholder: {
    fontSize: 16,
    color: '#757575',
  },
});

export default Home; 