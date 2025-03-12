import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Cores para tema escuro
const COLORS = {
  background: '#121212',
  card: '#1E1E1E',
  input: '#2C2C2C',
  text: '#FFFFFF',
  placeholder: '#888888',
  primary: '#A239FF',
};

function CategorySelector({ visible, categories, selectedCategory, onSelectCategory, onClose, transaction }) {
  // Renderizar cabeçalho
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Icon name="close" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Selecionar Categoria</Text>
      <View style={{ width: 40 }} />
    </View>
  );
  
  // Renderizar item de categoria
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.categoryItem,
        selectedCategory === item.nome && styles.selectedCategoryItem
      ]}
      onPress={() => onSelectCategory(item.nome)}
    >
      <View style={[
        styles.categoryIcon, 
        { backgroundColor: item.cor || '#555555' }
      ]}>
        <Icon 
          name={item.icone || 'grid-outline'} 
          size={18} 
          color={COLORS.text} 
        />
      </View>
      <Text style={styles.categoryName}>{item.nome}</Text>
      {selectedCategory === item.nome && (
        <Icon name="checkmark-circle" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
  
  // Se não houver categorias, mostrar mensagem
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-open-outline" size={60} color="#444" />
      <Text style={styles.emptyText}>
        Nenhuma categoria disponível
      </Text>
      <Text style={styles.emptySubText}>
        As categorias são criadas automaticamente quando você adiciona transações
      </Text>
    </View>
  );
  
  // Dados de exemplo caso não haja categorias (para desenvolvimento)
  const getCategoriesList = useCallback(() => {
    // Se temos categorias do backend, usá-las
    if (categories && categories.length > 0) {
      return categories;
    }

    // Caso contrário, retornar categorias de exemplo com base no tipo da transação
    const transactionType = transaction?.tipo || 'despesa';
    
    // Filtrar apenas categorias relevantes para o tipo da transação
    return [
      { id: 1, nome: 'Alimentação', icone: 'restaurant-outline', cor: '#4CAF50', tipo: 'despesa' },
      { id: 2, nome: 'Transporte', icone: 'car-outline', cor: '#2196F3', tipo: 'despesa' },
      { id: 3, nome: 'Lazer', icone: 'game-controller-outline', cor: '#9C27B0', tipo: 'despesa' },
      { id: 4, nome: 'Salário', icone: 'cash-outline', cor: '#4CAF50', tipo: 'ganho' },
      { id: 5, nome: 'Freelance', icone: 'laptop-outline', cor: '#FF9800', tipo: 'ganho' }
    ].filter(cat => transactionType === 'all' || cat.tipo === transactionType);
  }, [categories, transaction]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        {renderHeader()}
        
        <FlatList
          data={getCategoriesList()}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
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
  listContent: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedCategoryItem: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: COLORS.placeholder,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default CategorySelector; 