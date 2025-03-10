import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Checkbox } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';
import { API_URL } from '../config';

const AddIncomeScreen = ({ navigation }) => {
  // Estados para os campos do formulário
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [frequency, setFrequency] = useState('');
  const [nextDate, setNextDate] = useState(new Date());
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  
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
      
      console.log('Buscando categorias para usuário:', userId);
      
      // Usar apenas o endpoint oficial fornecido pela API
      const endpoint = `${API_URL}/api/categorias/`;
      
      try {
        // Testar três formatos diferentes do parâmetro de usuário
        const formatos = [
          `${endpoint}?user_id=${userId}`,
          `${endpoint}?userId=${userId}`,
          `${endpoint}` // Sem parâmetro (talvez a API use apenas o token)
        ];
        
        let success = false;
        
        for (const url of formatos) {
          console.log(`Tentando: ${url}`);
          
          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            console.log(`Status da resposta (${url}):`, response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`Dados recebidos (${url}):`, JSON.stringify(data).substring(0, 100) + '...');
              
              if (Array.isArray(data) && data.length > 0) {
                console.log(`Encontradas ${data.length} categorias`);
                
                // Filtrar para categorias de receita
                const incomeCategories = data.filter(cat => 
                  cat && cat.nome && (
                    cat.nome.toLowerCase().includes('receita') || 
                    cat.nome.toLowerCase().includes('renda') ||
                    cat.nome.toLowerCase().includes('salário') ||
                    cat.nome.toLowerCase().includes('entrada') ||
                    cat.nome.toLowerCase().includes('investimento')
                  )
                );
                
                if (incomeCategories.length > 0) {
                  console.log(`Filtradas ${incomeCategories.length} categorias de receita`);
                  setCategories(incomeCategories);
                } else {
                  console.log('Nenhuma categoria específica de receita encontrada, usando todas');
                  setCategories(data);
                }
                
                success = true;
                break;
              }
            } else {
              // Tentar ler a mensagem de erro
              try {
                const errorText = await response.text();
                console.warn(`Erro (${response.status}):`, errorText);
              } catch (e) {
                console.warn(`Erro ${response.status} ao acessar ${url}`);
              }
            }
          } catch (urlError) {
            console.warn(`Erro ao acessar ${url}:`, urlError.message);
          }
        }
        
        // Se nenhum formato funcionou
        if (!success) {
          console.warn('Nenhum formato de URL funcionou para categorias. Usando dados padrão.');
          const defaultCategories = [
            { id: 'salario', nome: 'Salário' },
            { id: 'freelance', nome: 'Freelance' },
            { id: 'investimentos', nome: 'Investimentos' },
            { id: 'presente', nome: 'Presente' },
            { id: 'reembolso', nome: 'Reembolso' },
            { id: 'vendas', nome: 'Vendas' },
            { id: 'aluguel', nome: 'Aluguel' },
            { id: 'outras_receitas', nome: 'Outras Receitas' }
          ];
          
          setCategories(defaultCategories);
        }
      } catch (endpointError) {
        console.warn(`Erro geral ao acessar o endpoint:`, endpointError.message);
        // Usar categorias padrão como fallback
        const defaultCategories = [
          { id: 'salario', nome: 'Salário' },
          { id: 'freelance', nome: 'Freelance' },
          { id: 'investimentos', nome: 'Investimentos' },
          { id: 'presente', nome: 'Presente' },
          { id: 'reembolso', nome: 'Reembolso' },
          { id: 'vendas', nome: 'Vendas' },
          { id: 'aluguel', nome: 'Aluguel' },
          { id: 'outras_receitas', nome: 'Outras Receitas' }
        ];
        
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      
      // Usar categorias padrão como fallback
      const defaultCategories = [
        { id: 'salario', nome: 'Salário' },
        { id: 'freelance', nome: 'Freelance' },
        { id: 'investimentos', nome: 'Investimentos' },
        { id: 'presente', nome: 'Presente' },
        { id: 'reembolso', nome: 'Reembolso' },
        { id: 'vendas', nome: 'Vendas' },
        { id: 'aluguel', nome: 'Aluguel' },
        { id: 'outras_receitas', nome: 'Outras Receitas' }
      ];
      
      setCategories(defaultCategories);
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

  // Função para lidar com mudança da próxima data (para receitas recorrentes)
  const handleNextDateChange = (event, selectedDate) => {
    setShowNextDatePicker(false);
    if (selectedDate) {
      setNextDate(selectedDate);
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

  // Função para enviar a receita
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
    
    if (!type) {
      Alert.alert('Erro', 'Selecione um tipo de receita.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt_token');
      
      // Preparar os dados da receita
      const numericAmount = parseFloat(amount.replace('R$ ', '').replace('.', '').replace(',', '.'));
      
      const incomeData = {
        descricao: description,
        valor: numericAmount,
        data: date.toISOString(),
        tipo: type,
        categoria_id: categoryId,
        categoria_nome: categoryName,
        recorrente: isRecurrent,
        frequencia: isRecurrent ? frequency : '',
        data_proxima: isRecurrent ? nextDate.toISOString() : null
      };
      
      // Enviar dados para o backend
      const response = await fetch(`${API_URL}/api/receitas/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao registrar a receita');
      }
      
      Alert.alert('Sucesso', 'Receita registrada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao registrar receita:', error);
      Alert.alert('Erro', error.message || 'Não foi possível registrar a receita. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adicionar Receita</Text>
      </View>

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
            label="Data do Recebimento"
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

        {/* Tipo de Receita */}
        <View style={[styles.pickerContainer, { borderColor: theme.colors.border.medium }]}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>Tipo de Receita</Text>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={styles.picker}
            dropdownIconColor={theme.colors.text.primary}
            itemStyle={{ color: theme.colors.text.primary }}
          >
            <Picker.Item label="Selecione um tipo" value="" color={theme.colors.text.secondary} />
            <Picker.Item label="Salário" value="salario" color={theme.colors.text.primary} />
            <Picker.Item label="Freelancer" value="freelancer" color={theme.colors.text.primary} />
            <Picker.Item label="Investimento" value="investimento" color={theme.colors.text.primary} />
            <Picker.Item label="Presente" value="presente" color={theme.colors.text.primary} />
            <Picker.Item label="Venda" value="venda" color={theme.colors.text.primary} />
            <Picker.Item label="Reembolso" value="reembolso" color={theme.colors.text.primary} />
            <Picker.Item label="Outros" value="outros" color={theme.colors.text.primary} />
          </Picker>
        </View>

        {/* Categoria */}
        <View style={[styles.pickerContainer, { borderColor: theme.colors.border.medium }]}>
          <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>Categoria (opcional)</Text>
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

        {/* Opção de Recorrência */}
        <View style={styles.checkboxContainer}>
          <View style={styles.checkboxRow}>
            <Checkbox
              status={isRecurrent ? 'checked' : 'unchecked'}
              onPress={() => setIsRecurrent(!isRecurrent)}
              color={theme.colors.accent.main}
            />
            <Text style={[styles.checkboxLabel, { color: theme.colors.text.primary }]}>Receita Recorrente</Text>
          </View>
        </View>

        {/* Campos de Recorrência */}
        {isRecurrent && (
          <View style={styles.recurrentContainer}>
            {/* Frequência */}
            <View style={[styles.pickerContainer, { borderColor: theme.colors.border.medium }]}>
              <Text style={[styles.pickerLabel, { color: theme.colors.text.secondary }]}>Frequência</Text>
              <Picker
                selectedValue={frequency}
                onValueChange={(itemValue) => setFrequency(itemValue)}
                style={styles.picker}
                dropdownIconColor={theme.colors.text.primary}
                itemStyle={{ color: theme.colors.text.primary }}
              >
                <Picker.Item label="Selecione uma frequência" value="" color={theme.colors.text.secondary} />
                <Picker.Item label="Diária" value="diaria" color={theme.colors.text.primary} />
                <Picker.Item label="Semanal" value="semanal" color={theme.colors.text.primary} />
                <Picker.Item label="Quinzenal" value="quinzenal" color={theme.colors.text.primary} />
                <Picker.Item label="Mensal" value="mensal" color={theme.colors.text.primary} />
                <Picker.Item label="Bimestral" value="bimestral" color={theme.colors.text.primary} />
                <Picker.Item label="Trimestral" value="trimestral" color={theme.colors.text.primary} />
                <Picker.Item label="Semestral" value="semestral" color={theme.colors.text.primary} />
                <Picker.Item label="Anual" value="anual" color={theme.colors.text.primary} />
              </Picker>
            </View>

            {/* Próxima Data */}
            <TouchableOpacity onPress={() => setShowNextDatePicker(true)}>
              <TextInput
                label="Próxima Data Esperada"
                value={nextDate.toLocaleDateString('pt-BR')}
                style={styles.input}
                mode="outlined"
                outlineColor={theme.colors.border.medium}
                activeOutlineColor={theme.colors.accent.main}
                editable={false}
                right={<TextInput.Icon icon="calendar" color={theme.colors.text.secondary} />}
                theme={{ colors: { text: theme.colors.text.primary, placeholder: theme.colors.text.secondary } }}
              />
            </TouchableOpacity>
            {showNextDatePicker && (
              <DateTimePicker
                value={nextDate}
                mode="date"
                display="default"
                onChange={handleNextDateChange}
              />
            )}
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
  recurrentContainer: {
    marginTop: 8,
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
});

export default AddIncomeScreen; 