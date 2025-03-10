import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { authService, testeAPI } from '../services/api';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base da API
const API_URL = 'https://viccoin.onrender.com';

// Modo offline para desenvolvimento
const OFFLINE_MODE = false;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('hencheo96@gmail.com');
  const [senha, setSenha] = useState('Qwerty');
  const [esconderSenha, setEsconderSenha] = useState(true);
  const [loading, setLoading] = useState(false);
  const [testando, setTestando] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [senhaError, setSenhaError] = useState('');

  // Validação do formulário
  const validarFormulario = () => {
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
    
    return true;
  };

  // Função para realizar o login
  const handleLogin = async () => {
    if (!validarFormulario()) return;
    
    setLoading(true);
    
    try {
      // Em modo offline, usar diretamente os dados fictícios sem chamar API
      if (OFFLINE_MODE) {
        // Simular atraso de rede
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Salvar token fictício e ID de usuário baseado no email
        await AsyncStorage.setItem('jwt_token', 'teste_token_123');
        // Usar um user_id baseado no email real em vez de um valor genérico
        const userId = email.toLowerCase().replace('@', '_').replace('.', '_');
        await AsyncStorage.setItem('user_id', userId);
        
        setLoading(false);
        navigation.replace('Home');
        return;
      }
      
      // Modo online - chama API normalmente
      const resposta = await authService.login(email, senha);
      
      // Verificar se temos um token válido
      if (!resposta.token) {
        setLoading(false);
        Alert.alert('Erro de Login', 'Resposta do servidor não contém token. Contate o suporte.');
        return;
      }
      
      // Salvar token e user_id
      await AsyncStorage.setItem('jwt_token', resposta.token);
      
      // Salvar user_id - vários formatos possíveis na resposta
      let userId = null;
      if (resposta.user_id) {
        userId = resposta.user_id;
      } else if (resposta.userId) {
        userId = resposta.userId;
      } else if (resposta.id) {
        userId = resposta.id;
      } else if (resposta.user && resposta.user.id) {
        userId = resposta.user.id;
      } else if (resposta.user && resposta.user.user_id) {
        userId = resposta.user.user_id;
      } else {
        // Se não há user_id na resposta, usar o email como identificação
        userId = email.toLowerCase().replace('@', '_').replace('.', '_');
      }
      
      console.log('User ID salvo:', userId);
      await AsyncStorage.setItem('user_id', userId);
      
      setLoading(false);
      // Redireciona para a tela inicial após o login bem-sucedido
      navigation.replace('Home');
    } catch (erro) {
      setLoading(false);
      
      console.error('Erro de login:', erro.message || erro);
      
      // Se estamos em modo offline e ocorreu um erro, usamos dados fictícios
      if (OFFLINE_MODE) {
        const userId = email.toLowerCase().replace('@', '_').replace('.', '_');
        await AsyncStorage.setItem('jwt_token', 'teste_token_123');
        await AsyncStorage.setItem('user_id', userId);
        
        navigation.replace('Home');
        return;
      }
      
      // Em modo online, mostrar o erro
      Alert.alert(
        'Erro de Login',
        'Não foi possível fazer login. Verifique suas credenciais e conexão com a internet.'
      );
    }
  };

  // Função para testar a conexão com a API
  const testarConexao = async () => {
    setTestando(true);
    
    try {
      // Usando fetch diretamente para evitar problemas com axios
      try {
        // Tenta acessar a raiz da API com fetch
        const raizResponse = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!raizResponse.ok) {
          throw new Error(`Erro: ${raizResponse.status}`);
        }
        
        const raizData = await raizResponse.json();
        console.log('Teste da raiz bem-sucedido (fetch):', raizData);
        
        // Tenta fazer um teste simples de login
        try {
          // Usa fetch para testar o login
          const loginResponse = await fetch(`${API_URL}/api/login/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: 'teste@example.com',
              password: 'teste123'
            })
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('Teste de login bem-sucedido (fetch):', loginData);
            Alert.alert('Sucesso', 'Conexão com a API e endpoint de login verificados com sucesso!');
          } else {
            // Isso é esperado se o login falhar por credenciais inválidas
            console.log('Endpoint de login respondeu com:', loginResponse.status);
            Alert.alert('Sucesso parcial', 'Conexão com a API estabelecida, mas o login falhou (isso pode ser esperado se as credenciais de teste forem inválidas).');
          }
        } catch (loginError) {
          console.error('Erro ao testar login:', loginError);
          Alert.alert('Aviso', 'Conexão com a API estabelecida, mas ocorreu um erro ao testar o login.');
        }
      } catch (raizError) {
        console.error('Erro ao acessar a raiz da API:', raizError);
        
        // Tenta usar a função de descoberta de endpoints como fallback
        try {
          await testeAPI.descobrirEndpoints();
          Alert.alert('Aviso', 'Não foi possível acessar a raiz da API, mas tentamos descobrir outros endpoints disponíveis.');
        } catch (discoveryError) {
          Alert.alert('Erro de Conexão', 'Não foi possível se conectar ao servidor da API. Verifique sua conexão com a internet.');
        }
      }
    } catch (erro) {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar com o servidor. Verifique sua conexão com a internet.');
    } finally {
      setTestando(false);
    }
  };

  // Função para realizar o login com diagnóstico detalhado
  const handleLoginDiagnostic = async () => {
    setLoading(true);
    console.log('=== DIAGNÓSTICO DE LOGIN ===');
    console.log('Tentando login com:', email, senha);
    
    try {
      // Testar diretamente com fetch para ver a resposta bruta
      const endpoints = [
        '/api/login/',
        '/api/token/',
        '/login/',
        '/auth/login/',
        '/api/auth/login/'
      ];
      
      let foundWorkingEndpoint = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`\nTestando endpoint: ${endpoint}`);
          
          const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              password: senha,
              username: email
            })
          });
          
          console.log(`Status: ${response.status}`);
          
          let responseText;
          try {
            responseText = await response.text();
            console.log(`Resposta: ${responseText}`);
            
            // Tentar parsear como JSON
            try {
              const jsonData = JSON.parse(responseText);
              console.log('Resposta em JSON:', jsonData);
              
              // Verificar se temos um token
              if (jsonData.token || jsonData.access || jsonData.accessToken || jsonData.key || jsonData.auth_token) {
                console.log('TOKEN ENCONTRADO!');
                foundWorkingEndpoint = true;
                
                const token = jsonData.token || jsonData.access || jsonData.accessToken || jsonData.key || jsonData.auth_token;
                await AsyncStorage.setItem('jwt_token', token);
                
                // Também salvar o endpoint que funcionou
                await AsyncStorage.setItem('working_endpoint', endpoint);
                
                setLoading(false);
                Alert.alert(
                  'Diagnóstico Concluído',
                  `Login bem-sucedido via ${endpoint}\nToken: ${token.substring(0, 10)}...`,
                  [
                    {
                      text: 'Continuar',
                      onPress: () => navigation.replace('Home')
                    }
                  ]
                );
                return;
              }
            } catch (parseError) {
              console.log('Resposta não é JSON válido');
            }
          } catch (textError) {
            console.log('Erro ao ler texto da resposta');
          }
        } catch (endpointError) {
          console.log(`Erro ao tentar endpoint ${endpoint}:`, endpointError.message);
        }
      }
      
      if (!foundWorkingEndpoint) {
        console.log('\nNENHUM ENDPOINT FUNCIONOU');
        
        // Testar se conseguimos acessar a API raiz para diagnóstico
        try {
          console.log('\nTentando acessar a raiz da API para diagnóstico');
          const rootResponse = await fetch(`${API_URL}/api/`);
          console.log(`Status: ${rootResponse.status}`);
          
          if (rootResponse.ok) {
            const rootText = await rootResponse.text();
            console.log(`Resposta da raiz da API: ${rootText.substring(0, 500)}${rootText.length > 500 ? '...' : ''}`);
          }
        } catch (rootError) {
          console.log('Erro ao acessar raiz da API:', rootError.message);
        }
        
        setLoading(false);
        Alert.alert(
          'Diagnóstico Concluído',
          'Não foi possível fazer login em nenhum endpoint. Verifique o console para detalhes.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Erro geral no diagnóstico:', error.message);
      setLoading(false);
      Alert.alert('Erro no Diagnóstico', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Surface style={styles.surface}>
          <Text style={styles.title}>VicCoin</Text>
          <Text style={styles.subtitle}>Faça login para acessar sua conta</Text>
          
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
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
            disabled={loading || testando}
          >
            Entrar
          </Button>
          
          {/* Botão para testar a conexão */}
          <Button
            mode="outlined"
            onPress={testarConexao}
            style={styles.testButton}
            loading={testando}
            disabled={loading || testando}
          >
            Testar Conexão com API
          </Button>
          
          {/* Botão para realizar o login com diagnóstico detalhado */}
          <Button
            mode="outlined"
            onPress={handleLoginDiagnostic}
            style={styles.diagnosticButton}
            loading={loading}
            disabled={loading || testando}
          >
            Realizar Diagnóstico de Login
          </Button>
          
          {OFFLINE_MODE && (
            <Text style={styles.offlineText}>
              Aplicativo em modo offline (desenvolvimento)
            </Text>
          )}
          
          <View style={styles.footer}>
            <Text>Não tem uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Cadastre-se</Text>
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
  testButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  diagnosticButton: {
    marginTop: 12,
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
  offlineText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default LoginScreen; 