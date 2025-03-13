import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  Switch,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import AppBottomBar, { handleScroll } from '../components/AppBottomBar';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';
import api, { financasService } from '../services/api';

const ConfigScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentSection, setCurrentSection] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Estado para as configurações
  const [salary, setSalary] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [categoryType, setCategoryType] = useState('despesa');
  const [selectedIcon, setSelectedIcon] = useState('help-circle-outline');
  const [fontSize, setFontSize] = useState(16);
  const [activeTheme, setActiveTheme] = useState('dark');
  
  // Estado para o salário
  const [salaryId, setSalaryId] = useState(null);
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);
  const [isSavingSalary, setIsSavingSalary] = useState(false);
  
  // Animações
  const animatedOpacity = new Animated.Value(0);
  
  useEffect(() => {
    // Animação de entrada da tela
    Animated.timing(animatedOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    // Monitorar o teclado
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Carregar dados do salário apenas uma vez ao montar o componente
    // e apenas se não tivermos já os dados E não estivermos carregando
    // Verificar ambos salaryId e isLoadingSalary
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
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
      };
    }

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
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
        } else {
          setSalary('');
          setSalaryId(null);
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
        } else {
          setSalary('');
          setSalaryId(null);
        }
      }
    } catch (error) {
      // Silenciar erros para não interromper a experiência do usuário
      setSalary('');
      setSalaryId(null);
    } finally {
      setIsLoadingSalary(false);
    }
  };
  
  // Função para salvar o salário
  const salvarSalario = async () => {
    try {
      setIsSavingSalary(true);
      console.log('🛑 Iniciando processo de salvar salário na tela de configuração');
      
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
        recorrente: true,
        periodo: 'mensal',
        descricao: 'Salário Mensal',
        categoria: '1', // Categoria padrão para salário
        tipo: 'salario', // Explicitamente definir como tipo salário
        data: new Date().toISOString().split('T')[0] // Data atual do registro
      };
      
      // =====================================================
      // NOVA ABORDAGEM: Sempre criar um novo registro
      // =====================================================
      console.log('📦 Dados do salário a enviar:', JSON.stringify(dadosSalario, null, 2));
      console.log('🗑️ Tentando limpar qualquer configuração de salário anterior');
      
      let response;
      
      try {
        // Se temos um ID de salário, vamos registrar
        if (salaryId) {
          console.log(`🔑 ID do salário atual: ${salaryId} - Este será ignorado e criaremos um novo`);
        }
        
        // Independente se temos um ID salvo ou não, vamos criar um novo
        console.log('➕ Criando novo registro de salário');
        response = await financasService.adicionarSalario(dadosSalario);
        console.log('✅ Resposta do servidor (criação):', JSON.stringify(response, null, 2));
        
        if (response && response.success && (response.salario_id || response.data?.id)) {
          // Armazenar o ID do salário para futura referência
          const novoId = response.salario_id || response.data?.id || null;
          console.log('🔑 Novo ID de salário recebido:', novoId);
          setSalaryId(novoId);
          
          // Exibir sucesso
          Alert.alert('Sucesso', 'Novo salário configurado com sucesso!');
          console.log('✓ Novo salário salvo com sucesso');
          
          // Fechar o modal
          setModalVisible(false);
          
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
          
          // Recarregar dados após salvar
          carregarDadosSalario();
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
  
  // Ícones disponíveis para categorias
  const availableIcons = [
    'fast-food-outline', 'car-outline', 'home-outline', 
    'game-controller-outline', 'medkit-outline', 'school-outline', 
    'cart-outline', 'cash-outline', 'briefcase-outline',
    'basket-outline', 'shirt-outline', 'trending-up-outline',
    'gift-outline', 'calendar-outline', 'today-outline',
    'star-outline', 'people-outline', 'card-outline'
  ];
  
  // Temas disponíveis
  const availableThemes = [
    { name: 'Escuro', value: 'dark', primary: '#A239FF', secondary: '#333' },
    { name: 'Claro', value: 'light', primary: '#6C63FF', secondary: '#f5f5f5' },
    { name: 'Roxo', value: 'purple', primary: '#9C27B0', secondary: '#f3e5f5' },
    { name: 'Azul', value: 'blue', primary: '#1976D2', secondary: '#e3f2fd' },
  ];
  
  // Formatar data
  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };
  
  // Abrir modal com conteúdo específico
  const openModal = (content, section) => {
    setCurrentSection(section);
    setModalContent(content);
    setModalVisible(true);
  };
  
  // Renderizar modal para Salário
  const renderSalaryModal = () => {
    // Array com dias do mês para o picker
    const diasDoMes = Array.from({ length: 31 }, (_, i) => i + 1);
    
    return (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Configurar Salário</Text>
      
      {isLoadingSalary ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A239FF" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Valor do Salário</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>R$</Text>
              <TextInput
                style={styles.input}
                value={salary}
                onChangeText={setSalary}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor="#555"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Data de Pagamento</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>Dia {paymentDate.getDate()}</Text>
              <Icon name="calendar-outline" size={22} color="#A239FF" />
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
                        setPaymentDate(novaData);
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
                    setPaymentDate(dataAtual);
                  }
                }}
              />
            )
          )}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
              disabled={isSavingSalary}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton, isSavingSalary && styles.disabledButton]}
              onPress={salvarSalario}
              disabled={isSavingSalary}
            >
              {isSavingSalary ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
    );
  };
  
  // Renderizar modal para Categorias
  const renderCategoriesModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Adicionar Categoria</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tipo</Text>
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[
              styles.segmentButton, 
              categoryType === 'despesa' && styles.segmentButtonActive
            ]}
            onPress={() => setCategoryType('despesa')}
          >
            <Text 
              style={[
                styles.segmentButtonText, 
                categoryType === 'despesa' && styles.segmentButtonTextActive
              ]}
            >
              Despesa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.segmentButton, 
              categoryType === 'ganho' && styles.segmentButtonActive
            ]}
            onPress={() => setCategoryType('ganho')}
          >
            <Text 
              style={[
                styles.segmentButtonText, 
                categoryType === 'ganho' && styles.segmentButtonTextActive
              ]}
            >
              Ganho
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nome da Categoria</Text>
        <TextInput
          style={[styles.input, styles.fullWidthInput]}
          value={category}
          onChangeText={setCategory}
          placeholder="Nome da categoria"
          placeholderTextColor="#555"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ícone</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.iconsScrollView}
        >
          {availableIcons.map((icon, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Icon 
                name={icon} 
                size={22} 
                color={selectedIcon === icon ? 'white' : '#888'} 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.saveButton]}
          onPress={() => {
            if (!category.trim()) {
              Alert.alert('Erro', 'O nome da categoria é obrigatório');
              return;
            }
            Alert.alert('Sucesso', `Categoria "${category}" adicionada!`);
            setModalVisible(false);
          }}
        >
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Renderizar modal para Temas
  const renderThemesModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Escolher Tema</Text>
      
      <View style={styles.themesContainer}>
        {availableThemes.map((theme, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.themeOption,
              { backgroundColor: theme.secondary },
              activeTheme === theme.value && styles.themeOptionSelected
            ]}
            onPress={() => setActiveTheme(theme.value)}
          >
            <View style={[styles.themeColor, { backgroundColor: theme.primary }]} />
            <Text style={styles.themeName}>{theme.name}</Text>
            {activeTheme === theme.value && (
              <Icon name="checkmark-circle" size={22} color="#A239FF" style={styles.themeCheck} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.saveButton]}
          onPress={() => {
            Alert.alert('Sucesso', 'Tema atualizado!');
            setModalVisible(false);
          }}
        >
          <Text style={styles.saveButtonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Renderizar modal para Tamanho da Fonte
  const renderFontSizeModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Tamanho da Fonte</Text>
      
      <View style={styles.fontSizeContainer}>
        <Text style={[styles.fontSizePreview, { fontSize: fontSize }]}>
          Tamanho de Texto
        </Text>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>A</Text>
          <Slider
            style={styles.slider}
            minimumValue={12}
            maximumValue={24}
            step={1}
            value={fontSize}
            onValueChange={setFontSize}
            minimumTrackTintColor="#A239FF"
            maximumTrackTintColor="#555"
            thumbTintColor="#A239FF"
          />
          <Text style={styles.sliderLabelLarge}>A</Text>
        </View>
        
        <Text style={styles.fontSizeValue}>{Math.round(fontSize)}px</Text>
      </View>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modalButton, styles.saveButton]}
          onPress={() => {
            Alert.alert('Sucesso', 'Tamanho da fonte atualizado!');
            setModalVisible(false);
          }}
        >
          <Text style={styles.saveButtonText}>Aplicar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Renderizar modal para Excluir Dados
  const renderDeleteDataModal = () => (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Excluir Dados</Text>
      
      <View style={styles.deleteOptionsContainer}>
        <TouchableOpacity 
          style={styles.deleteOption}
          onPress={() => {
            Alert.alert(
              'Atenção',
              'Deseja realmente excluir todos os registros? Esta ação não pode ser desfeita.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Excluir', 
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Sucesso', 'Todos os registros foram excluídos!');
                    setModalVisible(false);
                  }
                }
              ]
            );
          }}
        >
          <Icon name="trash-outline" size={22} color="#FF6B6B" style={styles.deleteIcon} />
          <Text style={styles.deleteOptionText}>Excluir Todos os Registros</Text>
        </TouchableOpacity>
        
        <View style={styles.separator} />
        
        <TouchableOpacity 
          style={styles.deleteOption}
          onPress={() => {
            Alert.alert(
              'Atenção',
              'Deseja realmente excluir sua conta? Todos os seus dados serão perdidos permanentemente.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { 
                  text: 'Excluir', 
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Sucesso', 'Sua conta foi excluída! Voltando para a tela inicial...');
                    setModalVisible(false);
                    // Aqui você adicionaria o código para deslogar o usuário
                  }
                }
              ]
            );
          }}
        >
          <Icon name="person-remove-outline" size={22} color="#FF6B6B" style={styles.deleteIcon} />
          <Text style={styles.deleteOptionText}>Excluir Minha Conta</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.modalButton, styles.cancelButton, styles.fullWidthButton]}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.cancelButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Renderizar conteúdo do modal com base na seção atual
  const renderModalContent = () => {
    switch (currentSection) {
      case 'salary':
        return renderSalaryModal();
      case 'categories':
        return renderCategoriesModal();
      case 'themes':
        return renderThemesModal();
      case 'fontSize':
        return renderFontSizeModal();
      case 'deleteData':
        return renderDeleteDataModal();
      default:
        return null;
    }
  };
  
  // Renderizar item de configuração
  const renderConfigItem = ({ 
    icon, 
    title, 
    description, 
    onPress,
    hasSwitch = false,
    switchValue = false,
    onSwitchChange = null,
    configured = false
  }) => (
    <TouchableOpacity 
      style={styles.configItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.configItemLeft}>
        <View style={styles.configItemIcon}>
          <Icon name={icon} size={24} color="#A239FF" />
        </View>
        <View style={styles.configItemContent}>
          <Text style={styles.configItemTitle}>{title}</Text>
          <Text style={styles.configItemDescription} numberOfLines={2}>{description}</Text>
        </View>
      </View>
      <View style={styles.configItemRight}>
        {configured && (
          <Icon name="checkmark-circle" size={20} color="#4CAF50" style={{marginRight: 8}} />
        )}
        {hasSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            color="#A239FF"
          />
        ) : (
          <Icon name="chevron-forward-outline" size={20} color="#BDBDBD" />
        )}
      </View>
    </TouchableOpacity>
  );
  
  // Função para exibir mensagem de "Em desenvolvimento"
  const showDevelopmentAlert = (feature) => {
    Alert.alert(
      "Em desenvolvimento",
      `A função "${feature}" está sendo implementada e estará disponível em breve.`,
      [{ text: "OK", style: "default" }]
    );
  };
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Conteúdo - Adicionado o handler de scroll */}
      <Animated.ScrollView 
        style={[styles.content, { opacity: animatedOpacity }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Finanças */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>FINANÇAS</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'cash-outline',
            title: 'Salário',
            description: salaryId 
              ? `R$ ${parseFloat(salary || 0).toFixed(2).replace('.', ',')} (Dia ${paymentDate ? paymentDate.getDate() : 1})` 
              : 'Defina seu salário e data de pagamento. O valor será incluído no seu saldo disponível.',
            onPress: () => navigation.navigate('SalaryConfig'),
            configured: !!salaryId
          })}
          {renderConfigItem({
            icon: 'trending-up-outline',
            title: 'Metas Financeiras',
            description: 'Configure objetivos e acompanhe seu progresso',
            onPress: () => showDevelopmentAlert('Metas Financeiras')
          })}
          {renderConfigItem({
            icon: 'analytics-outline',
            title: 'Preferências Monetárias',
            description: 'Formato da moeda e configurações de exibição',
            onPress: () => showDevelopmentAlert('Preferências Monetárias')
          })}
        </View>
        
        {/* Personalização */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>PERSONALIZAÇÃO</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'pricetag-outline',
            title: 'Categorias',
            description: 'Gerenciar categorias de despesas e ganhos',
            onPress: () => openModal(renderCategoriesModal(), 'categories')
          })}
          {renderConfigItem({
            icon: 'color-palette-outline',
            title: 'Temas',
            description: 'Escolha o tema do aplicativo',
            onPress: () => openModal(renderThemesModal(), 'themes')
          })}
          {renderConfigItem({
            icon: 'text-outline',
            title: 'Tamanho da Fonte',
            description: 'Ajuste o tamanho do texto',
            onPress: () => openModal(renderFontSizeModal(), 'fontSize')
          })}
          {renderConfigItem({
            icon: 'bar-chart-outline',
            title: 'Visualização',
            description: 'Configure gráficos e períodos padrão',
            onPress: () => showDevelopmentAlert('Preferências de Visualização')
          })}
        </View>

        {/* Segurança */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>SEGURANÇA</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'key-outline',
            title: 'PIN de Acesso',
            description: 'Configure um código numérico de segurança',
            onPress: () => showDevelopmentAlert('PIN de Acesso')
          })}
          {renderConfigItem({
            icon: 'lock-closed-outline',
            title: 'Bloqueio Automático',
            description: 'Defina o tempo de inatividade para bloqueio',
            onPress: () => showDevelopmentAlert('Bloqueio Automático')
          })}
        </View>

        {/* Notificações */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>NOTIFICAÇÕES</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'notifications-outline',
            title: 'Lembretes',
            description: 'Configure alertas para contas e faturas',
            onPress: () => showDevelopmentAlert('Lembretes')
          })}
          {renderConfigItem({
            icon: 'alert-circle-outline',
            title: 'Alertas de Orçamento',
            description: 'Receba avisos sobre seu orçamento mensal',
            onPress: () => showDevelopmentAlert('Alertas de Orçamento')
          })}
          {renderConfigItem({
            icon: 'time-outline',
            title: 'Horários',
            description: 'Defina quando deseja receber notificações',
            onPress: () => showDevelopmentAlert('Horários de Notificações')
          })}
        </View>
        
        {/* Sincronização e Backup */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>SINCRONIZAÇÃO E BACKUP</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'cloud-upload-outline',
            title: 'Backup Automático',
            description: 'Salve seus dados na nuvem periodicamente',
            onPress: () => showDevelopmentAlert('Backup Automático')
          })}
          {renderConfigItem({
            icon: 'download-outline',
            title: 'Exportar Dados',
            description: 'Exporte relatórios em PDF ou CSV',
            onPress: () => showDevelopmentAlert('Exportar Dados')
          })}
          {renderConfigItem({
            icon: 'card-outline',
            title: 'Conectar Bancos',
            description: 'Sincronize com suas contas bancárias',
            onPress: () => showDevelopmentAlert('Conectar Bancos')
          })}
          {renderConfigItem({
            icon: 'swap-horizontal-outline',
            title: 'Conversão de Moedas',
            description: 'Configure conversões entre diferentes moedas',
            onPress: () => showDevelopmentAlert('Conversão de Moedas')
          })}
        </View>

        {/* Ajuda e Suporte */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>AJUDA E SUPORTE</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'help-circle-outline',
            title: 'Tutoriais',
            description: 'Reveja os tutoriais do aplicativo',
            onPress: () => showDevelopmentAlert('Tutoriais')
          })}
          {renderConfigItem({
            icon: 'information-circle-outline',
            title: 'Perguntas Frequentes',
            description: 'Consulte as dúvidas mais comuns',
            onPress: () => showDevelopmentAlert('Perguntas Frequentes')
          })}
          {renderConfigItem({
            icon: 'chatbubble-outline',
            title: 'Contato',
            description: 'Entre em contato com nosso suporte',
            onPress: () => showDevelopmentAlert('Contato')
          })}
        </View>
        
        {/* Dados */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>DADOS</Text>
        </View>
        <View style={styles.section}>
          {renderConfigItem({
            icon: 'trash-outline',
            title: 'Excluir Dados',
            description: 'Apagar registros ou excluir conta',
            onPress: () => openModal(renderDeleteDataModal(), 'deleteData')
          })}
        </View>
        
        {/* Versão */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>VicCoin v1.0.0</Text>
        </View>
      </Animated.ScrollView>
      
      {/* AppBottomBar já não precisa mais receber a propriedade isScrollingDown */}
      <AppBottomBar 
        navigation={navigation}
        activeTab="settings"
      />
      
      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark">
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              onPress={() => setModalVisible(false)}
            />
          </BlurView>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            style={[
              styles.modalContainer,
              keyboardVisible && styles.modalContainerWithKeyboard
            ]}
          >
            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {renderModalContent()}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A1A1C',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2C',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2C',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A239FF',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: '#222224',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A2C',
    marginHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2C',
  },
  configItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  configItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2C',
    marginRight: 14,
  },
  configItemContent: {
    flex: 1,
    paddingRight: 8,
  },
  configItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  configItemDescription: {
    fontSize: 13,
    color: '#AAA',
    lineHeight: 18,
  },
  configItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  versionContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  versionText: {
    fontSize: 13,
    color: '#777',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e1e20',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalContainerWithKeyboard: {
    maxHeight: '90%',
  },
  modalScrollContent: {
    paddingBottom: 30,
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#AAA',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#2A2A2C',
  },
  inputPrefix: {
    fontSize: 15,
    color: '#AAA',
    marginRight: 5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    padding: 12,
  },
  fullWidthInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    backgroundColor: '#2A2A2C',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#2A2A2C',
  },
  datePickerText: {
    fontSize: 15,
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#A239FF',
  },
  cancelButtonText: {
    color: '#CCC',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  fullWidthButton: {
    marginHorizontal: 0,
    marginTop: 16,
  },
  
  // Segment control for categories
  segmentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#2A2A2C',
  },
  segmentButtonActive: {
    backgroundColor: '#A239FF',
  },
  segmentButtonText: {
    color: '#AAA',
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: 'white',
  },
  
  // Icons selection
  iconsScrollView: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  iconOption: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2A2A2C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  iconOptionSelected: {
    backgroundColor: '#A239FF',
  },
  
  // Themes
  themesContainer: {
    marginVertical: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  themeOptionSelected: {
    borderWidth: 2,
    borderColor: '#A239FF',
  },
  themeColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  themeCheck: {
    position: 'absolute',
    right: 12,
  },
  
  // Font size
  fontSizeContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  fontSizePreview: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#FFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#AAA',
  },
  sliderLabelLarge: {
    fontSize: 18,
    color: '#AAA',
  },
  fontSizeValue: {
    fontSize: 13,
    color: '#AAA',
  },
  
  // Delete data
  deleteOptionsContainer: {
    marginVertical: 16,
  },
  deleteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteIcon: {
    marginRight: 12,
  },
  deleteOptionText: {
    fontSize: 15,
    color: '#FFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  scrollContentContainer: {
    paddingBottom: 135,
    paddingTop: 10,
  },
  
  // Estilos para o picker de dias
  dayPickerContainer: {
    backgroundColor: '#2A2A2C',
    borderRadius: 12,
    marginVertical: 10,
    paddingBottom: 12,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  dayPickerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  dayPickerCloseBtn: {
    padding: 4,
  },
  dayPickerConfirmText: {
    color: '#A239FF',
    fontWeight: '600',
  },
  dayPickerContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  dayPickerItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    backgroundColor: '#333',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    height: 100,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
});

export default ConfigScreen; 