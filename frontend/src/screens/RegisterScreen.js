import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { authService } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  // Validação do formulário
  const validarFormulario = () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu nome');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return false;
    }
    
    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return false;
    }
    
    if (!senha.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua senha');
      return false;
    }
    
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return false;
    }
    
    return true;
  };

  // Função para realizar o cadastro
  const handleRegister = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    
    try {
      const response = await authService.register(nome, email, senha);
      setLoading(false);
      
      Alert.alert(
        'Sucesso', 
        'Cadastro realizado com sucesso! Faça login para continuar.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      setLoading(false);
      
      // Exibe mensagem de erro específica, se disponível
      if (error.response && error.response.data) {
        Alert.alert('Erro de Cadastro', error.response.data.message || 'Não foi possível realizar o cadastro');
      } else {
        Alert.alert('Erro de Cadastro', 'Não foi possível conectar ao servidor. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Surface style={styles.surface}>
          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>
          
          <TextInput
            label="Nome completo"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
          />
          
          <TextInput
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            style={styles.input}
            secureTextEntry={secureTextEntry}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye-off" : "eye"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
            left={<TextInput.Icon icon="lock" />}
          />
          
          <TextInput
            label="Confirmar senha"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            style={styles.input}
            secureTextEntry={secureConfirmTextEntry}
            right={
              <TextInput.Icon
                icon={secureConfirmTextEntry ? "eye-off" : "eye"}
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
              />
            }
            left={<TextInput.Icon icon="lock-check" />}
          />
          
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Cadastrar
          </Button>
          
          <View style={styles.footer}>
            <Text>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Faça login</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1e88e5',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#757575',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    color: '#1e88e5',
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 