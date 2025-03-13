import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

// Componente de texto simples que substitui o TextoGravado
export const CardText = ({ style, children, fontSize = 28, fontWeight = 'bold', color = 'white', fontFamily = null }) => {
  return (
    <Text 
      style={[
        { 
          fontSize, 
          fontWeight, 
          color,
          ...(fontFamily ? { fontFamily } : {})
        }, 
        style
      ]}
    >
      {children}
    </Text>
  );
};

// Cartão roxo moderno (redesign)
export const PurpleGradientCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle
}) => {
  return (
    <LinearGradient
      colors={['#6A36D9', '#8741E5', '#4C10A6']}
      style={styles.card}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
    >
      {/* Elementos decorativos */}
      <View style={styles.purpleOverlayCircle} />
      <View style={styles.purpleOverlaySmallCircle} />
      
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText fontSize={14} fontWeight="500" color="rgba(255, 255, 255, 0.8)" style={{letterSpacing: 1}}>
            SALDO DISPONÍVEL
          </CardText>
          <View style={{marginTop: 6}}>
            <CardText fontSize={28} fontWeight="bold" color="#ffffff">
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 12}]}>
          <Icon name="wallet-outline" size={24} color="rgba(255, 255, 255, 1)" />
        </View>
      </View>
      
      <View style={[styles.progressContainer, {backgroundColor: 'rgba(255, 255, 255, 0.15)', height: 8}]}>
        {progressStyle && (
          <View style={[styles.progressBar, {backgroundColor: '#ffffff', borderRadius: 4}, progressStyle]} />
        )}
      </View>
      
      {/* Valores de despesas e ganhos */}
      <View style={styles.balanceDetails}>
        <View style={styles.balanceItem}>
          <CardText fontSize={12} fontWeight="normal" color="rgba(255, 255, 255, 0.7)">
            Despesas
          </CardText>
          <CardText fontSize={18} fontWeight="600" color="#FF6B6B">
            {formatarMoeda(despesasTotal)}
          </CardText>
        </View>
        <View style={styles.balanceItem}>
          <CardText fontSize={12} fontWeight="normal" color="rgba(255, 255, 255, 0.7)">
            Ganhos
          </CardText>
          <CardText fontSize={18} fontWeight="600" color="#6BFF8E">
            {formatarMoeda(ganhosTotal)}
          </CardText>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={[styles.monthContainer, {backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 12}]}>
          <CardText fontSize={14} fontWeight="500" color="white">
            {mesAtual}
          </CardText>
        </View>
      </View>
    </LinearGradient>
  );
};

// Cartão Azul Minimalista
export const DarkBlueCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle
}) => {
  return (
    <LinearGradient
      colors={['#1A2151', '#2C3E7B', '#0F1835']}
      style={[styles.card, {borderWidth: 0}]}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
    >
      {/* Elementos decorativos */}
      <View style={styles.blueTopBorder} />
      <View style={styles.blueDotPattern} />
      
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText fontSize={13} fontWeight="400" color="rgba(255, 255, 255, 0.7)" style={{textTransform: 'uppercase'}}>
            Saldo Disponível
          </CardText>
          <View style={{marginTop: 8}}>
            <CardText fontSize={28} fontWeight="700" color="#ffffff" style={{letterSpacing: -0.5}}>
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {
          backgroundColor: 'transparent', 
          borderWidth: 1.5, 
          borderColor: 'rgba(255, 255, 255, 0.3)'
        }]}>
          <Icon name="analytics-outline" size={22} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </View>
      
      <View style={[styles.progressContainer, {backgroundColor: 'rgba(255, 255, 255, 0.1)', height: 4}]}>
        {progressStyle && <View style={[styles.progressBar, {backgroundColor: '#4FACFE'}, progressStyle]} />}
      </View>
      
      {/* Valores de despesas e ganhos abaixo da barra */}
      <View style={styles.balanceDetails}>
        <View style={[styles.balanceItem, {backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 10, borderRadius: 8}]}>
          <CardText fontSize={12} fontWeight="normal" color="rgba(255, 255, 255, 0.6)">
            DESPESAS
          </CardText>
          <CardText fontSize={18} fontWeight="600" color="#FF7E7E">
            {formatarMoeda(despesasTotal)}
          </CardText>
        </View>
        <View style={[styles.balanceItem, {backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 10, borderRadius: 8}]}>
          <CardText fontSize={12} fontWeight="normal" color="rgba(255, 255, 255, 0.6)">
            GANHOS
          </CardText>
          <CardText fontSize={18} fontWeight="600" color="#7EFFBC">
            {formatarMoeda(ganhosTotal)}
          </CardText>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={[styles.monthContainer, {
          backgroundColor: 'transparent', 
          borderWidth: 1, 
          borderColor: 'rgba(255, 255, 255, 0.2)',
          paddingVertical: 2,
          paddingHorizontal: 10,
          borderRadius: 4
        }]}>
          <CardText fontSize={14} fontWeight="400" color="rgba(255, 255, 255, 0.8)">
            {mesAtual}
          </CardText>
        </View>
      </View>
    </LinearGradient>
  );
};

// Cartão verde natureza
export const GreenGradientCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle
}) => {
  return (
    <LinearGradient
      colors={['#097969', '#3CB371', '#006400']}
      style={[styles.card, {borderColor: 'rgba(255, 255, 255, 0.1)'}]}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
    >
      {/* Elementos decorativos naturais */}
      <View style={styles.greenLeafPattern} />
      <View style={styles.greenLeafOverlay} />
      
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText fontSize={14} fontWeight="normal" color="rgba(255, 255, 255, 0.9)" style={{fontStyle: 'italic'}}>
            Saldo Disponível
          </CardText>
          <View style={{marginTop: 6}}>
            <CardText fontSize={26} fontWeight="bold" color="#ffffff" style={{letterSpacing: 0.5}}>
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 15,
          width: 42,
          height: 42
        }]}>
          <Icon name="leaf-outline" size={24} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </View>
      
      <View style={[styles.progressContainer, {
        backgroundColor: 'rgba(0, 0, 0, 0.2)', 
        height: 8,
        borderRadius: 4
      }]}>
        {progressStyle && <View style={[
          styles.progressBar, 
          {backgroundColor: '#EBFFB8', borderRadius: 4}, 
          progressStyle
        ]} />}
      </View>
      
      {/* Valores de despesas e ganhos abaixo da barra */}
      <View style={styles.balanceDetails}>
        <View style={styles.balanceItem}>
          <CardText fontSize={12} fontWeight="normal" color="#D8FFC2" style={{opacity: 0.9}}>
            Despesas
          </CardText>
          <CardText fontSize={18} fontWeight="600" color="#FF9B9B" style={{textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2}}>
            {formatarMoeda(despesasTotal)}
          </CardText>
        </View>
        <View style={styles.balanceItem}>
          <CardText fontSize={12} fontWeight="normal" color="#D8FFC2" style={{opacity: 0.9}}>
            Ganhos
          </CardText>
          <CardText fontSize={18} fontWeight="600" color="#EBFFB8" style={{textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2}}>
            {formatarMoeda(ganhosTotal)}
          </CardText>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={[styles.monthContainer, {
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 20,
          paddingVertical: 5,
          paddingHorizontal: 14
        }]}>
          <CardText fontSize={14} fontWeight="500" color="rgba(255, 255, 255, 0.95)" style={{fontStyle: 'italic'}}>
            {mesAtual}
          </CardText>
        </View>
      </View>
    </LinearGradient>
  );
};

// Cartão metálico
export const MetallicCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle
}) => {
  return (
    <LinearGradient
      colors={['#333333', '#505050', '#222222']}
      style={[styles.card, {borderWidth: 0}]}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
    >
      {/* Efeitos metálicos */}
      <View style={styles.metallicShineLine} />
      <View style={styles.metallicOverlay} />
      <View style={styles.metallicBottomLine} />
      
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText fontSize={12} fontWeight="600" color="#C0C0C0" style={{letterSpacing: 2, textTransform: 'uppercase'}}>
            Saldo Disponível
          </CardText>
          <View style={{marginTop: 8}}>
            <CardText fontSize={30} fontWeight="700" color="#E0E0E0" style={{letterSpacing: -0.5}}>
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {
          backgroundColor: '#777777',
          borderRadius: 5,
          width: 38,
          height: 38
        }]}>
          <Icon name="card-outline" size={20} color="#E0E0E0" />
        </View>
      </View>
      
      <View style={[styles.progressContainer, {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        height: 3,
        borderRadius: 1.5
      }]}>
        {progressStyle && <View style={[
          styles.progressBar, 
          {backgroundColor: '#E0E0E0', borderRadius: 1.5}, 
          progressStyle
        ]} />}
      </View>
      
      {/* Valores de despesas e ganhos */}
      <View style={styles.balanceDetails}>
        <View style={[styles.balanceItem, {borderLeftWidth: 3, borderLeftColor: '#FF9C9C', paddingLeft: 8}]}>
          <CardText fontSize={11} fontWeight="600" color="#AAAAAA" style={{letterSpacing: 1, textTransform: 'uppercase'}}>
            Despesas
          </CardText>
          <CardText fontSize={18} fontWeight="700" color="#FF9C9C">
            {formatarMoeda(despesasTotal)}
          </CardText>
        </View>
        <View style={[styles.balanceItem, {borderLeftWidth: 3, borderLeftColor: '#B3FFD8', paddingLeft: 8}]}>
          <CardText fontSize={11} fontWeight="600" color="#AAAAAA" style={{letterSpacing: 1, textTransform: 'uppercase'}}>
            Ganhos
          </CardText>
          <CardText fontSize={18} fontWeight="700" color="#B3FFD8">
            {formatarMoeda(ganhosTotal)}
          </CardText>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={[styles.monthContainer, {
          backgroundColor: '#777777',
          borderRadius: 2,
          paddingVertical: 3,
          paddingHorizontal: 10
        }]}>
          <CardText fontSize={13} fontWeight="600" color="#ffffff" style={{letterSpacing: 1}}>
            {mesAtual.toUpperCase()}
          </CardText>
        </View>
      </View>
    </LinearGradient>
  );
};

// Cartão Black Premium
export const BlackGoldCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle
}) => {
  return (
    <LinearGradient
      colors={['#111111', '#0A0A0A', '#000000']}
      style={[styles.card, {borderWidth: 0.5, borderColor: '#333333'}]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Elementos decorativos minimalistas */}
      <View style={styles.blackCardCorner} />
      <View style={styles.goldAccent} />
      
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText 
            fontSize={11} 
            fontWeight="300" 
            color="#D4AF37" 
            style={{letterSpacing: 3, textTransform: 'uppercase'}}
          >
            Saldo Disponível
          </CardText>
          <View style={{marginTop: 10}}>
            <CardText 
              fontSize={32} 
              fontWeight="200" 
              color="#FBD87F" 
              style={{letterSpacing: 1}}
            >
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {
          backgroundColor: 'transparent', 
          borderWidth: 1,
          borderColor: '#D4AF37',
          width: 45,
          height: 45
        }]}>
          <Icon name="diamond-outline" size={22} color="#D4AF37" />
        </View>
      </View>
      
      <View style={[styles.progressContainer, {
        backgroundColor: 'rgba(212, 175, 55, 0.1)', 
        height: 2,
        borderRadius: 1,
        marginTop: 25
      }]}>
        {progressStyle && <View style={[
          styles.progressBar, 
          {backgroundColor: '#D4AF37', borderRadius: 1}, 
          progressStyle
        ]} />}
      </View>
      
      <View style={styles.blackCardDivider} />
      
      {/* Valores de despesas e ganhos */}
      <View style={styles.balanceDetails}>
        <View style={styles.balanceItem}>
          <CardText 
            fontSize={10} 
            fontWeight="300" 
            color="#A9A9A9" 
            style={{letterSpacing: 2, textTransform: 'uppercase'}}
          >
            Despesas
          </CardText>
          <CardText 
            fontSize={18} 
            fontWeight="200" 
            color="#C59A4E"
          >
            {formatarMoeda(despesasTotal)}
          </CardText>
        </View>
        <View style={styles.balanceItem}>
          <CardText 
            fontSize={10} 
            fontWeight="300" 
            color="#A9A9A9" 
            style={{letterSpacing: 2, textTransform: 'uppercase'}}
          >
            Ganhos
          </CardText>
          <CardText 
            fontSize={18} 
            fontWeight="200" 
            color="#C59A4E"
          >
            {formatarMoeda(ganhosTotal)}
          </CardText>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={[styles.monthContainer, {
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: '#D4AF37',
          paddingVertical: 3,
          paddingHorizontal: 1,
          borderRadius: 0
        }]}>
          <CardText 
            fontSize={12} 
            fontWeight="300" 
            color="#D4AF37" 
            style={{letterSpacing: 2}}
          >
            {mesAtual.toUpperCase()}
          </CardText>
        </View>
      </View>
    </LinearGradient>
  );
};

// Cartão Azul Turquesa estilo cartão de visita
export const TurquoiseBusinessCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle
}) => {
  return (
    <LinearGradient
      colors={['#20B2AA', '#48D1CC', '#008B8B']}
      style={[styles.card, {borderWidth: 0}]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Elementos decorativos estilo cartão de visita */}
      <View style={styles.turquoiseCardBorder} />
      <View style={styles.turquoiseDiagonalLine} />
      <View style={styles.turquoiseCornerAccent} />
      
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText 
            fontSize={12} 
            fontWeight="400" 
            color="#E8F8F5" 
            style={{letterSpacing: 2, textTransform: 'uppercase'}}
          >
            Saldo Disponível
          </CardText>
          <View style={{marginTop: 8}}>
            <CardText 
              fontSize={28} 
              fontWeight="600" 
              color="#FFFFFF"
              style={{letterSpacing: 0.5}}
            >
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {
          backgroundColor: '#006D6D', 
          width: 42,
          height: 42,
          borderRadius: 8
        }]}>
          <Icon name="business-outline" size={22} color="#E8F8F5" />
        </View>
      </View>
      
      <View style={[styles.progressContainer, {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
        height: 4,
        borderRadius: 2,
        marginTop: 20
      }]}>
        {progressStyle && <View style={[
          styles.progressBar, 
          {backgroundColor: '#E8F8F5', borderRadius: 2}, 
          progressStyle
        ]} />}
      </View>
      
      {/* Valores de despesas e ganhos */}
      <View style={styles.balanceDetails}>
        <View style={[styles.balanceItem, {
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: 'rgba(0, 80, 80, 0.3)',
          borderRadius: 4
        }]}>
          <CardText 
            fontSize={11} 
            fontWeight="500" 
            color="#E8F8F5" 
            style={{marginBottom: 4}}
          >
            DESPESAS
          </CardText>
          <CardText 
            fontSize={18} 
            fontWeight="400" 
            color="#FFB6C1"
          >
            {formatarMoeda(despesasTotal)}
          </CardText>
        </View>
        
        <View style={[styles.balanceItem, {
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: 'rgba(0, 80, 80, 0.3)',
          borderRadius: 4
        }]}>
          <CardText 
            fontSize={11} 
            fontWeight="500" 
            color="#E8F8F5" 
            style={{marginBottom: 4}}
          >
            GANHOS
          </CardText>
          <CardText 
            fontSize={18} 
            fontWeight="400" 
            color="#98FB98"
          >
            {formatarMoeda(ganhosTotal)}
          </CardText>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={[styles.monthContainer, {
          backgroundColor: 'rgba(0, 80, 80, 0.5)',
          paddingVertical: 3,
          paddingHorizontal: 15,
          borderRadius: 4
        }]}>
          <CardText 
            fontSize={12} 
            fontWeight="600" 
            color="#E8F8F5"
          >
            {mesAtual}
          </CardText>
        </View>
      </View>
    </LinearGradient>
  );
};

// Cartão Roxo Nebuloso
export const NebulaPurpleCard = ({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  progressValue,
  formatarMoeda,
  progressStyle,
  transacoes = []
}) => {
  // Estado para controlar qual período está selecionado
  const [periodoSelecionado, setPeriodoSelecionado] = useState('hoje');
  
  // Função para calcular gastos por período com base em transações reais
  const calcularGastosPorPeriodo = () => {
    if (!transacoes || transacoes.length === 0) {
      return {
        hoje: 0,
        mes: despesasTotal || 0,
        ano: despesasTotal || 0
      };
    }
    
    const dataAtual = new Date();
    // Ajustar para fuso horário local para garantir que a data de hoje esteja correta
    const hojeLocal = new Date(dataAtual);
    hojeLocal.setHours(0, 0, 0, 0);
    
    const anoAtual = dataAtual.getFullYear();
    const mesAtual = dataAtual.getMonth() + 1; // Mês começa em 0
    
    // Filtrar apenas despesas
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    
    // Somar despesas de hoje - compara usando data local
    const gastosHoje = despesas
      .filter(t => {
        if (!t.data) return false;
        // Criar uma data local do registro e ajustar para o início do dia
        const dataTransacao = new Date(t.data);
        
        // Extrair apenas a data, ignorando o horário
        const diaTransacao = dataTransacao.getDate();
        const mesTransacao = dataTransacao.getMonth();
        const anoTransacao = dataTransacao.getFullYear();
        
        // Criar uma nova data com apenas dia/mês/ano, sem informações de hora
        const dataAjustada = new Date();
        dataAjustada.setFullYear(anoTransacao, mesTransacao, diaTransacao);
        dataAjustada.setHours(0, 0, 0, 0);
        
        // Comparar as datas sem considerar o horário
        return dataAjustada.getTime() === hojeLocal.getTime();
      })
      .reduce((total, t) => total + parseFloat(t.valor || 0), 0);
    
    // Somar despesas deste mês
    const gastosMes = despesas
      .filter(t => {
        if (!t.data) return false;
        const data = new Date(t.data);
        
        // Extrair apenas o mês e o ano
        const mesTransacao = data.getMonth() + 1;
        const anoTransacao = data.getFullYear();
        
        return anoTransacao === anoAtual && mesTransacao === mesAtual;
      })
      .reduce((total, t) => total + parseFloat(t.valor || 0), 0);
    
    // Somar despesas deste ano
    const gastosAno = despesas
      .filter(t => {
        if (!t.data) return false;
        const data = new Date(t.data);
        
        // Extrair apenas o ano
        const anoTransacao = data.getFullYear();
        
        return anoTransacao === anoAtual;
      })
      .reduce((total, t) => total + parseFloat(t.valor || 0), 0);
      
    console.log('Gastos calculados - Hoje:', gastosHoje, 'Mês:', gastosMes, 'Ano:', gastosAno);
    
    return {
      hoje: gastosHoje,
      mes: gastosMes || despesasTotal, // Usar despesasTotal como fallback se gastosMes for 0
      ano: gastosAno || despesasTotal  // Usar despesasTotal como fallback se gastosAno for 0
    };
  };
  
  // Calcular os gastos uma vez
  const gastos = calcularGastosPorPeriodo();
  
  // Orçamentos ajustados para serem proporcionais aos gastos (apenas para exemplo)
  const orcamentos = {
    hoje: Math.max(gastos.hoje * 1.5, 100), 
    mes: Math.max(gastos.mes * 1.2, 3000),
    ano: Math.max(gastos.ano * 1.1, 36000)
  };
  
  // Calcular a porcentagem do orçamento atingida
  const calcularPorcentagemOrcamento = () => {
    const orcamento = orcamentos[periodoSelecionado];
    const gasto = gastos[periodoSelecionado];
    
    // Se não há orçamento definido ou é zero, retornar 0
    if (!orcamento) return 0;
    
    // Calcular porcentagem (limitado a 100%)
    return Math.min(gasto / orcamento, 1);
  };
  
  // Definir a cor baseada na porcentagem do orçamento
  const definirCorGasto = () => {
    const porcentagem = calcularPorcentagemOrcamento();
    
    // Se o gasto for zero, retornar verde
    if (gastos[periodoSelecionado] === 0) return '#6BFF8E';
    
    // Mudar gradualmente de verde para amarelo e depois para vermelho
    if (porcentagem < 0.5) {
      // De verde para amarelo (0% a 50%)
      return '#6BFF8E'; // Verde para gastos baixos
    } else if (porcentagem < 0.75) {
      // De amarelo para laranja (50% a 75%)
      return '#FFD700'; // Amarelo para gastos médios
    } else if (porcentagem < 1) {
      // De laranja para vermelho (75% a 100%)
      return '#FFA500'; // Laranja para gastos altos
    } else {
      // Acima de 100%
      return '#FF4040'; // Vermelho para gastos acima do orçamento
    }
  };
  
  // Calcular valor a mostrar baseado no período selecionado
  const valorAMostrar = gastos[periodoSelecionado];
  
  // Textos para o dropdown
  const periodos = {
    hoje: 'HOJE',
    mes: 'MÊS',
    ano: 'ANO'
  };
  
  // Função para alternar entre os períodos
  const alternarPeriodo = () => {
    if (periodoSelecionado === 'hoje') {
      setPeriodoSelecionado('mes');
    } else if (periodoSelecionado === 'mes') {
      setPeriodoSelecionado('ano');
    } else {
      setPeriodoSelecionado('hoje');
    }
  };
  
  return (
    <LinearGradient
      colors={['#4B0082', '#6A36D9', '#3B0062']}
      style={[styles.card, {borderWidth: 0}]}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
    >
      {/* Efeitos de fumaça/neblina - mantidos para o efeito visual */}
      <View style={styles.nebulaSmoke1} />
      <View style={styles.nebulaSmoke2} />
      <View style={styles.nebulaSmoke3} />
      <View style={styles.nebulaGlow} />
      
      {/* Parte superior - Mês vigente em design minimalista */}
      <View style={styles.nebulaSimpleHeader}>
        <CardText 
          fontSize={14} 
          fontWeight="500" 
          color="rgba(255, 255, 255, 0.9)"
        >
          {mesAtual.toUpperCase()}
        </CardText>
      </View>
      
      {/* Saldo Disponível - mantido como principal informação */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <CardText 
            fontSize={13} 
            fontWeight="400" 
            color="rgba(255, 255, 255, 0.7)"
          >
            SALDO DISPONÍVEL
          </CardText>
          <View style={{marginTop: 6}}>
            <CardText 
              fontSize={28} 
              fontWeight="500" 
              color="#FFFFFF"
            >
              {formatarMoeda(saldoDisponivel)}
            </CardText>
          </View>
        </View>
        
        <View style={[styles.profileIconPlaceholder, {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 8
        }]}>
          <Icon name="wallet-outline" size={22} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </View>
      
      {/* Barra de progresso */}
      <View style={[styles.progressContainer, {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        height: 10,
        borderRadius: 5
      }]}>
        {progressStyle && <View style={[
          styles.progressBar, 
          {backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 5}, 
          progressStyle
        ]} />}
      </View>
      
      {/* Espaço para empurrar o dropdown para o final do cartão */}
      <View style={{ flex: 1 }} />
      
      {/* Dropdown na parte inferior esquerda */}
      <TouchableOpacity 
        style={styles.nebulaTimeDropdown}
        onPress={alternarPeriodo}
      >
        <View style={styles.nebulaTimeFilterSelector}>
          <CardText 
            fontSize={12} 
            fontWeight="500" 
            color="rgba(255, 255, 255, 0.85)"
          >
            {periodos[periodoSelecionado]}
          </CardText>
          <Icon name="chevron-down" size={14} color="rgba(255, 255, 255, 0.7)" style={{marginLeft: 5}} />
        </View>
        
        <CardText 
          fontSize={17} 
          fontWeight="600" 
          color={definirCorGasto()}
        >
          {formatarMoeda(valorAMostrar)}
        </CardText>
      </TouchableOpacity>
    </LinearGradient>
  );
};

// Lista de cartões disponíveis
export const CARD_TEMPLATES = [
  {
    id: 'nebula-purple',
    name: 'Nebulosa Roxa',
    component: NebulaPurpleCard,
    thumbnail: '#6A36D9'
  },
  {
    id: 'purple-gradient',
    name: 'Roxo Elegante',
    component: PurpleGradientCard,
    thumbnail: '#8741E5'
  },
  {
    id: 'dark-blue',
    name: 'Azul Corporativo',
    component: DarkBlueCard,
    thumbnail: '#2C3E7B'
  },
  {
    id: 'green-gradient',
    name: 'Verde Natureza',
    component: GreenGradientCard,
    thumbnail: '#3CB371'
  },
  {
    id: 'metallic',
    name: 'Premium Metálico',
    component: MetallicCard,
    thumbnail: '#505050'
  },
  {
    id: 'black-gold',
    name: 'Black Exclusivo',
    component: BlackGoldCard,
    thumbnail: '#000000'
  },
  {
    id: 'turquoise-business',
    name: 'Turquesa Profissional',
    component: TurquoiseBusinessCard,
    thumbnail: '#20B2AA'
  }
];

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTopLeft: {
    alignItems: 'flex-start',
  },
  profileIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Estilos para o cartão roxo
  purpleOverlayCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -125,
    right: -50,
  },
  purpleOverlaySmallCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -20,
    left: 20,
  },
  // Estilos para o cartão azul
  blueTopBorder: {
    position: 'absolute',
    height: 5,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#4FACFE',
  },
  blueDotPattern: {
    position: 'absolute',
    width: 200,
    height: 100,
    right: -100,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    borderStyle: 'dotted',
    borderRadius: 30,
  },
  // Estilos para o cartão verde
  greenLeafPattern: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 30,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    top: -150,
    right: -150,
    transform: [{rotate: '45deg'}]
  },
  greenLeafOverlay: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 15,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    bottom: -75,
    left: -75,
  },
  // Estilos para o cartão metálico
  metallicShineLine: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  metallicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  metallicBottomLine: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  // Estilos para o cartão black
  blackCardCorner: {
    position: 'absolute',
    width: 80,
    height: 80,
    right: -40,
    top: -40,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
    transform: [{rotate: '45deg'}]
  },
  goldAccent: {
    position: 'absolute',
    width: 50,
    height: 3,
    backgroundColor: '#D4AF37',
    top: 40,
    left: 20,
    opacity: 0.7
  },
  blackCardDivider: {
    position: 'absolute',
    height: 0.5,
    left: 20,
    right: 20,
    bottom: 90,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  // Estilos para o cartão turquesa
  turquoiseCardBorder: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
  },
  turquoiseDiagonalLine: {
    position: 'absolute',
    width: 200,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '135deg' }],
    left: -40,
    top: 120,
  },
  turquoiseCornerAccent: {
    position: 'absolute',
    width: 40,
    height: 40,
    right: 15,
    bottom: 15,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomRightRadius: 8,
  },
  // Estilos para o cartão nebulosa roxa
  nebulaSmoke1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#8A2BE2',
    opacity: 0.2,
    top: -100,
    left: -100,
    transform: [{ scale: 1.5 }],
  },
  nebulaSmoke2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#9370DB',
    opacity: 0.15,
    bottom: -80,
    right: -80,
    transform: [{ scale: 1.2 }],
  },
  nebulaSmoke3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7B68EE',
    opacity: 0.2,
    top: 40,
    right: -50,
  },
  nebulaGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF',
    opacity: 0.07,
    top: 40,
    left: 40,
    transform: [{ scale: 1.2 }],
  },
  nebulaSimpleHeader: {
    paddingTop: 5,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  nebulaTimeFilterContainer: {
    marginVertical: 15,
    paddingVertical: 5,
  },
  nebulaTimeFilterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nebulaTimeDropdown: {
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
}); 