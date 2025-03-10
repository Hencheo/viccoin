import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Checkbox, RadioButton } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';
import { API_URL } from '../config';

const AddExpenseScreen = ({ navigation }) => {
  // Estados para os campos do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsTotal, setInstallmentsTotal] = useState('1');
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [tags, setTags] = useState('');
  
  // Estados para a UX
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Buscar categorias ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, []);

  // Função para buscar categorias do backend
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = await AsyncStorage.getItem('jwt_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (!token) {
        console.warn('Token não encontrado. Faça login novamente.');
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou ou você não está autenticado. Por favor, faça login novamente.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        setLoadingCategories(false);
        return;
      }
      
      console.log('Buscando categorias com token Firebase');
      console.log('User ID:', userId);
      
      // Usar o token do Firebase para autenticação direta no Firestore
      try {
        // URL Firebase para Firestore - formato REST API
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/viccoin-app/databases/(default)/documents/categorias?key=AIzaSyBVpAK1Aw1S33TpUTjxnxwVJXI1knhrZ4A`;
        
        console.log('Tentando acessar Firestore diretamente...');
        
        const firestoreResponse = await fetch(firestoreUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Status da resposta Firestore:', firestoreResponse.status);
        
        if (firestoreResponse.ok) {
          const data = await firestoreResponse.json();
          console.log('Dados do Firestore (resumo):', JSON.stringify(data).substring(0, 300));
          
          // Extrair categorias do formato do Firestore REST API
          if (data && data.documents && Array.isArray(data.documents)) {
            const categorias = data.documents.map(doc => {
              const nome = doc.fields?.nome?.stringValue || doc.name.split('/').pop();
              return {
                id: doc.name.split('/').pop(),
                nome: nome
              };
            });
            
            console.log(`Encontradas ${categorias.length} categorias no Firestore`);
            setCategories(categorias);
            setLoadingCategories(false);
            return;
          }
        } else {
          // Ler o erro
          try {
            const errorText = await firestoreResponse.text();
            console.warn('Erro do Firestore:', errorText);
          } catch (e) {
            console.warn('Erro do Firestore (status):', firestoreResponse.status);
          }
        }
      } catch (firestoreError) {
        console.warn('Erro ao acessar Firestore:', firestoreError.message);
      }
      
      // Se chegamos aqui, vamos tentar a API backend
      try {
        console.log('Tentando API backend...');
        
        const backendResponse = await fetch(`${API_URL}/api/categorias`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Status da resposta backend:', backendResponse.status);
        
        if (backendResponse.ok) {
          const data = await backendResponse.json();
          console.log('Dados do backend:', JSON.stringify(data).substring(0, 300));
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Encontradas ${data.length} categorias no backend`);
            setCategories(data);
            setLoadingCategories(false);
            return;
          }
        }
      } catch (backendError) {
        console.warn('Erro ao acessar backend:', backendError.message);
      }
      
      // Se chegamos aqui, todas as tentativas falharam
      console.warn('Não foi possível obter categorias de nenhuma fonte');
      
      // Mostrar um alerta ao usuário
      Alert.alert(
        'Problema de Conexão',
        'Não foi possível carregar as categorias. Deseja tentar novamente?',
        [
          {
            text: 'Sim',
            onPress: () => fetchCategories()
          },
          {
            text: 'Continuar sem categorias',
            style: 'cancel',
            onPress: () => setCategories([])
          }
        ]
      );
    } catch (error) {
      console.error('Erro geral ao buscar categorias:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Função para formatar valor com 2 casas decimais
  const formatCurrency = (value) => {
    value = value.replace(/\D/g, '');
    value = (parseInt(value, 10) / 100).toFixed(2);
    value = value.replace('.', ',');
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${value}`;
  };

  // Função para lidar com mudança de valor
  const handleAmountChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue) {
      setAmount(formatCurrency(numericValue));
    } else {
      setAmount('');
    }
  };

  // Função para lidar com mudança de data
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Função para lidar com mudança de categoria
  const handleCategoryChange = (categoryId, index) => {
    setCategoryId(categoryId);
    
    // Encontrar a categoria selecionada pelo ID em vez de usar o índice
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (selectedCategory) {
      setCategoryName(selectedCategory.nome);
    }
  };

  // Função para enviar a despesa
  const handleSubmit = async () => {
    // Validações
    if (!description.trim()) {
      Alert.alert('Erro', 'A descrição é obrigatória.');
      return;
    }
    
    if (!amount || amount === 'R$ 0,00') {
      Alert.alert('Erro', 'Informe um valor válido.');
      return;
    }
    
    if (!categoryId) {
      Alert.alert('Erro', 'Selecione uma categoria.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt_token');
      
      // Preparar os dados da despesa
      const numericAmount = parseFloat(amount.replace('R$ ', '').replace('.', '').replace(',', '.'));
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const expenseData = {
        descricao: description,
        valor: numericAmount,
        data: date.toISOString(),
        categoria_id: categoryId,
        categoria_nome: categoryName,
        metodo_pagamento: paymentMethod,
        observacoes: notes,
        tags: tagsArray,
        recorrente: isRecurrent,
        parcelado: isInstallment,
        numero_parcelas: isInstallment ? parseInt(installmentsTotal, 10) : 1,
        parcela_atual: isInstallment ? parseInt(currentInstallment, 10) : 1
      };
      
      // Enviar dados para o backend
      const response = await fetch(`${API_URL}/api/despesas/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao registrar a despesa');
      }
      
      Alert.alert('Sucesso', 'Despesa registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao registrar despesa:', error);
      Alert.alert('Erro', error.message || 'Não foi possível registrar a despesa. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para testar a API diretamente
  const testAPIDirectly = async () => {
    try {
      // Pegar o token e user_id
      const token = await AsyncStorage.getItem('jwt_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      console.log('==== TESTE DIRETO DE API ====');
      console.log('Token armazenado:', token);
      console.log('User ID armazenado:', userId);
      
      // Testar endpoint raiz
      console.log('\nTentando acessar a raiz da API:');
      try {
        const rootResponse = await fetch(`${API_URL}/api/`);
        console.log('Status da raiz:', rootResponse.status);
        
        if (rootResponse.ok) {
          const rootText = await rootResponse.text();
          console.log('Resposta da raiz:', rootText);
        } else {
          console.log('Erro ao acessar raiz');
        }
      } catch (rootError) {
        console.log('Exceção ao acessar raiz:', rootError.message);
      }
      
      // Testar vários formatos de autenticação para o endpoint de categorias
      const endpoint = `${API_URL}/api/categorias/`;
      
      const authHeaders = [
        { name: 'Sem autenticação', headers: {} },
        { name: 'Bearer', headers: { 'Authorization': `Bearer ${token}` } },
        { name: 'Token', headers: { 'Authorization': `Token ${token}` } },
        { name: 'JWT', headers: { 'Authorization': `JWT ${token}` } },
        { name: 'Simples', headers: { 'Authorization': token } }
      ];
      
      for (const auth of authHeaders) {
        console.log(`\nTestando formato "${auth.name}":`);
        
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...auth.headers
            }
          });
          
          console.log('Status:', response.status);
          
          // Tentar ler a resposta
          try {
            const text = await response.text();
            console.log('Resposta:', text);
            
            if (response.ok) {
              Alert.alert(
                'Sucesso!',
                `O formato "${auth.name}" funcionou!\nLeia o console para mais detalhes.`
              );
              return;
            }
          } catch (textError) {
            console.log('Erro ao ler texto:', textError.message);
          }
        } catch (fetchError) {
          console.log('Erro ao tentar fetch:', fetchError.message);
        }
      }
      
      Alert.alert(
        'Teste Concluído',
        'Nenhum formato de autenticação funcionou. Verifique o console para detalhes.'
      );
    } catch (error) {
      console.log('Erro geral no teste:', error.message);
      Alert.alert('Erro', 'Ocorreu um erro durante o teste. Verifique o console.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adicionar Despesa</Text>
      </View>

      {/* Botão de diagnóstico */}
      <TouchableOpacity 
        style={styles.diagButton}
        onPress={testAPIDirectly}
      >
        <Text style={styles.diagButtonText}>Diagnóstico da API</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        {/* Descrição */}
        <TextInput
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          outlineColor={theme.colors.border.medium}
          activeOutlineColor={theme.colors.accent.main}
          theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
        />

        {/* Valor */}
        <TextInput
          label="Valor (R$)"
          value={amount}
          onChangeText={handleAmountChange}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
          outlineColor={theme.colors.border.medium}
          activeOutlineColor={theme.colors.accent.main}
          left={<TextInput.Affix text="R$" />}
          theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
        />

        {/* Data */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            label="Data"
            value={date.toLocaleDateString('pt-BR')}
            style={styles.input}
            mode="outlined"
            outlineColor={theme.colors.border.medium}
            activeOutlineColor={theme.colors.accent.main}
            editable={false}
            right={<TextInput.Icon icon="calendar" color={theme.colors.text.secondary} />}
            theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Categoria */}
        <View style={[styles.pickerContainer, { borderColor: theme.colors.border.medium }]}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>Categoria</Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={theme.colors.accent.main} />
          ) : categories.length > 0 ? (
            <Picker
              selectedValue={categoryId}
              onValueChange={(itemValue, itemIndex) => handleCategoryChange(itemValue, itemIndex)}
              style={styles.picker}
              dropdownIconColor={theme.colors.text.primary}
              itemStyle={{ color: theme.colors.text.primary }}
            >
              <Picker.Item label="Selecione uma categoria" value="" color={theme.colors.text.secondary} />
              {categories.map((category) => (
                <Picker.Item 
                  key={category.id} 
                  label={category.nome} 
                  value={category.id} 
                  color={theme.colors.text.primary} 
                />
              ))}
            </Picker>
          ) : (
            <Text style={{ color: theme.colors.text.secondary, padding: 10 }}>
              Nenhuma categoria disponível
            </Text>
          )}
        </View>

        {/* Método de Pagamento */}
        <View style={[styles.pickerContainer, { borderColor: theme.colors.border.medium }]}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>Método de Pagamento</Text>
          <Picker
            selectedValue={paymentMethod}
            onValueChange={(itemValue) => setPaymentMethod(itemValue)}
            style={styles.picker}
            dropdownIconColor={theme.colors.text.primary}
            itemStyle={{ color: theme.colors.text.primary }}
          >
            <Picker.Item label="Selecione um método" value="" color={theme.colors.text.secondary} />
            <Picker.Item label="Dinheiro" value="dinheiro" color={theme.colors.text.primary} />
            <Picker.Item label="Cartão de Crédito" value="cartão de crédito" color={theme.colors.text.primary} />
            <Picker.Item label="Cartão de Débito" value="cartão de débito" color={theme.colors.text.primary} />
            <Picker.Item label="Pix" value="pix" color={theme.colors.text.primary} />
            <Picker.Item label="Transferência" value="transferência" color={theme.colors.text.primary} />
            <Picker.Item label="Boleto" value="boleto" color={theme.colors.text.primary} />
          </Picker>
        </View>

        {/* Observações */}
        <TextInput
          label="Observações"
          value={notes}
          onChangeText={setNotes}
          style={styles.input}
          mode="outlined"
          outlineColor={theme.colors.border.medium}
          activeOutlineColor={theme.colors.accent.main}
          multiline
          numberOfLines={3}
          theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
        />

        {/* Tags */}
        <TextInput
          label="Tags (separadas por vírgula)"
          value={tags}
          onChangeText={setTags}
          style={styles.input}
          mode="outlined"
          outlineColor={theme.colors.border.medium}
          activeOutlineColor={theme.colors.accent.main}
          placeholder="exemplo: casa, aluguel, fixo"
          theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
        />

        {/* Opções Avançadas */}
        <View style={styles.checkboxContainer}>
          <View style={styles.checkboxRow}>
            <Checkbox
              status={isRecurrent ? 'checked' : 'unchecked'}
              onPress={() => setIsRecurrent(!isRecurrent)}
              color={theme.colors.accent.main}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.text.primary }]}>Despesa Recorrente</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <Checkbox
              status={isInstallment ? 'checked' : 'unchecked'}
              onPress={() => setIsInstallment(!isInstallment)}
              color={theme.colors.accent.main}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.text.primary }]}>Pagamento Parcelado</Text>
          </View>
        </View>

        {/* Campos de Parcelamento */}
        {isInstallment && (
          <View style={styles.installmentContainer}>
            <TextInput
              label="Total de Parcelas"
              value={installmentsTotal}
              onChangeText={setInstallmentsTotal}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              keyboardType="numeric"
              outlineColor={theme.colors.border.medium}
              activeOutlineColor={theme.colors.accent.main}
              theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
            />
            
            <TextInput
              label="Parcela Atual"
              value={currentInstallment}
              onChangeText={setCurrentInstallment}
              style={[styles.input, styles.halfInput]}
              mode="outlined"
              keyboardType="numeric"
              outlineColor={theme.colors.border.medium}
              activeOutlineColor={theme.colors.accent.main}
              theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
            />
          </View>
        )}

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            labelStyle={[styles.buttonLabel, { color: theme.colors.accent.main }]}
            color={theme.colors.accent.main}
          >
            Cancelar
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[styles.button, { backgroundColor: theme.colors.accent.main }]}
            labelStyle={[styles.buttonLabel, { color: theme.colors.accent.contrast }]}
            loading={loading}
            disabled={loading}
          >
            Salvar
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: theme.colors.accent.main,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.accent.contrast,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 50, // Mais espaço na parte inferior
  },
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.background.secondary,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: theme.borderRadius.small,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 70, // Altura mínima para comportar as opções
  },
  pickerLabel: {
    fontSize: 12,
    marginLeft: 8,
    marginTop: 4,
  },
  picker: {
    height: 48,
    width: '100%',
    color: theme.colors.text.primary,
  },
  checkboxContainer: {
    marginVertical: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8, // Aumentado para mais espaço
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  installmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30, // Mais espaço na parte inferior
  },
  button: {
    width: '48%',
    paddingVertical: 10, // Botões mais altos para melhor usabilidade
    borderRadius: theme.borderRadius.medium,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  diagButton: {
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 16,
  },
  diagButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddExpenseScreen; 