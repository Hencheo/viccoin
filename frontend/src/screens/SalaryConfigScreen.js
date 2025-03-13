import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { financasService } from '../services/api';

const SalaryConfigScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Estados para configuração de salário
  const [salary, setSalary] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [salaryId, setSalaryId] = useState(null);
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);
  const [isSavingSalary, setIsSavingSalary] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Array com dias do mês para o picker
  const diasDoMes = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    // Carregar dados do salário apenas uma vez
    // e apenas se não tivermos já os dados E não estivermos carregando
    if (!salaryId && !isLoadingSalary) {
      // Usar um timeout para melhorar a experiência visual e reduzir chamadas
      const timer = setTimeout(() => {
        // Cada tela terá apenas uma chance de carregar os dados
        // para evitar chamadas repetidas
        if (!salaryId && !isLoadingSalary) {
          carregarDadosSalario();
        }
      }, 1000); // Aumentar o tempo para reduzir chances de múltiplas chamadas
      
      return () => {
        clearTimeout(timer); // Limpa o timer se o componente for desmontado
      };
    }
  }, []);

  // Função para carregar os dados do salário
  const carregarDadosSalario = async () => {
    // Se já estiver carregando ou já tivermos um ID, não faz nada
    if (isLoadingSalary || salaryId) {
      return;
    }
    
    try {
      setIsLoadingSalary(true);
      
      // Verificar se o método existe antes de chamar
      if (typeof financasService.obterSalario !== 'function') {
        // Se o método obterSalario não existir, tentar com listarTransacoes
        if (typeof financasService.listarTransacoes !== 'function') {
          setIsLoadingSalary(false);
          setConfigSaved(false);
          setEditMode(true);
          return;
        }
        
        // Buscar transações do tipo salário - usando como fallback
        const response = await financasService.listarTransacoes('salario', 1);
        
        // Verificar se há dados de salário
        if (response && response.success && response.transacoes && response.transacoes.length > 0) {
          const salarioAtual = response.transacoes[0];
          
          // Salvar o ID para futuras atualizações
          setSalaryId(salarioAtual.id);
          
          // Salvar o valor formatado como string
          setSalary(salarioAtual.valor ? salarioAtual.valor.toString() : '');
          
          // Converter a data de recebimento para um objeto Date
          if (salarioAtual.data_recebimento) {
            const parts = salarioAtual.data_recebimento.split('-');
            if (parts.length === 3) {
              // Se a data estiver no formato YYYY-MM-DD
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // Mês começa em 0 no JavaScript
              const day = parseInt(parts[2]);
              
              const novaData = new Date();
              novaData.setFullYear(year);
              novaData.setMonth(month);
              novaData.setDate(day);
              
              setPaymentDate(novaData);
            }
          } else if (salarioAtual.data) {
            // Tentar usar o campo 'data' se 'data_recebimento' não existir
            const parts = salarioAtual.data.split('-');
            if (parts.length === 3) {
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const day = parseInt(parts[2]);
              
              const novaData = new Date();
              novaData.setFullYear(year);
              novaData.setMonth(month);
              novaData.setDate(day);
              
              setPaymentDate(novaData);
            }
          }

          // Se encontrou dados de salário, significa que já existe configuração salva
          setConfigSaved(true);
          setEditMode(false);
        } else {
          setConfigSaved(false);
          setEditMode(true); // Modo de edição ativo por padrão para novos registros
        }
      } else {
        // Usar o método específico para obter salário
        const response = await financasService.obterSalario();
        
        if (response && response.success && response.salario) {
          const salarioAtual = response.salario;
          
          // Salvar o ID para futuras atualizações
          setSalaryId(salarioAtual.id);
          
          // Salvar o valor formatado como string
          setSalary(salarioAtual.valor ? salarioAtual.valor.toString() : '');
          
          // Converter a data de recebimento
          if (salarioAtual.data_recebimento) {
            const parts = salarioAtual.data_recebimento.split('-');
            if (parts.length === 3) {
              const year = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const day = parseInt(parts[2]);
              
              const novaData = new Date();
              novaData.setFullYear(year);
              novaData.setMonth(month);
              novaData.setDate(day);
              
              setPaymentDate(novaData);
            }
          }
          
          // Configuração salva
          setConfigSaved(true);
          setEditMode(false);
        } else {
          setConfigSaved(false);
          setEditMode(true);
        }
      }
    } catch (error) {
      // Silenciar erros para não interromper a experiência do usuário
      setConfigSaved(false);
      setEditMode(true);
    } finally {
      setIsLoadingSalary(false);
    }
  };

  // Função para salvar o salário
  const salvarSalario = async () => {
    try {
      setIsSavingSalary(true);
      console.log('🛑 Iniciando processo de salvar salário');
      
      // Validar dados
      if (!salary || isNaN(parseFloat(salary)) || parseFloat(salary) <= 0) {
        Alert.alert('Erro', 'Por favor, insira um valor válido para o salário.');
        setIsSavingSalary(false);
        return;
      }
      
      // Preparar dados para envio
      const dadosSalario = {
        valor: parseFloat(salary),
        data_recebimento: `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}`,
        categoria: '1', // Categoria padrão para salário 
        recorrente: true,
        periodo: 'mensal',
        descricao: 'Salário Mensal',
        tipo: 'salario', // Usar 'salario' em vez de 'configuracao_salario' para consistência
        data: new Date().toISOString().split('T')[0] // Data atual do registro
      };
      
      console.log('📦 Dados do salário a enviar:', JSON.stringify(dadosSalario, null, 2));
      
      // =====================================================
      // NOVA ABORDAGEM: Excluir salário anterior e criar novo
      // =====================================================
      
      console.log('🗑️ Tentando limpar qualquer configuração de salário anterior');
      let response;
      
      try {
        // Se temos um ID de salário, vamos registrar
        if (salaryId) {
          console.log(`🔑 ID do salário atual: ${salaryId} - Este será ignorado e criaremos um novo`);
        }
        
        // Buscar salários existentes 
        const buscaSalarios = await financasService.listarTransacoes('salario', 5);
        console.log('🔍 Verificando salários existentes:', 
          buscaSalarios.success ? 
            `Encontrados ${buscaSalarios.transacoes?.length || 0} salários` : 
            'Falha ao buscar');
        
        // Independente se temos um ID salvo ou não, vamos criar um novo
        console.log('➕ Criando novo registro de salário');
        response = await financasService.adicionarSalario(dadosSalario);
        console.log('✅ Resposta do servidor (criação):', JSON.stringify(response, null, 2));
        
        if (response && response.success && (response.salario_id || response.data?.id)) {
          // Armazenar o ID do salário para futura referência (não para update)
          const novoId = response.salario_id || response.data?.id || null;
          console.log('🔑 Novo ID de salário recebido:', novoId);
          setSalaryId(novoId);
          
          // Exibir sucesso
          Alert.alert('Sucesso', 'Novo salário configurado com sucesso!');
          console.log('✓ Novo salário salvo com sucesso');
          
          // Atualizar status na tela
          setConfigSaved(true);
          setEditMode(false);
          setIsDirty(false);
          
          // Verificar se o salário foi realmente salvo
          try {
            const verificacao = await financasService.listarTransacoes('salario', 1);
            console.log('🔍 Verificação após salvar:', 
              verificacao.transacoes?.length ? 'Salário encontrado' : 'Salário NÃO encontrado');
            if (verificacao.transacoes?.length) {
              console.log('📋 Dados do salário no Firebase:', JSON.stringify(verificacao.transacoes[0], null, 2));
            }
          } catch (verifyError) {
            console.log('⚠️ Erro ao verificar se o salário foi salvo:', verifyError.message);
          }
          
          // NOVO: Atualizar o resumo financeiro para refletir o novo saldo
          try {
            console.log('🔄 Atualizando resumo financeiro após adicionar salário');
            const resumoAtualizado = await financasService.obterResumoFinanceiro();
            if (resumoAtualizado && resumoAtualizado.success) {
              console.log('✅ Resumo financeiro atualizado após adicionar salário:', resumoAtualizado);
            } else {
              console.log('⚠️ Não foi possível atualizar o resumo financeiro');
            }
          } catch (resumoError) {
            console.error('❌ Erro ao atualizar resumo financeiro:', resumoError);
          }
          
          // Redirecionar para a tela inicial após sucesso
          setTimeout(() => {
            navigation.navigate('Home');
          }, 500);
        } else {
          const errorMsg = response?.message || 'Erro ao salvar configurações de salário.';
          console.error('❌ Erro ao salvar salário:', errorMsg);
          Alert.alert('Erro', errorMsg);
        }
      } catch (apiError) {
        console.error('❌ Erro na comunicação com servidor:', apiError.message);
        Alert.alert('Erro', `Falha na comunicação com o servidor: ${apiError.message}`);
      }
    } catch (error) {
      console.error('❌ Erro geral ao salvar salário:', error.message);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar as configurações de salário.');
    } finally {
      setIsSavingSalary(false);
    }
  };

  // Atualizar o setSalary para marcar o formulário como modificado
  const handleSalaryChange = (value) => {
    setSalary(value);
    if (!isDirty) setIsDirty(true);
  };

  // Atualizar o setPaymentDate para marcar o formulário como modificado
  const handleDateChange = (novaData) => {
    setPaymentDate(novaData);
    if (!isDirty) setIsDirty(true);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {configSaved ? 'Seu Salário' : 'Configurar Salário'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoadingSalary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A239FF" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              {configSaved && !editMode && (
                <View style={styles.savedIndicator}>
                  <Icon name="checkmark-circle" size={22} color="#4CAF50" />
                  <Text style={styles.savedText}>Salário configurado</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Valor do Salário</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefix}>R$</Text>
                  <TextInput
                    style={[
                      styles.input,
                      !editMode && styles.inputDisabled
                    ]}
                    value={salary}
                    onChangeText={handleSalaryChange}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor="#555"
                    editable={editMode}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Data de Pagamento</Text>
                <TouchableOpacity 
                  style={[
                    styles.datePickerButton,
                    !editMode && styles.datePickerButtonDisabled
                  ]}
                  onPress={() => editMode && setShowDatePicker(true)}
                  disabled={!editMode}
                >
                  <Text style={styles.datePickerText}>Dia {paymentDate.getDate()}</Text>
                  <Icon name="calendar-outline" size={22} color={editMode ? "#A239FF" : "#666"} />
                </TouchableOpacity>
              </View>
              
              {showDatePicker && (
                Platform.OS === 'ios' ? (
                  // Para iOS, usar um picker mais elegante
                  <View style={styles.dayPickerContainer}>
                    <View style={styles.dayPickerHeader}>
                      <Text style={styles.dayPickerTitle}>Selecione o dia do pagamento</Text>
                      <TouchableOpacity 
                        onPress={() => setShowDatePicker(false)}
                        style={styles.dayPickerCloseBtn}
                      >
                        <Text style={styles.dayPickerConfirmText}>Confirmar</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dayPickerContent}
                    >
                      {diasDoMes.map((dia) => (
                        <TouchableOpacity
                          key={`dia-${dia}`}
                          style={[
                            styles.dayPickerItem,
                            paymentDate.getDate() === dia && styles.dayPickerItemSelected
                          ]}
                          onPress={() => {
                            const novaData = new Date(paymentDate);
                            novaData.setDate(dia);
                            handleDateChange(novaData);
                          }}
                        >
                          <Text style={[
                            styles.dayPickerItemText,
                            paymentDate.getDate() === dia && styles.dayPickerItemTextSelected
                          ]}>
                            {dia}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  // Para Android, configurar o DateTimePicker para mostrar apenas dias
                  <DateTimePicker
                    value={paymentDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate && event.type !== 'dismissed') {
                        // Manter apenas o dia, preservando mês e ano atuais
                        const diaEscolhido = selectedDate.getDate();
                        const dataAtual = new Date(paymentDate);
                        dataAtual.setDate(diaEscolhido);
                        handleDateChange(dataAtual);
                      }
                    }}
                  />
                )
              )}

              <View style={styles.infoContainer}>
                <Icon name="information-circle-outline" size={20} color="#AAA" />
                <Text style={styles.infoText}>
                  Defina o dia do mês em que você recebe seu salário. Esta informação será usada para cálculos de orçamento e planejamento financeiro.
                </Text>
              </View>
            </View>

            {/* Botão de edição e salvar */}
            {configSaved && !editMode ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditMode(true)}
              >
                <Icon name="create-outline" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Editar Configurações</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.saveButton, 
                  isSavingSalary && styles.disabledButton,
                  !isDirty && configSaved && styles.disabledButton
                ]}
                onPress={salvarSalario}
                disabled={isSavingSalary || (!isDirty && configSaved)}
              >
                {isSavingSalary ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="save-outline" size={20} color="white" style={styles.buttonIcon} />
                    <Text style={styles.saveButtonText}>
                      {!isDirty && configSaved ? 'Nenhuma alteração' : 'Salvar Configurações'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {/* Botão para cancelar edição */}
            {configSaved && editMode && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditMode(false);
                  setIsDirty(false);
                  carregarDadosSalario(); // Recarregar os dados originais
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar Edição</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F23',
    backgroundColor: '#1A1A1C',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2C',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1F1F23',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#AAAAAA',
    marginTop: 16,
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#AAAAAA',
    fontSize: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inputPrefix: {
    color: '#A239FF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dayPickerContainer: {
    backgroundColor: '#2A2A2C',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayPickerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayPickerCloseBtn: {
    padding: 8,
  },
  dayPickerConfirmText: {
    color: '#A239FF',
    fontWeight: 'bold',
  },
  dayPickerContent: {
    paddingVertical: 8,
  },
  dayPickerItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  dayPickerItemSelected: {
    backgroundColor: '#A239FF',
  },
  dayPickerItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dayPickerItemTextSelected: {
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#A239FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2C',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    color: '#AAAAAA',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  savedText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  datePickerButtonDisabled: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: '#A239FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#2A2A2C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#AAAAAA',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default SalaryConfigScreen; 