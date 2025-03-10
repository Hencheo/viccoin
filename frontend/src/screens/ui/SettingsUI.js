import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Switch, Alert, Modal, TextInput } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import theme from '../../styles/theme';
import BottomNavBar from '../../components/ui/BottomNavBar';

/**
 * SettingsUI - Tela de configurações do aplicativo VicCoin
 * 
 * ESTRUTURA DA INTERFACE:
 * 1. headerSection - Seção superior com cor de destaque
 *    - header - Cabeçalho com título
 * 
 * 2. contentSection - Seção de conteúdo com opções de configuração
 *    - Dados financeiros (data recebimento, salário recorrente)
 *    - Gerenciamento de dados (exportar, apagar)
 *    - Preferências (tema, notificações)
 * 
 * 3. navigationBar - Barra de navegação inferior fixa (compartilhada)
 */
const SettingsUI = ({ 
  navigation,
  userData = {}, // Dados fictícios para demonstração
  handleLogout,
  handleSaveSettings = () => console.log('Salvar configurações') // Função fictícia
}) => {
  // Dados fictícios para demonstração
  const [settings, setSettings] = useState({
    paymentDate: new Date(2023, 7, 5), // 5 de cada mês
    salary: "3500",
    isRecurringSalary: true,
    darkMode: true,
    notifications: true,
    biometricAuth: false,
    language: 'pt-BR'
  });

  // Estado para controlar modals
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryInput, setSalaryInput] = useState(settings.salary);
  const [exportOptions, setExportOptions] = useState(false);

  // Função para atualizar configurações
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Função para lidar com a mudança de data
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateSetting('paymentDate', selectedDate);
    }
  };

  // Função para salvar o salário após edição
  const saveSalary = () => {
    updateSetting('salary', salaryInput);
    setShowSalaryModal(false);
  };

  // Função para simular exportação de extrato
  const handleExport = (period) => {
    Alert.alert(
      "Exportar Extrato",
      `Extrato ${period} exportado com sucesso!`,
      [{ text: "OK" }]
    );
    setExportOptions(false);
  };

  // Função para confirmar exclusão de dados
  const confirmDeleteData = () => {
    Alert.alert(
      "Excluir Dados",
      "Tem certeza que deseja excluir todos os seus dados financeiros? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: () => {
            // Ação fictícia para simular exclusão
            Alert.alert("Dados excluídos", "Todos os seus dados foram excluídos com sucesso.");
          } 
        }
      ]
    );
  };

  // Formatação da data de recebimento para exibição
  const formatDate = (date) => {
    return date ? `Dia ${date.getDate()}` : 'Não definido';
  };

  // Formatação do valor do salário para exibição
  const formatCurrency = (value) => {
    return `R$ ${value}`;
  };

  // Função para lidar com ações do botão de adicionar
  const handleAddAction = (action) => {
    console.log(`Ação selecionada: ${action}`);
    
    // Em um aplicativo real, navegaríamos para as telas correspondentes
    switch (action) {
      case 'expense':
        Alert.alert('Adicionar despesa', 'Funcionalidade em desenvolvimento');
        break;
      case 'income':
        Alert.alert('Adicionar ganho', 'Funcionalidade em desenvolvimento');
        break;
      case 'reports':
        Alert.alert('Relatórios', 'Funcionalidade em desenvolvimento');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0A0F2C" barStyle="light-content" />
      
      {/* Seção superior com cabeçalho */}
      <View style={styles.headerSection}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações</Text>
        </View>
      </View>

      {/* Conteúdo principal com opções de configuração */}
      <ScrollView
        contentContainerStyle={styles.contentSection}
        showsVerticalScrollIndicator={false}
      >
        {/* Seção: Dados Financeiros */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Dados Financeiros</Text>
          
          {/* Data de Recebimento */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Data de Recebimento</Text>
              <Text style={styles.settingValue}>{formatDate(settings.paymentDate)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
          
          {/* Salário Recorrente */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowSalaryModal(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="cash-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Salário</Text>
              <Text style={styles.settingValue}>{formatCurrency(settings.salary)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
          
          {/* Opção de Salário Recorrente (Switch) */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="repeat-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Salário Recorrente</Text>
              <Text style={styles.settingDescription}>Registrar automaticamente no dia definido</Text>
            </View>
            <Switch
              value={settings.isRecurringSalary}
              onValueChange={(value) => updateSetting('isRecurringSalary', value)}
              trackColor={{ false: "#767577", true: "#00D0C566" }}
              thumbColor={settings.isRecurringSalary ? "#00D0C5" : "#f4f3f4"}
            />
          </View>
        </View>
        
        {/* Seção: Gerenciamento de Dados */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Gerenciamento de Dados</Text>
          
          {/* Exportar Extrato */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setExportOptions(true)}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons name="download-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Exportar Extrato</Text>
              <Text style={styles.settingDescription}>Mensal ou semanal</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
          
          {/* Excluir Dados */}
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={confirmDeleteData}
          >
            <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(255, 92, 117, 0.1)' }]}>
              <Ionicons name="trash-outline" size={20} color="#FF5C75" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Excluir Dados</Text>
              <Text style={styles.settingDescription}>Remove permanentemente todos os registros</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>
        </View>
        
        {/* Seção: Preferências */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          
          {/* Tema Escuro */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="moon-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Tema Escuro</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: "#767577", true: "#00D0C566" }}
              thumbColor={settings.darkMode ? "#00D0C5" : "#f4f3f4"}
            />
          </View>
          
          {/* Notificações */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notificações</Text>
              <Text style={styles.settingDescription}>Receba alertas de movimentações</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: "#767577", true: "#00D0C566" }}
              thumbColor={settings.notifications ? "#00D0C5" : "#f4f3f4"}
            />
          </View>
          
          {/* Autenticação Biométrica */}
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="finger-print-outline" size={20} color="#00D0C5" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Autenticação Biométrica</Text>
              <Text style={styles.settingDescription}>Usar biometria para login</Text>
            </View>
            <Switch
              value={settings.biometricAuth}
              onValueChange={(value) => updateSetting('biometricAuth', value)}
              trackColor={{ false: "#767577", true: "#00D0C566" }}
              thumbColor={settings.biometricAuth ? "#00D0C5" : "#f4f3f4"}
            />
          </View>
        </View>
        
        {/* Botão de Logout */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal para seleção de data */}
      {showDatePicker && (
        <DateTimePicker
          value={settings.paymentDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {/* Modal para editar salário */}
      <Modal
        visible={showSalaryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSalaryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSalaryModal(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Definir Salário</Text>
            <TextInput
              style={styles.salaryInput}
              value={salaryInput}
              onChangeText={setSalaryInput}
              keyboardType="numeric"
              placeholder="Digite o valor do salário"
              placeholderTextColor="#999999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSalaryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveSalary}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Modal para opções de exportação */}
      <Modal
        visible={exportOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExportOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExportOptions(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Exportar Extrato</Text>
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => handleExport('mensal')}
            >
              <Ionicons name="calendar-outline" size={20} color="#00D0C5" />
              <Text style={styles.exportOptionText}>Extrato Mensal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportOption}
              onPress={() => handleExport('semanal')}
            >
              <Ionicons name="calendar-outline" size={20} color="#00D0C5" />
              <Text style={styles.exportOptionText}>Extrato Semanal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { marginTop: 10 }]}
              onPress={() => setExportOptions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Barra de navegação inferior */}
      <BottomNavBar 
        navigation={navigation} 
        currentScreen="Settings" 
        onAddAction={handleAddAction} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: '#0A0F2C', // Azul escuro profundo (mantendo consistência)
  },
  
  // Seção superior com cabeçalho
  headerSection: {
    backgroundColor: '#0A0F2C',
    paddingTop: theme.statusBarHeight + 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  
  // Estilo para o cabeçalho
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    marginBottom: 0,
    marginTop: 10,
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 15,
    marginBottom: 5,
    color: '#FFFFFF',
    letterSpacing: -0.7,
  },
  
  // Conteúdo principal
  contentSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 3,
  },
  
  // Seção de configurações
  settingsSection: {
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  
  // Item de configuração
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 208, 197, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  settingContent: {
    flex: 1,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  
  settingValue: {
    fontSize: 14,
    color: '#00D0C5',
    fontWeight: '500',
  },
  
  // Botão de logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 92, 117, 0.15)',
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    marginTop: theme.spacing.xl,
  },
  
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    backgroundColor: '#151B3D',
    borderRadius: 16,
    padding: theme.spacing.lg,
    width: '80%',
    maxWidth: 320,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  
  salaryInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    marginBottom: theme.spacing.md,
  },
  
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  modalButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  
  saveButton: {
    backgroundColor: '#00D0C5',
  },
  
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  saveButtonText: {
    color: '#151B3D',
    fontWeight: '600',
    fontSize: 14,
  },
  
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  
  // Opções de exportação
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  exportOptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: theme.spacing.md,
  },
});

export default SettingsUI; 