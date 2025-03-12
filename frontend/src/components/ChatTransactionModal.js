import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

// Mapeamento de ícones para categorias
const ICONES_CATEGORIAS = {
  // Despesas
  'Alimentação': 'fast-food-outline',
  'Transporte': 'car-outline',
  'Moradia': 'home-outline',
  'Saúde': 'medkit-outline',
  'Educação': 'school-outline',
  'Lazer': 'game-controller-outline',
  'Supermercado': 'basket-outline',
  'Vestuário': 'shirt-outline',
  
  // Ganhos
  'Freelance': 'briefcase-outline',
  'Investimentos': 'trending-up-outline',
  'Vendas': 'cash-outline',
  'Presentes': 'gift-outline',
  
  // Salários
  'Mensal': 'calendar-outline',
  'Quinzenal': 'calendar-number-outline',
  'Semanal': 'today-outline',
  'Bônus': 'star-outline',
  'Participação': 'people-outline'
};

const ChatTransactionModal = ({ visible, onClose, tipoTransacao = 'despesa' }) => {
  // Estados
  const [etapa, setEtapa] = useState(0);
  const [mensagens, setMensagens] = useState([]);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(null);
  const [data, setData] = useState(new Date());
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarAnimacaoSucesso, setMostrarAnimacaoSucesso] = useState(false);
  
  // Obter categorias do Redux
  const categoriasRedux = useSelector(state => state?.categorias);
  
  // Referências para animações
  const scrollViewRef = useRef();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const successCheckmarkScale = useRef(new Animated.Value(0)).current;
  const successCircleOpacity = useRef(new Animated.Value(0)).current;
  
  // Formatar data para exibição
  const formatarData = (data) => {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Efeito para animação de entrada
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
      
      // Iniciar chat com primeira pergunta
      const palavraAcao = tipoTransacao === 'despesa' ? 'gastou' : 'recebeu';
      const corPalavra = tipoTransacao === 'despesa' ? '#FF0000' : '#00AA00';
      
      const primeiraMensagem = {
        id: Date.now(),
        texto: `Quanto você ${palavraAcao}?`,
        tipo: 'recebida',
        animValue: new Animated.Value(0),
        destacarPalavra: palavraAcao,
        corPalavraDestacada: corPalavra
      };
      
      setMensagens([primeiraMensagem]);
      animarMensagem(primeiraMensagem.animValue);
      setEtapa(1); // Etapa de valor
      setShowKeyboard(true);
    } else {
      // Animação de saída
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Resetar estados
      setMensagens([]);
      setValor('');
      setDescricao('');
      setCategoria(null);
      setEtapa(0);
      setShowKeyboard(false);
      setMostrarCalendario(false);
      setMostrarAnimacaoSucesso(false);
    }
  }, [visible]);
  
  // Função para animar entrada de mensagem
  const animarMensagem = (animValue) => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };
  
  // Adicionar mensagem ao chat
  const adicionarMensagem = (texto, tipo = 'recebida') => {
    const novaMensagem = {
      id: Date.now(),
      texto,
      tipo,
      animValue: new Animated.Value(0)
    };
    
    setMensagens(prev => [...prev, novaMensagem]);
    animarMensagem(novaMensagem.animValue);
    
    // Scroll para a última mensagem
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    return novaMensagem;
  };

  // Lidar com avanço nas etapas
  const avancarEtapa = () => {
    if (etapa === 1) { // Valor foi informado
      if (!valor || parseFloat(valor.replace(',', '.')) <= 0) {
        adicionarMensagem('Por favor, informe um valor válido.', 'recebida');
        return;
      }
      
      adicionarMensagem(`R$ ${valor}`, 'enviada');
      
      setTimeout(() => {
        adicionarMensagem('Qual a descrição? (opcional)', 'recebida');
        setEtapa(2); // Etapa de descrição
      }, 400);
      
    } else if (etapa === 2) { // Descrição foi informada ou pulada
      if (descricao.trim()) {
        adicionarMensagem(descricao, 'enviada');
      } else {
        adicionarMensagem('Sem descrição', 'enviada');
      }
      
      setTimeout(() => {
        adicionarMensagem('Escolha uma categoria:', 'recebida');
        setEtapa(3); // Etapa de categoria
        setShowKeyboard(false);
      }, 400);
      
    } else if (etapa === 3) { // Categoria (obrigatória)
      if (!categoria) {
        adicionarMensagem('Por favor, selecione uma categoria.', 'recebida');
        return;
      }
      
      adicionarMensagem(categoria.nome, 'enviada');
      
      setTimeout(() => {
        adicionarMensagem(`Confirma a data: ${formatarData(data)}?`, 'recebida');
        setEtapa(4); // Etapa de confirmação de data
      }, 400);
      
    } else if (etapa === 4) { // Data foi confirmada - agora mostra animação
      adicionarMensagem(formatarData(data), 'enviada');
      
      // Primeiro adicionar mensagens finais
      const tipoPalavra = tipoTransacao === 'despesa' ? 'despesa' : 'recebimento';
      
      setTimeout(() => {
        adicionarMensagem(`${tipoPalavra.charAt(0).toUpperCase() + tipoPalavra.slice(1)} adicionado(a) com sucesso!`, 'recebida');
        
        setTimeout(() => {
          const resumo = `Valor: R$ ${valor}\n${descricao ? `Descrição: ${descricao}\n` : ''}Categoria: ${categoria.nome}\nData: ${formatarData(data)}`;
          adicionarMensagem(resumo, 'resumo');
          
          // Garantir que o scroll está no final
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
            
            // Só então iniciar a animação de sucesso
            setTimeout(() => {
              animarConfirmacaoSucesso();
            }, 300);
          }, 100);
        }, 500);
      }, 400);
    }
  };

  // Animação de confirmação de sucesso
  const animarConfirmacaoSucesso = () => {
    setMostrarAnimacaoSucesso(true);
    
    Animated.sequence([
      Animated.timing(successCircleOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(successCheckmarkScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Fecha o modal após a animação
    setTimeout(() => {
      setMostrarAnimacaoSucesso(false);
      
      // Resetar valores de animação para próximo uso
      successCheckmarkScale.setValue(0);
      successCircleOpacity.setValue(0);
      
      // Diretamente fechar o modal sem adicionar mais mensagens
      onClose({
        valor: parseFloat(valor.replace(',', '.')),
        descricao: descricao || categoria.nome,
        categoria: categoria.id,
        data: data.toISOString().split('T')[0],
        tipo: tipoTransacao
      });
    }, 1800);
  };
  
  // Lidar com mudança de data no picker
  const handleDateChange = (event, selectedDate) => {
    setMostrarCalendario(false);
    if (selectedDate) {
      setData(selectedDate);
      adicionarMensagem(`Data alterada para: ${formatarData(selectedDate)}`, 'enviada');
    }
  };
  
  // Renderizar DateTimePicker de acordo com a plataforma
  const renderDatePicker = () => {
    if (!mostrarCalendario) return null;
    
    if (Platform.OS === 'android') {
      // No Android, o DateTimePicker já aparece como um modal do sistema
      return (
        <DateTimePicker
          value={data}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      );
    } else {
      // No iOS, precisamos criar nosso próprio modal
      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={mostrarCalendario}
        >
          <View style={styles.datePickerModalContainer}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Selecione uma data</Text>
                <TouchableOpacity onPress={() => setMostrarCalendario(false)}>
                  <Icon name="close" size={24} color="#A239FF" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={data}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setData(date);
                }}
                style={styles.datePicker}
              />
              <TouchableOpacity 
                style={styles.datePickerConfirmButton}
                onPress={() => {
                  setMostrarCalendario(false);
                  adicionarMensagem(`Data alterada para: ${formatarData(data)}`, 'enviada');
                }}
              >
                <Text style={styles.datePickerConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }
  };
  
  // Lidar com o botão "X" nas etapas opcionais
  const handleSkip = () => {
    if (etapa === 2) { // Descrição (opcional)
      setDescricao('');
      adicionarMensagem('Sem descrição', 'enviada');
      
      setTimeout(() => {
        adicionarMensagem('Escolha uma categoria:', 'recebida');
        setEtapa(3); // Avançar para categoria
        setShowKeyboard(false);
      }, 400);
    } else if (etapa === 4) { // Data - ao apertar X, mostra calendário
      setMostrarCalendario(true);
    }
  };
  
  // Obter categorias com base no tipo de transação (despesa ou ganho)
  const getCategoriasPorTipo = () => {
    // Categorias padrão para fallback
    const categoriasPadraoDespesas = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
                'Lazer', 'Supermercado', 'Vestuário'];
                
    const categoriasPadraoGanhos = ['Freelance', 'Investimentos', 'Vendas', 'Presentes'];
    
    // Usar categorias padrão em vez de tentar obter do Redux (que pode não estar funcionando)
    return tipoTransacao === 'despesa' ? categoriasPadraoDespesas : categoriasPadraoGanhos;
  };
  
  // Renderizar conteúdo da etapa atual
  const renderEtapaAtual = () => {
    if (etapa === 1) { // Valor (obrigatório)
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>R$</Text>
          <TextInput
            style={styles.valorInput}
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
            autoFocus
            placeholder="0,00"
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
          />
          <TouchableOpacity 
            style={[styles.botaoConfirmar, !valor ? styles.botaoDesabilitado : {}]}
            onPress={avancarEtapa}
            disabled={!valor}
          >
            <Icon name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      );
    } else if (etapa === 2) { // Descrição (opcional)
      return (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.descricaoInput}
            value={descricao}
            onChangeText={setDescricao}
            autoFocus
            placeholder="Descreva sua transação (opcional)"
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
          />
          <View style={styles.botoesContainer}>
            <TouchableOpacity 
              style={styles.botaoVoltar}
              onPress={handleSkip}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.botaoConfirmar}
              onPress={avancarEtapa}
            >
              <Icon name="checkmark" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (etapa === 3) { // Categoria (obrigatória)
      // Obter categorias para exibição
      const categoriasExibicao = getCategoriasPorTipo();
      
      return (
        <View style={styles.categoriasContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categoriasExibicao.map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoriaItem,
                  categoria?.nome === cat && styles.categoriaItemSelecionada
                ]}
                onPress={() => setCategoria({
                  id: index + 1,
                  nome: cat,
                  icone: ICONES_CATEGORIAS[cat] || 'help-circle-outline'
                })}
              >
                <Icon 
                  name={ICONES_CATEGORIAS[cat] || 'help-circle-outline'} 
                  size={24} 
                  color={categoria?.nome === cat ? 'white' : 'rgba(0, 0, 0, 0.7)'} 
                />
                <Text style={[
                  styles.categoriaNome,
                  categoria?.nome === cat && styles.categoriaNomeSelecionada
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.botoesContainer}>
            <TouchableOpacity 
              style={[styles.botaoConfirmar, !categoria ? styles.botaoDesabilitado : {}]}
              onPress={avancarEtapa}
              disabled={!categoria}
            >
              <Icon name="checkmark" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (etapa === 4) { // Confirmação de data
      return (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTexto}>{formatarData(data)}</Text>
          <View style={styles.botoesContainer}>
            <TouchableOpacity 
              style={styles.botaoVoltar}
              onPress={handleSkip}
            >
              <Icon name="calendar-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.botaoConfirmar}
              onPress={avancarEtapa}
            >
              <Icon name="checkmark" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return null;
  };
  
  if (!visible) return null;
  
  return (
    <>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <BlurView 
          intensity={90} 
          tint="dark" 
          style={StyleSheet.absoluteFill} 
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.innerContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => onClose()}
          >
            <Icon name="close-circle" size={32} color="white" />
          </TouchableOpacity>
          
          <View style={styles.chatContainer}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.mensagensContainer}
              contentContainerStyle={styles.mensagensContent}
            >
              {mensagens.map((msg) => (
                <Animated.View 
                  key={msg.id}
                  style={[
                    styles.mensagem,
                    msg.tipo === 'enviada' ? styles.mensagemEnviada : 
                    msg.tipo === 'resumo' ? styles.mensagemResumo : styles.mensagemRecebida,
                    {
                      opacity: msg.animValue,
                      transform: [
                        { 
                          translateY: msg.animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  {msg.destacarPalavra ? (
                    <Text 
                      style={[
                        styles.mensagemTexto,
                        msg.tipo === 'enviada' ? styles.mensagemTextoEnviada : 
                        msg.tipo === 'resumo' ? styles.mensagemTextoResumo : styles.mensagemTextoRecebida
                      ]}
                    >
                      Quanto você <Text style={{ color: msg.corPalavraDestacada, fontWeight: 'bold' }}>{msg.destacarPalavra}</Text>?
                    </Text>
                  ) : (
                    <Text 
                      style={[
                        styles.mensagemTexto,
                        msg.tipo === 'enviada' ? styles.mensagemTextoEnviada : 
                        msg.tipo === 'resumo' ? styles.mensagemTextoResumo : styles.mensagemTextoRecebida
                      ]}
                    >
                      {msg.texto}
                    </Text>
                  )}
                </Animated.View>
              ))}
            </ScrollView>
            
            <View style={styles.inputArea}>
              {renderEtapaAtual()}
            </View>
          </View>
        </KeyboardAvoidingView>
        
        {/* Animação de Confirmação de Sucesso */}
        {mostrarAnimacaoSucesso && (
          <View style={styles.successAnimationContainer}>
            <Animated.View 
              style={[
                styles.successCircle,
                { opacity: successCircleOpacity }
              ]}
            >
              <Animated.View style={{
                transform: [{ scale: successCheckmarkScale }]
              }}>
                <Icon name="checkmark" size={80} color="white" />
              </Animated.View>
            </Animated.View>
          </View>
        )}
      </Animated.View>
      
      {/* DateTimePicker renderizado fora da hierarquia principal */}
      {renderDatePicker()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  chatContainer: {
    flex: 1,
    marginTop: 80,
    justifyContent: 'space-between',
  },
  mensagensContainer: {
    flex: 1,
    marginBottom: 20,
  },
  mensagensContent: {
    paddingVertical: 10,
  },
  mensagem: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 20,
    marginVertical: 8,
    minWidth: 120,
  },
  mensagemRecebida: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  mensagemEnviada: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    borderBottomRightRadius: 4,
  },
  mensagemResumo: {
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 15,
    marginBottom: 15,
    padding: 20,
    width: '90%',
  },
  mensagemTexto: {
    fontSize: 16,
    lineHeight: 22,
  },
  mensagemTextoRecebida: {
    color: 'black',
    fontWeight: '500',
  },
  mensagemTextoEnviada: {
    color: 'black',
    fontWeight: '500',
  },
  mensagemTextoResumo: {
    color: 'black',
    fontWeight: '500',
  },
  inputArea: {
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  inputLabel: {
    color: 'black',
    fontSize: 18,
    marginRight: 5,
    fontWeight: '500',
  },
  valorInput: {
    flex: 1,
    color: 'black',
    fontSize: 22,
    padding: 12,
  },
  descricaoInput: {
    flex: 1,
    color: 'black',
    fontSize: 16,
    padding: 12,
  },
  botoesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  botaoConfirmar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A239FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesabilitado: {
    backgroundColor: 'rgba(162, 57, 255, 0.5)',
  },
  categoriasContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
  },
  categoriaItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    margin: 10,
    padding: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoriaItemSelecionada: {
    backgroundColor: 'rgba(162, 57, 255, 0.8)',
  },
  categoriaNome: {
    color: 'black',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  categoriaNomeSelecionada: {
    color: 'white',
    fontWeight: 'bold',
  },
  dataContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataTexto: {
    color: 'black',
    fontSize: 18,
    flex: 1,
    paddingLeft: 15,
    fontWeight: '500',
  },
  successAnimationContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 2000,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#A239FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 3000,
  },
  datePickerContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  datePickerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  datePicker: {
    width: '100%',
  },
  datePickerConfirmButton: {
    marginTop: 20,
    backgroundColor: '#A239FF',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  datePickerConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mensagemErro: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChatTransactionModal; 