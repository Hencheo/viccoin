import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Text } from 'react-native-paper';
import theme from '../../styles/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { TextInput as RNTextInput } from 'react-native';

/**
 * Componente puramente visual para a tela de login
 * Implementa o novo design sem alterar a lógica existente
 */
const LoginUI = ({
  email,
  setEmail,
  senha,
  setSenha,
  secureTextEntry,
  setSecureTextEntry,
  loading,
  testando,
  handleLogin,
  testarConexao,
  navigation
}) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.ui.statusBar} barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.logoText}>VicCoin</Text>
        <Text style={styles.subtitleText}>Gestão Financeira Inteligente</Text>
      </View>
      
      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Login</Text>
        
        {/* Campo de Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={24} color={theme.colors.text.primary} style={styles.inputIcon} />
          <View style={styles.textInputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#999999"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>
        
        {/* Campo de Senha */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.colors.text.primary} style={styles.inputIcon} />
          <View style={styles.textInputWrapper}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={senha}
                onChangeText={setSenha}
                placeholder="Sua senha"
                placeholderTextColor="#999999"
                secureTextEntry={secureTextEntry}
              />
              <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)} style={styles.eyeIcon}>
                <Ionicons 
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={24} 
                  color={theme.colors.text.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Botão de Login */}
        <Button
          title="Entrar"
          onPress={handleLogin}
          style={styles.loginButton}
          loading={loading}
          disabled={loading || testando}
        />
        
        {/* Botão de Testar Conexão */}
        <Button
          title="Testar Conexão com API"
          type="outline"
          onPress={testarConexao}
          style={styles.testButton}
          loading={testando}
          disabled={loading || testando}
        />
      </Card>
      
      {/* Rodapé com link para cadastro */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Não tem uma conta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.footerLink}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente TextInput personalizado para evitar dependência da versão completa do Paper
const TextInput = ({ style, onChangeText, value, placeholder, placeholderTextColor, secureTextEntry, ...props }) => (
  <View>
    <RNTextInput
      style={{
        ...styles.textInputBase,
        ...style,
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.accent.main,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  formCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  textInputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.text.primary,
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    color: theme.colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#666666',
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {
    padding: theme.spacing.sm,
  },
  loginButton: {
    marginTop: theme.spacing.lg,
  },
  testButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.text.primary,
  },
  footerLink: {
    color: theme.colors.accent.main,
    fontWeight: 'bold',
  },
  textInputBase: {
    backgroundColor: 'transparent',
    width: '100%',
    borderWidth: 0,
    outlineWidth: 0,
    color: theme.colors.text.primary,
  },
});

export default LoginUI; 