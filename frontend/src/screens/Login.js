import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { login } from '../actions/authActions';

function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const authError = useSelector(state => state.auth.error);
  
  // Validação simples para os campos do formulário
  function validateForm() {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, digite seu email');
      return false;
    }
    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, digite sua senha');
      return false;
    }
    
    // Validação básica de email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, digite um email válido');
      return false;
    }
    
    return true;
  }

  // Função para realizar o login
  async function handleLogin() {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      console.log('Iniciando login com:', email);
      const response = await dispatch(login(email, password));
      console.log('Resposta do login:', response);
      
      if (!response.success) {
        Alert.alert('Erro', response.message || 'Falha ao fazer login. Verifique suas credenciais.');
      } else {
        console.log('Login realizado com sucesso!');
        // A navegação será gerenciada pelo Redux
      }
    } catch (error) {
      console.error('Erro detalhado ao logar:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>VicCoin</Text>
        <Text style={styles.subtitle}>Controle financeiro inteligente</Text>
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          disabled={isSubmitting}
        />
        
        <TextInput
          label="Senha"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          style={styles.input}
          secureTextEntry={!showPassword}
          right={
            <TextInput.Icon 
              icon={showPassword ? "eye-off" : "eye"} 
              onPress={() => setShowPassword(!showPassword)} 
            />
          }
          disabled={isSubmitting}
        />
        
        <Button 
          mode="contained" 
          onPress={handleLogin}
          style={styles.button}
          disabled={isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : "Entrar"}
        </Button>
        
        <TouchableOpacity 
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
          disabled={isSubmitting}
        >
          <Text style={styles.registerText}>
            Não tem uma conta? Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: '#2E7D32',
  },
  registerLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    color: '#2E7D32',
    fontSize: 14,
  },
});

export default Login; 