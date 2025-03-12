import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  Alert,
  FlatList,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { financasService } from '../services/api';
import { formatarMoeda } from '../utils/formatters';
import Animated from 'react-native-reanimated';
import {
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing,
  interpolateColor,
  useAnimatedGestureHandler,
  runOnJS
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  State
} from 'react-native-gesture-handler';
// Importando os ícones SVG personalizados
import { MastercardLogo } from '../assets/CardIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importando o AppBottomBar
import AppBottomBar, { handleScroll } from '../components/AppBottomBar';
// Importando o novo componente de chat para transações
import ChatTransactionModal from '../components/ChatTransactionModal';
// Importando os templates de cartões
import { CARD_TEMPLATES, TextoGravado, CardText } from '../components/CardTemplates';

// Importando dummyChartData de forma segura (sem depender de bibliotecas de gráficos por enquanto)
const dummyChartData = [4000, 6000, 5500, 8000, 7000, 9000, 8500, 10000, 9500, 8000, 11000, 12000];

const { width, height } = Dimensions.get('window');

// Função para obter o nome do mês atual em português
const getMesAtual = () => {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 
    'Maio', 'Junho', 'Julho', 'Agosto', 
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dataAtual = new Date();
  return meses[dataAtual.getMonth()];
};

// Configuração de animações
const ANIMATION_CONFIG = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1)
};

function HomeScreen({ navigation }) {
  const user = useSelector(state => state.auth.user);
  const [saudacao, setSaudacao] = useState('');
  const [saldoDisponivel, setSaldoDisponivel] = useState(0);
  const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(getMesAtual());
  // Novo estado para controlar se deve mostrar a dica de personalização
  const [showCustomizeTip, setShowCustomizeTip] = useState(true);
  
  // Adicionando estado para armazenar o insight atual
  const [currentInsight, setCurrentInsight] = useState(null);
  
  // Valores animados para as transições
  const progressValue = useSharedValue(0);
  const despesaButtonActive = useSharedValue(0);
  const ganhoButtonActive = useSharedValue(0);
  const addButtonScale = useSharedValue(1);
  const addButtonColorValue = useSharedValue(0);
  
  const maxSaldo = 10000; // Valor máximo para cálculo da porcentagem

  // Estado para controlar a visibilidade do modal de transação
  const [chatModalVisible, setChatModalVisible] = useState(false);

  // Adicionar estados para o carrossel de cartões
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [showCardCarousel, setShowCardCarousel] = useState(false);
  const [cardPressed, setCardPressed] = useState(false);
  
  // Valores animados para o cartão
  const cardScale = useSharedValue(1);
  const cardElevation = useSharedValue(0);
  const cardRotateY = useSharedValue(0);
  const cardShadowOpacity = useSharedValue(0.4);
  const cardXPosition = useSharedValue(0);
  
  // Ref para o FlatList do carrossel
  const carouselRef = useRef(null);
  
  // Handler para o gesto de pressão longa
  const onLongPressStateChange = (event) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      // Ativar modo carrossel
      setCardPressed(true);
      cardScale.value = withSpring(0.95);
      cardElevation.value = withSpring(20);
      cardShadowOpacity.value = withSpring(0.7);
      
      // Quando o usuário pressiona pela primeira vez, ocultar a dica permanentemente
      if (showCustomizeTip) {
        setShowCustomizeTip(false);
        // Salvar no AsyncStorage para futuras sessões
        AsyncStorage.setItem('@VicCoin:customizeTipShown', 'true');
      }
      
      // Efeito de "balanço" no cartão
      const wobble = () => {
        cardRotateY.value = withTiming(-5, { duration: 300 }, () => {
          cardRotateY.value = withTiming(5, { duration: 300 }, () => {
            cardRotateY.value = withTiming(0, { duration: 300 }, () => {
              // Depois do efeito, mostre o carrossel
              setTimeout(() => {
                setShowCardCarousel(true);
                // Fazer o cartão "flutuar" com animação
                cardScale.value = withSpring(0.85, { 
                  damping: 10, 
                  stiffness: 100 
                });
                cardElevation.value = withSpring(30);
              }, 100);
            });
          });
        });
      };
      
      wobble();
    }
  };
  
  // Função para selecionar um cartão
  const selectCard = (index) => {
    setSelectedCardIndex(index);
    
    // Animação de confirmação ao selecionar
    const selectAnimation = () => {
      cardScale.value = withSpring(0.9, { damping: 15 }, () => {
        cardScale.value = withSpring(1, { damping: 15 });
      });
      
      cardRotateY.value = withTiming(-3, { duration: 150 }, () => {
        cardRotateY.value = withTiming(3, { duration: 150 }, () => {
          cardRotateY.value = withTiming(0, { duration: 150 });
        });
      });
    };
    
    selectAnimation();
    
    // Fechar o carrossel com animação
    setTimeout(() => {
      cardElevation.value = withSpring(0);
      cardShadowOpacity.value = withSpring(0.4);
      setShowCardCarousel(false);
      setCardPressed(false);
    }, 400);
    
    // Salvar a preferência do usuário
    AsyncStorage.setItem('@VicCoin:selectedCardTemplate', CARD_TEMPLATES[index].id);
  };
  
  // Restaurar o cartão selecionado
  useEffect(() => {
    const restoreSelectedCard = async () => {
      try {
        const savedCardId = await AsyncStorage.getItem('@VicCoin:selectedCardTemplate');
        if (savedCardId) {
          const index = CARD_TEMPLATES.findIndex(card => card.id === savedCardId);
          if (index !== -1) {
            setSelectedCardIndex(index);
          }
        } else {
          // Se o usuário ainda não escolheu um cartão, defina o Nebulosa Roxa como padrão
          const defaultIndex = CARD_TEMPLATES.findIndex(card => card.id === 'nebula-purple');
          if (defaultIndex !== -1) {
            setSelectedCardIndex(defaultIndex);
            // Salvar essa preferência padrão
            AsyncStorage.setItem('@VicCoin:selectedCardTemplate', 'nebula-purple');
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar preferência de cartão:', error);
      }
    };
    
    restoreSelectedCard();
  }, []);
  
  // Verificar se a dica já foi mostrada antes
  useEffect(() => {
    const checkTipShown = async () => {
      try {
        const tipShown = await AsyncStorage.getItem('@VicCoin:customizeTipShown');
        if (tipShown === 'true') {
          setShowCustomizeTip(false);
        }
      } catch (error) {
        console.error('Erro ao verificar status da dica:', error);
      }
    };
    
    checkTipShown();
  }, []);
  
  // Estilos animados para o cartão
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: cardScale.value },
        { rotateY: `${cardRotateY.value}deg` },
        { translateX: cardXPosition.value }
      ],
      shadowOpacity: cardShadowOpacity.value,
      elevation: cardElevation.value,
      zIndex: cardPressed ? 100 : 1,
    };
  });

  // Função para confirmar logout
  const handleLogout = () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Sim, sair", 
          onPress: () => {
            // Implementar lógica de logout com Redux
            AsyncStorage.clear();
            // Navegar para a tela de login
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } 
        }
      ]
    );
  };

  // Definir a saudação baseada na hora do dia
  useEffect(() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      setSaudacao('Bom dia');
    } else if (hora >= 12 && hora < 18) {
      setSaudacao('Boa tarde');
    } else {
      setSaudacao('Boa noite');
    }
  }, []);

  // Função para gerar insights personalizados baseados nas transações
  const gerarInsights = useCallback(() => {
    if (!transacoes || transacoes.length === 0 || !resumoFinanceiro) {
      // Insight padrão caso não haja dados suficientes
      return {
        titulo: 'Adicione suas transações',
        descricao: 'Comece a registrar suas despesas e ganhos para ver insights personalizados',
        icone: 'bulb-outline',
        tipo: 'neutro',
        categoria: null
      };
    }
    
    const insights = [];
    
    // 1. Identificar categoria com maior gasto
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    const gastosPorCategoria = {};
    
    despesas.forEach(despesa => {
      if (!gastosPorCategoria[despesa.categoria]) {
        gastosPorCategoria[despesa.categoria] = 0;
      }
      gastosPorCategoria[despesa.categoria] += parseFloat(despesa.valor);
    });
    
    let maiorCategoria = null;
    let maiorValor = 0;
    
    Object.keys(gastosPorCategoria).forEach(categoria => {
      if (gastosPorCategoria[categoria] > maiorValor) {
        maiorValor = gastosPorCategoria[categoria];
        maiorCategoria = categoria;
      }
    });
    
    if (maiorCategoria) {
      insights.push({
        titulo: `Alto gasto em ${maiorCategoria}`,
        descricao: `Você gastou R$${maiorValor.toFixed(2)} em ${maiorCategoria} recentemente`,
        icone: obterIconeCategoria(maiorCategoria),
        tipo: 'alerta',
        categoria: maiorCategoria
      });
    }
    
    // 2. Verificar proporção de gastos em relação à receita
    if (resumoFinanceiro.totalGanhos && resumoFinanceiro.totalDespesas) {
      const proporcao = (resumoFinanceiro.totalDespesas / resumoFinanceiro.totalGanhos) * 100;
      
      if (proporcao > 80) {
        insights.push({
          titulo: 'Alerta de orçamento',
          descricao: `Seus gastos representam ${proporcao.toFixed(0)}% da sua renda mensal`,
          icone: 'warning-outline',
          tipo: 'negativo',
          categoria: null
        });
      } else if (proporcao < 50) {
        insights.push({
          titulo: 'Economizando bem!',
          descricao: `Você está gastando apenas ${proporcao.toFixed(0)}% da sua renda. Continue assim!`,
          icone: 'trending-up-outline',
          tipo: 'positivo',
          categoria: null
        });
      }
    }
    
    // 3. Verificar transações recentes de valores significativos
    const transacoesRecentes = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    if (transacoesRecentes.length > 0) {
      const ultimaTransacao = transacoesRecentes[0];
      if (ultimaTransacao.tipo === 'despesa' && parseFloat(ultimaTransacao.valor) > 200) {
        insights.push({
          titulo: 'Despesa significativa',
          descricao: `Gasto recente de R$${parseFloat(ultimaTransacao.valor).toFixed(2)} em ${ultimaTransacao.categoria}`,
          icone: 'alert-circle-outline',
          tipo: 'alerta',
          categoria: ultimaTransacao.categoria
        });
      }
    }
    
    // 4. Analisar frequência de gastos em categorias
    const categoriaFrequente = {};
    despesas.forEach(d => {
      if (!categoriaFrequente[d.categoria]) {
        categoriaFrequente[d.categoria] = 0;
      }
      categoriaFrequente[d.categoria]++;
    });
    
    let maisFrequente = null;
    let maiorFrequencia = 0;
    
    Object.keys(categoriaFrequente).forEach(cat => {
      if (categoriaFrequente[cat] > maiorFrequencia) {
        maiorFrequencia = categoriaFrequente[cat];
        maisFrequente = cat;
      }
    });
    
    if (maisFrequente && maiorFrequencia >= 3) {
      insights.push({
        titulo: `Categoria frequente`,
        descricao: `Você teve ${maiorFrequencia} transações em ${maisFrequente} recentemente`,
        icone: obterIconeCategoria(maisFrequente),
        tipo: 'neutro',
        categoria: maisFrequente
      });
    }
    
    // Retornar um insight aleatório da lista
    return insights.length > 0 
      ? insights[Math.floor(Math.random() * insights.length)]
      : {
          titulo: 'Analisar seus gastos',
          descricao: 'Veja relatórios detalhados sobre suas finanças para economizar mais',
          icone: 'analytics-outline',
          tipo: 'neutro',
          categoria: null
        };
  }, [transacoes, resumoFinanceiro]);
  
  // Função para obter ícone baseado na categoria
  const obterIconeCategoria = (categoria) => {
    const icones = {
      'Alimentação': 'fast-food-outline',
      'Moradia': 'home-outline',
      'Transporte': 'car-sport-outline',
      'Lazer': 'game-controller-outline',
      'Saúde': 'medical-outline',
      'Educação': 'school-outline',
      'Compras': 'cart-outline',
      'Viagem': 'airplane-outline',
      'Tecnologia': 'hardware-chip-outline',
      'Salário': 'cash-outline',
      'Investimentos': 'trending-up-outline',
      'Freelance': 'briefcase-outline',
      'Vestuário': 'shirt-outline',
      'Serviços': 'construct-outline',
      'Supermercado': 'basket-outline',
      'Entretenimento': 'film-outline',
      'Utilidades': 'flash-outline'
    };
    
    return icones[categoria] || 'help-circle-outline';
  };
  
  // Obter cor baseada no tipo do insight
  const obterCorInsight = (tipo) => {
    switch (tipo) {
      case 'positivo': return '#4CAF50';
      case 'negativo': return '#F44336';
      case 'alerta': return '#FF9800';
      default: return '#A239FF';
    }
  };

  // Carregar dados financeiros e gerar insight
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);

      // Verificar se há token de autenticação
      const verificarAutenticacao = async () => {
        try {
          const token = await AsyncStorage.getItem('@VicCoin:token');
          return !!token; // Retorna true se o token existir
        } catch (error) {
          console.log('Aviso: Erro ao verificar token:', error.message);
          return false;
        }
      };

      try {
        // Verificar autenticação antes de fazer as chamadas
        const autenticado = await verificarAutenticacao();
        if (!autenticado) {
          console.log('Aviso: Usuário não autenticado. Usando dados de exemplo.');
          // Usar dados de exemplo para demonstração
          exibirDadosExemplo();
          return;
        }

        try {
          // Obter resumo financeiro
          const resumoData = await financasService.obterResumoFinanceiro();
          
          if (resumoData && resumoData.success) {
            console.log('Resumo financeiro carregado com sucesso');
            setResumoFinanceiro(resumoData);
            
            // Calcular saldo disponível
            // Garantir que os valores sejam números
            const totalGanhos = parseFloat(resumoData.totalGanhos || 0);
            const totalDespesas = parseFloat(resumoData.totalDespesas || 0);
            
            console.log(`Ganhos: ${totalGanhos}, Despesas: ${totalDespesas}`);
            
            const saldoAtual = totalGanhos - totalDespesas;
            
            setSaldoDisponivel(saldoAtual);
            
            // Animar a barra de progresso
            const percentual = Math.min(Math.max(saldoAtual / maxSaldo, 0), 1);
            progressValue.value = withTiming(percentual, { 
              duration: 1000,
              easing: Easing.bezier(0.4, 0, 0.2, 1)
            });

            // Atualização: Gerar insight depois de carregar os dados
            setTimeout(() => {
              const insight = gerarInsights();
              setCurrentInsight(insight);
            }, 500);
          } else {
            console.log('Aviso: Resposta do resumo financeiro sem sucesso. Usando dados de exemplo.');
            // Definir valores padrão se não houver resposta de sucesso
            exibirDadosExemplo();
          }
        } catch (error) {
          console.log('Aviso: Erro ao carregar resumo financeiro. Usando dados de exemplo:', error.message);
          exibirDadosExemplo();
        }
        
        try {
          // Obter transações recentes
          const transacoesData = await financasService.listarTransacoes(null, 5);
          if (transacoesData && transacoesData.success) {
            console.log('Transações carregadas com sucesso');
            setTransacoes(transacoesData.transacoes || []);
          } else {
            console.log('Aviso: Resposta das transações sem sucesso. Usando lista vazia.');
            setTransacoes([]);
          }
        } catch (error) {
          console.log('Aviso: Erro ao carregar transações. Usando lista vazia:', error.message);
          setTransacoes([]);
        }
      } catch (error) {
        console.log('Aviso: Erro geral ao carregar dados financeiros. Usando dados de exemplo:', error.message);
        // Usar dados de exemplo mesmo em caso de erro
        exibirDadosExemplo();
      } finally {
        setLoading(false);
      }
    };
    
    // Função para exibir dados de exemplo quando não conseguir conectar
    const exibirDadosExemplo = () => {
      // Dados de exemplo para mostrar quando não há conexão com o backend
      const dadosExemplo = {
        totalGanhos: 5600,
        totalDespesas: 3200
      };
      
      setResumoFinanceiro(dadosExemplo);
      setSaldoDisponivel(dadosExemplo.totalGanhos - dadosExemplo.totalDespesas);
      const percentual = Math.min((dadosExemplo.totalGanhos - dadosExemplo.totalDespesas) / maxSaldo, 1);
      progressValue.value = withTiming(percentual, { 
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      });
      
      // Transações de exemplo
      setTransacoes([
        {
          id: 'exemplo1',
          tipo: 'ganho',
          descricao: 'Salário',
          valor: 4000,
          data: new Date().toISOString().split('T')[0],
          categoria: 'Salário'
        },
        {
          id: 'exemplo2',
          tipo: 'ganho',
          descricao: 'Freelance',
          valor: 1600,
          data: new Date().toISOString().split('T')[0],
          categoria: 'Freelance'
        },
        {
          id: 'exemplo3',
          tipo: 'despesa',
          descricao: 'Aluguel',
          valor: 1500,
          data: new Date().toISOString().split('T')[0],
          categoria: 'Moradia'
        },
        {
          id: 'exemplo4',
          tipo: 'despesa',
          descricao: 'Mercado',
          valor: 800,
          data: new Date().toISOString().split('T')[0],
          categoria: 'Alimentação'
        },
        {
          id: 'exemplo5',
          tipo: 'despesa',
          descricao: 'Conta de luz',
          valor: 250,
          data: new Date().toISOString().split('T')[0],
          categoria: 'Utilidades'
        }
      ]);
    };
    
    carregarDados();
  }, []);

  // Estilo animado para a barra de progresso
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });

  // Filtrar transações por tipo
  const [tipoFiltro, setTipoFiltro] = useState(null);
  
  // Atualiza os valores animados quando o filtro muda
  useEffect(() => {
    despesaButtonActive.value = withTiming(
      tipoFiltro === 'despesa' ? 1 : 0, 
      ANIMATION_CONFIG
    );
    
    ganhoButtonActive.value = withTiming(
      tipoFiltro === 'ganho' ? 1 : 0, 
      ANIMATION_CONFIG
    );
    
    // Anima o botão de adicionar
    const anyFilterActive = tipoFiltro === 'despesa' || tipoFiltro === 'ganho';
    addButtonScale.value = withSpring(
      anyFilterActive ? 1.2 : 1, 
      { 
        damping: 15, 
        stiffness: 120,
        mass: 0.8
      }
    );
    
    addButtonColorValue.value = withTiming(
      anyFilterActive ? 1 : 0, 
      ANIMATION_CONFIG
    );
    
  }, [tipoFiltro]);
  
  const transacoesFiltradas = tipoFiltro
    ? transacoes.filter(transacao => transacao.tipo === tipoFiltro)
    : transacoes;

  // Estilos animados para os botões
  const despesaButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      despesaButtonActive.value,
      [0, 1],
      ['#FFFFFF', '#A239FF']
    );
    
    return {
      backgroundColor,
      transform: [
        { scale: 1 + despesaButtonActive.value * 0.05 }
      ]
    };
  });
  
  const despesaTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      despesaButtonActive.value,
      [0, 1],
      ['#121212', '#FFFFFF']
    );
    
    return {
      color
    };
  });
  
  const ganhoButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      ganhoButtonActive.value,
      [0, 1],
      ['#FFFFFF', '#A239FF']
    );
    
    return {
      backgroundColor,
      transform: [
        { scale: 1 + ganhoButtonActive.value * 0.05 }
      ]
    };
  });
  
  const ganhoTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      ganhoButtonActive.value,
      [0, 1],
      ['#121212', '#FFFFFF']
    );
    
    return {
      color
    };
  });
  
  const addButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      addButtonColorValue.value,
      [0, 1],
      ['#333333', '#A239FF']
    );
    
    return {
      backgroundColor,
      width: 45 + addButtonColorValue.value * 7,
      height: 45 + addButtonColorValue.value * 7,
      borderRadius: 22.5 + addButtonColorValue.value * 3.5,
      transform: [
        { scale: addButtonScale.value }
      ],
      shadowOpacity: 0.2 + addButtonColorValue.value * 0.4,
      elevation: 3 + addButtonColorValue.value * 5,
    };
  });
  
  const addButtonGlowStyle = useAnimatedStyle(() => {
    const opacity = addButtonColorValue.value * 0.4;
    
    return {
      opacity,
      transform: [
        { scale: 1 + addButtonColorValue.value * 0.1 }
      ]
    };
  });

  // Garantir valores de resumo mesmo se não existirem
  const despesasTotal = parseFloat(resumoFinanceiro?.totalDespesas || 0);
  const ganhosTotal = parseFloat(resumoFinanceiro?.totalGanhos || 0);
  
  // Certificar-se de que saldoDisponivel está calculado corretamente
  useEffect(() => {
    const calculatedSaldo = ganhosTotal - despesasTotal;
    if (saldoDisponivel !== calculatedSaldo) {
      setSaldoDisponivel(calculatedSaldo);
    }
  }, [ganhosTotal, despesasTotal]);

  // Função para verificar se o usuário é novo (sem valores registrados)
  const isNovoUsuario = () => {
    return (
      transacoes.length === 0 && 
      despesasTotal === 0 && 
      ganhosTotal === 0
    );
  };

  // Função para lidar com a adição de uma nova transação
  const handleAddTransaction = (transacao = null) => {
    setChatModalVisible(false);
    
    if (!transacao) return;
    
    console.log('Nova transação:', transacao);
    
    // Atualizar a lista de transações localmente (para demonstração)
    const novaTransacao = {
      id: `local-${Date.now()}`,
      ...transacao
    };
    
    setTransacoes(prev => [novaTransacao, ...prev]);
    
    // Atualizar o resumo financeiro
    if (transacao.tipo === 'despesa') {
      const novaDespesa = resumoFinanceiro.totalDespesas + transacao.valor;
      setResumoFinanceiro(prev => ({
        ...prev,
        totalDespesas: novaDespesa
      }));
      
      // Atualizar saldo e progresso
      const novoSaldo = ganhosTotal - novaDespesa;
      setSaldoDisponivel(novoSaldo);
      const percentual = Math.min(Math.max(novoSaldo / maxSaldo, 0), 1);
      progressValue.value = withTiming(percentual, { 
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      });
    } else if (transacao.tipo === 'ganho') {
      const novoGanho = resumoFinanceiro.totalGanhos + transacao.valor;
      setResumoFinanceiro(prev => ({
        ...prev,
        totalGanhos: novoGanho
      }));
      
      // Atualizar saldo e progresso
      const novoSaldo = novoGanho - despesasTotal;
      setSaldoDisponivel(novoSaldo);
      const percentual = Math.min(Math.max(novoSaldo / maxSaldo, 0), 1);
      progressValue.value = withTiming(percentual, { 
        duration: 1000,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      });
    }
  };

  // Renderizar o template do cartão atual
  const renderSelectedCard = () => {
    const CardComponent = CARD_TEMPLATES[selectedCardIndex].component;
    
    return (
      <CardComponent
        saldoDisponivel={saldoDisponivel}
        despesasTotal={despesasTotal}
        ganhosTotal={ganhosTotal}
        mesAtual={mesAtual}
        progressValue={progressValue}
        formatarMoeda={formatarMoeda}
        progressStyle={progressStyle}
      />
    );
  };
  
  // Renderizar um item do carrossel
  const renderCarouselItem = ({ item, index }) => {
    const isSelected = index === selectedCardIndex;
    const CardComponent = item.component;
    
    return (
      <Pressable 
        style={[
          styles.carouselItemContainer,
          isSelected && styles.carouselItemSelected
        ]}
        onPress={() => selectCard(index)}
      >
        <View style={styles.carouselItem}>
          <CardComponent
            saldoDisponivel={saldoDisponivel}
            despesasTotal={despesasTotal}
            ganhosTotal={ganhosTotal}
            mesAtual={mesAtual}
            progressValue={progressValue}
            formatarMoeda={formatarMoeda}
            progressStyle={progressStyle}
          />
        </View>
        <Text style={styles.carouselItemName}>{item.name}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* ChatTransactionModal - Novo componente para adicionar transações */}
      <ChatTransactionModal 
        visible={chatModalVisible} 
        onClose={handleAddTransaction}
        tipoTransacao={tipoFiltro || 'despesa'}
      />
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: user?.avatar || 'https://ui-avatars.com/api/?name=User&background=random' }} 
            style={styles.userAvatar} 
          />
          <View style={styles.userTextInfo}>
            <Text style={styles.greeting}>{saudacao}</Text>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>{user?.nome || 'Usuário'}</Text>
              <Icon name="shield-checkmark" size={14} color="#A239FF" style={styles.verifiedIcon} />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Cartão com barra de progresso - Agora com gesture handler */}
        <LongPressGestureHandler
          onHandlerStateChange={onLongPressStateChange}
          minDurationMs={200}
        >
          <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
            {renderSelectedCard()}
            
            {/* Instrução de pressionar - agora só exibida se showCustomizeTip for true */}
            {!cardPressed && showCustomizeTip && (
              <View style={styles.pressInstructionContainer}>
                <Icon name="finger-print" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.pressInstructionText}>Pressione e segure para personalizar</Text>
              </View>
            )}
          </Animated.View>
        </LongPressGestureHandler>
        
        {/* Carrossel de seleção de cartões */}
        {showCardCarousel && (
          <View style={styles.carouselContainer}>
            <Text style={styles.carouselTitle}>Escolha seu estilo de cartão</Text>
            <Text style={styles.carouselSubtitle}>Toque para selecionar um modelo</Text>
            <FlatList
              ref={carouselRef}
              data={CARD_TEMPLATES}
              renderItem={renderCarouselItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
              initialScrollIndex={selectedCardIndex}
              getItemLayout={(data, index) => ({
                length: 170,
                offset: 170 * index,
                index,
              })}
            />
            <View style={styles.carouselIndicator}>
              {CARD_TEMPLATES.map((_, index) => (
                <View 
                  key={`indicator-${index}`} 
                  style={[
                    styles.indicatorDot,
                    index === selectedCardIndex && styles.indicatorDotActive
                  ]} 
                />
              ))}
            </View>
          </View>
        )}
        
        {/* Resto do conteúdo - desabilitado durante a exibição do carrossel */}
        {!showCardCarousel && (
          <>
            {/* Botões de ação */}
            <View style={styles.actionButtons}>
              <Animated.View style={[styles.actionButton, despesaButtonStyle]}>
                <TouchableOpacity 
                  style={styles.actionButtonTouchable}
                  onPress={() => setTipoFiltro(tipoFiltro === 'despesa' ? null : 'despesa')}
                >
                  <Icon 
                    name="arrow-down" 
                    size={20} 
                    color={tipoFiltro === 'despesa' ? "white" : "#121212"} 
                    style={styles.actionIcon} 
                  />
                  <Animated.Text style={[styles.actionText, despesaTextStyle]}>
                    Despesas
                  </Animated.Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={[styles.actionButton, ganhoButtonStyle]}>
                <TouchableOpacity 
                  style={styles.actionButtonTouchable}
                  onPress={() => setTipoFiltro(tipoFiltro === 'ganho' ? null : 'ganho')}
                >
                  <Icon 
                    name="arrow-up" 
                    size={20} 
                    color={tipoFiltro === 'ganho' ? "white" : "#121212"} 
                    style={styles.actionIcon} 
                  />
                  <Animated.Text style={[styles.actionText, ganhoTextStyle]}>
                    Ganhos
                  </Animated.Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={[styles.addButton, addButtonStyle]}>
                <TouchableOpacity 
                  style={styles.addButtonTouchable}
                  onPress={() => setChatModalVisible(true)}
                >
                  <Icon 
                    name="add" 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                {(tipoFiltro === 'despesa' || tipoFiltro === 'ganho') && (
                  <Animated.View style={[styles.addButtonGlow, addButtonGlowStyle]} />
                )}
              </Animated.View>
            </View>
            
            {/* Card de Insights (substituindo o card de relatórios) */}
            <TouchableOpacity 
              style={styles.reportsCard}
              onPress={() => navigation.navigate('Reports')}
            >
              <LinearGradient
                colors={['#1E1E1E', '#2C2C2C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reportsCardGradient}
              >
                <View style={styles.reportsCardContent}>
                  <View style={styles.reportsCardLeft}>
                    <Text style={styles.reportsCardTitle}>
                      {currentInsight?.titulo || 'Analisando seus dados...'}
                    </Text>
                    <Text style={styles.reportsCardSubtitle}>
                      {currentInsight?.descricao || 'Aguarde enquanto preparamos insights personalizados para você'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.reportsCardButton}
                      onPress={() => navigation.navigate('Reports')}
                    >
                      <Text style={styles.reportsCardButtonText}>Ver relatório completo</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.reportsCardRight}>
                    <View 
                      style={[
                        styles.reportsCardIconContainer,
                        currentInsight?.tipo ? {backgroundColor: `${obterCorInsight(currentInsight.tipo)}20`} : {}
                      ]}
                    >
                      <Icon 
                        name={currentInsight?.icone || 'stats-chart'} 
                        size={30} 
                        color={currentInsight?.tipo ? obterCorInsight(currentInsight.tipo) : '#A239FF'} 
                      />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            {/* Lista de transações */}
            <View style={styles.transactionsContainer}>
              <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>
                  {tipoFiltro === 'despesa' ? 'Despesas' : 
                   tipoFiltro === 'ganho' ? 'Ganhos' : 'Transações'}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Transactions', { filter: tipoFiltro })}>
                  <Text style={styles.seeAllText}>Ver todas</Text>
                </TouchableOpacity>
              </View>
              
              {transacoesFiltradas.length > 0 ? (
                transacoesFiltradas.map((item, index) => (
                  <View key={`transaction-${index}`} style={styles.transactionItem}>
                    <View style={styles.transactionIconContainer}>
                      <Icon 
                        name={item.tipo === 'despesa' ? 'arrow-down' : 'arrow-up'} 
                        size={20} 
                        color="white" 
                      />
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle}>{item.descricao}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                        {item.hora ? `, ${item.hora}` : ''}
                      </Text>
                    </View>
                    
                    <View style={styles.transactionAmount}>
                      <Text style={[
                        styles.transactionValue,
                        { color: item.tipo === 'despesa' ? '#FF6B6B' : '#6BFF8E' }
                      ]}>
                        {item.tipo === 'despesa' ? '-' : '+'}{formatarMoeda(item.valor)}
                      </Text>
                      <Text style={styles.transactionType}>
                        {item.tipo === 'despesa' ? 'Despesa' : 'Recebido'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Icon name="document-text-outline" size={50} color="#444" style={styles.emptyStateIcon} />
                  <Text style={styles.noTransactions}>
                    {isNovoUsuario() 
                      ? "Comece a adicionar suas transações!"
                      : (tipoFiltro ? `Nenhuma ${tipoFiltro === 'despesa' ? 'despesa' : 'ganho'} encontrado` : 'Nenhuma transação recente encontrada')
                    }
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </Animated.ScrollView>
      
      {/* Adicionando o AppBottomBar */}
      <AppBottomBar 
        navigation={navigation} 
        activeTab="home" 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 10,
    paddingBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextInfo: {
    alignItems: 'flex-start', // Alinhamento à esquerda
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  greeting: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  logoutButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120, // Aumentado para acomodar a nova posição da barra (era 90)
  },
  cardContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    height: 220,
    borderRadius: 20,
    shadowColor: '#6A36D9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    backgroundColor: 'transparent',
    borderWidth: 60,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 140,
    transform: [{ scale: 1.8 }, { rotate: '45deg' }],
  },
  cardPatternLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.07,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 15,
    borderBottomWidth: 15,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  cardPatternDots: {
    position: 'absolute',
    top: 20,
    left: 20, 
    right: 20,
    bottom: 20,
    opacity: 0.07,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
  },
  cardGlowEffect: {
    position: 'absolute',
    top: -5,
    left: 20,
    right: 20,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 50,
    transform: [{ scaleX: 0.7 }],
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTopLeft: {
    alignItems: 'flex-start',
  },
  textRcardLabel: {
    letterSpacing: 0.5,
  },
  profileIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBalance: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 1,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceItem: {
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  expenseValue: {
    color: '#FF6B6B',
  },
  incomeValue: {
    color: '#6BFF8E',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 5,
  },
  monthContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  monthLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  actionButton: {
    flex: 2,
    borderRadius: 25,
    marginRight: 10,
    overflow: 'hidden',
  },
  actionButtonTouchable: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    position: 'relative',
    overflow: 'visible',
  },
  addButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(162, 57, 255, 0.4)',
    top: -9,
    left: -9,
    zIndex: -1,
  },
  transactionsContainer: {
    marginTop: 25,
    marginHorizontal: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  transactionsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#A239FF',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: 12,
    padding: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 12,
    color: '#AAAAAA',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: 'rgba(30, 30, 40, 0.4)',
    borderRadius: 12,
  },
  emptyStateIcon: {
    marginBottom: 15,
    opacity: 0.6,
  },
  noTransactions: {
    color: '#AAAAAA',
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 20,
  },
  // Estilos para o carrossel
  pressInstructionContainer: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pressInstructionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginLeft: 4,
  },
  carouselContainer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  carouselTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  carouselSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  carouselContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  carouselItemContainer: {
    width: 170,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  carouselItem: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carouselItemSelected: {
    transform: [{scale: 1.05}],
    shadowColor: '#A239FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  carouselItemName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  carouselIndicator: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#A239FF',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  reportsCard: {
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  reportsCardGradient: {
    borderRadius: 16,
  },
  reportsCardContent: {
    padding: 15,
    flexDirection: 'row',
  },
  reportsCardLeft: {
    flex: 3,
    justifyContent: 'space-between',
  },
  reportsCardRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportsCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reportsCardSubtitle: {
    color: '#BBBBBB',
    fontSize: 13,
    marginBottom: 15,
  },
  reportsCardButton: {
    backgroundColor: 'rgba(162, 57, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  reportsCardButtonText: {
    color: '#A239FF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reportsCardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(162, 57, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen; 