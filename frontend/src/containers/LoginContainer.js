import React, { useState } from 'react';
import { Alert } from 'react-native';
import { authService } from '../services/api';
import LoginUI from '../screens/ui/LoginUI';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Container component que mantém toda a lógica de login
 * Separado do componente de UI para permitir redesign sem afetar a lógica
 */
const LoginContainer = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [testando, setTestando] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

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
      const resposta = await authService.login(email, senha);
      setLoading(false);
      
      console.log('Resposta de login bem-sucedida:', resposta);
      
      // Verificar se temos um token válido
      if (!resposta.token) {
        Alert.alert('Erro de Login', 'Resposta do servidor não contém token. Contate o suporte.');
        return;
      }
      
      // Redireciona para a tela inicial após o login bem-sucedido
      navigation.replace('Home');
    } catch (erro) {
      setLoading(false);
      
      console.error('Erro detalhado de login:', erro);
      
      // Se for erro de rede (Network Error), oferece modo de desenvolvimento
      if (erro.message && (erro.message.includes('Network Error') || erro.message.includes('network'))) {
        Alert.alert(
          'Erro de Conexão',
          'Não foi possível conectar ao servidor. Deseja usar o modo de desenvolvimento para testes?',
          [
            {
              text: 'Não',
              style: 'cancel'
            },
            {
              text: 'Sim, usar modo de teste',
              onPress: () => {
                // Cria um usuário de teste simulado e navega para Home
                console.log('Usando modo de teste para desenvolvimento');
                // Salva um token de teste no AsyncStorage
                AsyncStorage.setItem('jwt_token', 'dev_mode_token').then(() => {
                  // Navega para a tela principal
                  navigation.replace('Home');
                });
              }
            }
          ]
        );
        return;
      }
      
      // Exibe mensagem de erro específica, se disponível
      if (erro.response) {
        const status = erro.response.status;
        const mensagemErro = erro.response.data?.detail || 'Credenciais inválidas';
        
        if (status === 401) {
          Alert.alert('Erro de Login', 'Email ou senha incorretos. Verifique suas credenciais.');
        } else if (status === 400) {
          Alert.alert('Erro de Login', mensagemErro);
        } else {
          Alert.alert('Erro de Login', `Erro no servidor (${status}): ${mensagemErro}`);
        }
      } else if (erro.request) {
        // Requisição foi feita mas não houve resposta (problema de rede)
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
      } else {
        // Erro na configuração da requisição
        Alert.alert('Erro de Login', 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.');
      }
    }
  };

  // Função para testar a conexão com a API
  const testarConexao = async () => {
    // Incluir a implementação existente aqui
  };

  // Passa todos os estados e funções para o componente de UI
  return (
    <LoginUI
      email={email}
      setEmail={setEmail}
      senha={senha}
      setSenha={setSenha}
      secureTextEntry={secureTextEntry}
      setSecureTextEntry={setSecureTextEntry}
      loading={loading}
      testando={testando}
      handleLogin={handleLogin}
      testarConexao={testarConexao}
      navigation={navigation}
    />
  );
};

export default LoginContainer; 