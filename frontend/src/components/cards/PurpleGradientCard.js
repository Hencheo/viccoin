import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { CardText } from './common/CardText';
import { CardProgress } from './common/CardProgress';

const { width } = Dimensions.get('window');

const PurpleGradientCard = React.memo(({
  saldoDisponivel,
  despesasTotal,
  ganhosTotal,
  mesAtual,
  formatarMoeda
}) => {
  // Calcular o progresso de gastos apenas quando os valores mudam
  const progressValue = useMemo(() => {
    const total = despesasTotal + ganhosTotal;
    if (total === 0) return 0;
    return (despesasTotal / total) * 100;
  }, [despesasTotal, ganhosTotal]);
  
  // Calcular o estilo do progresso com base no valor
  const progressStyle = useMemo(() => {
    if (progressValue < 30) return styles.progressLow;
    if (progressValue < 70) return styles.progressMedium;
    return styles.progressHigh;
  }, [progressValue]);

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
          <CardText fontSize={32} fontWeight="bold" style={{marginTop: 5}}>
            {formatarMoeda(saldoDisponivel)}
          </CardText>
        </View>
        <View style={styles.cardTopRight}>
          <View style={styles.moreOptionsButton}>
            <Icon name="ellipsis-horizontal" size={24} color="white" />
          </View>
        </View>
      </View>
      
      <View style={styles.cardCenter}>
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <CardText fontSize={13} fontWeight="500" color="rgba(255, 255, 255, 0.7)">
              DESPESAS
            </CardText>
            <CardText fontSize={18} fontWeight="600" color="#FF5252" style={{marginTop: 3}}>
              {formatarMoeda(despesasTotal)}
            </CardText>
          </View>
          
          <View style={styles.metricDivider} />
          
          <View style={styles.metricItem}>
            <CardText fontSize={13} fontWeight="500" color="rgba(255, 255, 255, 0.7)">
              GANHOS
            </CardText>
            <CardText fontSize={18} fontWeight="600" color="#4CAF50" style={{marginTop: 3}}>
              {formatarMoeda(ganhosTotal)}
            </CardText>
          </View>
        </View>
      </View>
      
      <View style={styles.cardBottom}>
        <View style={styles.progressContainer}>
          <View style={styles.progressMeta}>
            <CardText fontSize={12} fontWeight="500" color="rgba(255, 255, 255, 0.8)">
              GASTOS DO MÊS DE {mesAtual.toUpperCase()}
            </CardText>
            <CardText fontSize={12} fontWeight="bold" color="white">
              {progressValue.toFixed(0)}%
            </CardText>
          </View>
          <CardProgress 
            value={progressValue} 
            progressStyle={progressStyle} 
          />
        </View>
      </View>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  purpleOverlayCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -70,
    right: -70,
  },
  purpleOverlaySmallCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -50,
    left: -30,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTopLeft: {
    flex: 1,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreOptionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCenter: {
    marginTop: 15,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
  },
  cardBottom: {
    marginTop: 'auto',
  },
  progressContainer: {
    width: '100%',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLow: {
    backgroundColor: '#4CAF50',
  },
  progressMedium: {
    backgroundColor: '#FFC107',
  },
  progressHigh: {
    backgroundColor: '#FF5252',
  },
});

export default PurpleGradientCard; 