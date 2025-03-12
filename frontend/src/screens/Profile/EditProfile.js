import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar
} from 'react-native';
import { 
  TextInput, 
  Text, 
  Button,
  ActivityIndicator
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';

// Hooks e utils
import useProfileActions from './hooks/useProfileActions';

function EditProfile({ navigation }) {
  const user = useSelector(state => state.auth.user) || {};
  const { handleUpdateProfile } = useProfileActions();
  
  // Estados do formulário
  const [nome, setNome] = useState(user.nome || '');
  const [email, setEmail] = useState(user.email || '');
  const [telefone, setTelefone] = useState(user.telefone || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [dataNascimento, setDataNascimento] = useState(user.dataNascimento || '');
  const [foto, setFoto] = useState(user.fotoUrl || null);
  
  // Estado de carregamento
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Iniciais do usuário para avatar padrão
  const iniciais = useMemo(() => {
    if (!nome) return '?';
    
    const parts = nome.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [nome]);
  
  // Função para formatação de CPF
  const formatarCPF = useCallback((valor) => {
    // Remove caracteres não numéricos
    const cpfNumerico = valor.replace(/\D/g, '');
    
    // Formata o CPF
    if (cpfNumerico.length <= 3) {
      return cpfNumerico;
    } else if (cpfNumerico.length <= 6) {
      return `${cpfNumerico.slice(0, 3)}.${cpfNumerico.slice(3)}`;
    } else if (cpfNumerico.length <= 9) {
      return `${cpfNumerico.slice(0, 3)}.${cpfNumerico.slice(3, 6)}.${cpfNumerico.slice(6)}`;
    } else {
      return `${cpfNumerico.slice(0, 3)}.${cpfNumerico.slice(3, 6)}.${cpfNumerico.slice(6, 9)}-${cpfNumerico.slice(9, 11)}`;
    }
  }, []);
  
  // Função para formatação de telefone
  const formatarTelefone = useCallback((valor) => {
    // Remove caracteres não numéricos
    const telefoneNumerico = valor.replace(/\D/g, '');
    
    // Formata o telefone
    if (telefoneNumerico.length <= 2) {
      return `(${telefoneNumerico}`;
    } else if (telefoneNumerico.length <= 6) {
      return `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2)}`;
    } else if (telefoneNumerico.length <= 10) {
      return `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2, 6)}-${telefoneNumerico.slice(6)}`;
    } else {
      return `(${telefoneNumerico.slice(0, 2)}) ${telefoneNumerico.slice(2, 7)}-${telefoneNumerico.slice(7, 11)}`;
    }
  }, []);
  
  // Função para formatação de data
  const formatarData = useCallback((valor) => {
    // Remove caracteres não numéricos
    const dataNumerico = valor.replace(/\D/g, '');
    
    // Formata a data
    if (dataNumerico.length <= 2) {
      return dataNumerico;
    } else if (dataNumerico.length <= 4) {
      return `${dataNumerico.slice(0, 2)}/${dataNumerico.slice(2)}`;
    } else {
      return `${dataNumerico.slice(0, 2)}/${dataNumerico.slice(2, 4)}/${dataNumerico.slice(4, 8)}`;
    }
  }, []);
  
  // Função para validar os campos
  const validarFormulario = useCallback(() => {
    const novosErros = {};
    
    // Validar nome
    if (!nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }
    
    // Validar email
    if (!email.trim()) {
      novosErros.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      novosErros.email = 'Email inválido';
    }
    
    // Validar CPF (se preenchido)
    if (cpf && cpf.replace(/\D/g, '').length !== 11) {
      novosErros.cpf = 'CPF inválido';
    }
    
    // Validar telefone (se preenchido)
    if (telefone && telefone.replace(/\D/g, '').length < 10) {
      novosErros.telefone = 'Telefone inválido';
    }
    
    // Validar data de nascimento (se preenchida)
    if (dataNascimento) {
      const dataRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = dataNascimento.match(dataRegex);
      
      if (!match) {
        novosErros.dataNascimento = 'Data inválida';
      } else {
        const dia = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1;
        const ano = parseInt(match[3], 10);
        
        const data = new Date(ano, mes, dia);
        
        if (
          data.getDate() !== dia ||
          data.getMonth() !== mes ||
          data.getFullYear() !== ano ||
          data > new Date()
        ) {
          novosErros.dataNascimento = 'Data inválida';
        }
      }
    }
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [nome, email, cpf, telefone, dataNascimento]);
  
  // Função para salvar o perfil
  const handleSave = useCallback(async () => {
    if (!validarFormulario()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const profileData = {
        nome,
        email,
        telefone: telefone || undefined,
        cpf: cpf || undefined,
        dataNascimento: dataNascimento || undefined,
        fotoUrl: foto
      };
      
      const result = await handleUpdateProfile(profileData);
      
      if (result.success) {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        navigation.goBack();
      } else {
        Alert.alert('Erro', result.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao atualizar perfil');
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [nome, email, telefone, cpf, dataNascimento, foto, validarFormulario, handleUpdateProfile, navigation]);
  
  // Função para selecionar foto (simulada)
  const handleSelectPhoto = useCallback(() => {
    Alert.alert(
      'Seleção de Foto',
      'Esta funcionalidade seria integrada com a câmera e galeria do dispositivo.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#A239FF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        
        <View style={{width: 40}} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={handleSelectPhoto}
        >
          {foto ? (
            <Image 
              source={{ uri: foto }} 
              style={styles.avatar} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{iniciais}</Text>
            </View>
          )}
          
          <View style={styles.editAvatarButton}>
            <Icon name="camera" size={16} color="white" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.form}>
          <TextInput
            label="Nome de Usuário"
            value={nome}
            onChangeText={setNome}
            mode="outlined"
            style={styles.input}
            error={!!errors.nome}
            disabled={isSubmitting}
            outlineColor="#333333"
            activeOutlineColor="#A239FF"
            theme={{ colors: { text: 'white', placeholder: '#BBBBBB', background: '#1E1E1E' } }}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            error={!!errors.email}
            disabled={isSubmitting}
            keyboardType="email-address"
            autoCapitalize="none"
            outlineColor="#333333"
            activeOutlineColor="#A239FF"
            theme={{ colors: { text: 'white', placeholder: '#BBBBBB', background: '#1E1E1E' } }}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          
          <TextInput
            label="Telefone"
            value={telefone}
            onChangeText={(text) => setTelefone(formatarTelefone(text))}
            mode="outlined"
            style={styles.input}
            error={!!errors.telefone}
            disabled={isSubmitting}
            keyboardType="phone-pad"
            outlineColor="#333333"
            activeOutlineColor="#A239FF"
            theme={{ colors: { text: 'white', placeholder: '#BBBBBB', background: '#1E1E1E' } }}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}
          
          <TextInput
            label="CPF"
            value={cpf}
            onChangeText={(text) => setCpf(formatarCPF(text))}
            mode="outlined"
            style={styles.input}
            error={!!errors.cpf}
            disabled={isSubmitting}
            keyboardType="number-pad"
            outlineColor="#333333"
            activeOutlineColor="#A239FF"
            theme={{ colors: { text: 'white', placeholder: '#BBBBBB', background: '#1E1E1E' } }}
          />
          {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
          
          <TextInput
            label="Data de Nascimento"
            value={dataNascimento}
            onChangeText={(text) => setDataNascimento(formatarData(text))}
            mode="outlined"
            style={styles.input}
            error={!!errors.dataNascimento}
            disabled={isSubmitting}
            keyboardType="number-pad"
            placeholder="DD/MM/AAAA"
            outlineColor="#333333"
            activeOutlineColor="#A239FF"
            theme={{ colors: { text: 'white', placeholder: '#BBBBBB', background: '#1E1E1E' } }}
          />
          {errors.dataNascimento && <Text style={styles.errorText}>{errors.dataNascimento}</Text>}
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            labelStyle={styles.saveButtonLabel}
            disabled={isSubmitting}
            loading={isSubmitting}
            buttonColor="#A239FF"
          >
            Salvar Alterações
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 24,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C2C2C',
  },
  initialsAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#A239FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#A239FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  form: {
    paddingHorizontal: 24,
  },
  input: {
    marginBottom: 2,
    backgroundColor: '#1E1E1E',
    marginVertical: 8,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile; 