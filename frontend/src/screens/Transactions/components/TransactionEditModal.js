import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

// Componentes
import CategorySelector from './CategorySelector';

// Cores para tema escuro
const COLORS = {
  background: '#121212',
  card: '#1E1E1E',
  input: '#2C2C2C',
  text: '#FFFFFF',
  placeholder: '#888888',
  primary: '#A239FF',
  danger: '#FF5252',
  success: '#4CAF50',
};

function TransactionEditModal({ visible, transaction, onClose, onSave }) {
  // Estado para os campos do formulário
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  
  // Obtém categorias disponíveis do Redux
  const categorias = useSelector(state => state.categorias?.lista || []);
  
  // Efeito para preencher o formulário quando uma transação é selecionada para edição
  useEffect(() => {
    if (transaction) {
      setCategoria(transaction.categoria || '');
      setDescricao(transaction.descricao || '');
      setValor(transaction.valor?.toString() || '');
      
      // Formatar data para o componente se necessário
      if (transaction.data) {
        const date = new Date(transaction.data);
        setData(date.toISOString().split('T')[0]);
      } else {
        setData('');
      }
    }
  }, [transaction]);
  
  // Handler para salvar a transação
  const handleSave = () => {
    // Validação básica
    if (!categoria) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }
    
    if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
      Alert.alert('Erro', 'Informe um valor válido');
      return;
    }
    
    // Preparar dados para salvar
    const updatedTransaction = {
      ...transaction,
      categoria,
      descricao,
      valor: parseFloat(valor),
      data: data ? new Date(data).toISOString() : new Date().toISOString(),
    };
    
    // Chamar função de salvar do componente pai
    onSave(updatedTransaction);
  };
  
  // Formatar valor como moeda durante digitação
  const handleValorChange = (text) => {
    // Remover caracteres não numéricos, exceto ponto decimal
    const numericValue = text.replace(/[^0-9.]/g, '');
    setValor(numericValue);
  };
  
  // Renderizar cabeçalho
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Icon name="close" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {transaction?.tipo === 'despesa' 
          ? 'Editar Despesa' 
          : transaction?.tipo === 'ganho' 
            ? 'Editar Ganho' 
            : 'Editar Transação'}
      </Text>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Salvar</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Determinar cor do tipo de transação
  const getTypeColor = () => {
    if (transaction?.tipo === 'despesa') return COLORS.danger;
    if (transaction?.tipo === 'ganho') return COLORS.success;
    return COLORS.primary;
  };
  
  // Renderizar seletor de categoria
  const renderCategorySelector = () => (
    <TouchableOpacity 
      style={styles.categorySelector}
      onPress={() => setShowCategorySelector(true)}
    >
      <Text style={styles.inputLabel}>Categoria</Text>
      <View style={styles.categoryDisplay}>
        <Text style={[
          styles.categoryText,
          !categoria && { color: COLORS.placeholder }
        ]}>
          {categoria || 'Selecione uma categoria'}
        </Text>
        <Icon name="chevron-down" size={18} color={COLORS.text} />
      </View>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {renderHeader()}
        
        <ScrollView style={styles.contentContainer}>
          {/* Tipo de transação */}
          <View style={[
            styles.typeContainer, 
            { borderColor: getTypeColor() }
          ]}>
            <Icon 
              name={transaction?.tipo === 'despesa' 
                ? 'arrow-down' 
                : 'arrow-up'} 
              size={20} 
              color={getTypeColor()} 
            />
            <Text style={[styles.typeText, { color: getTypeColor() }]}>
              {transaction?.tipo === 'despesa' 
                ? 'Despesa' 
                : transaction?.tipo === 'ganho' 
                  ? 'Ganho' 
                  : 'Transação'}
            </Text>
          </View>
          
          {/* Categoria */}
          {renderCategorySelector()}
          
          {/* Descrição */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva sua transação"
              placeholderTextColor={COLORS.placeholder}
              multiline={true}
              numberOfLines={2}
            />
          </View>
          
          {/* Valor */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Valor</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.currencyInput}
                value={valor}
                onChangeText={handleValorChange}
                placeholder="0,00"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          
          {/* Data */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Data</Text>
            <TextInput
              style={styles.input}
              value={data}
              onChangeText={setData}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
        </ScrollView>
        
        {/* Modal para seleção de categoria */}
        <CategorySelector
          visible={showCategorySelector}
          onClose={() => setShowCategorySelector(false)}
          categories={categorias.filter(cat => cat.tipo === transaction?.tipo)}
          selectedCategory={categoria}
          transaction={transaction}
          onSelectCategory={(cat) => {
            setCategoria(cat);
            setShowCategorySelector(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 16,
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryDisplay: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 16,
  },
  currencyInputContainer: {
    backgroundColor: COLORS.input,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    color: COLORS.text,
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  currencyInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TransactionEditModal; 