import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { formatCurrency } from '../../../utils/formatters';

const ChartSection = ({ chartData, totalDespesas, totalGanhos }) => {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Visão Geral</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyMessage}>Sem dados para exibir o gráfico</Text>
        </View>
      </View>
    );
  }

  const saldo = totalGanhos - totalDespesas;
  const diffColor = saldo >= 0 ? '#4CAF50' : '#FF5252';

  const screenWidth = Dimensions.get('window').width - 48; // Margens

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visão Geral</Text>
      
      {/* Resumo financeiro */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {formatCurrency(totalGanhos)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: '#FF5252' }]}>
            {formatCurrency(totalDespesas)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[styles.summaryValue, { color: diffColor }]}>
            {formatCurrency(saldo)}
          </Text>
        </View>
      </View>
      
      {/* Gráfico */}
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [
                {
                  data: chartData.datasets[0].data,
                  color: () => chartData.datasets[0].color || '#FF5252',
                  strokeWidth: 2,
                },
                {
                  data: chartData.datasets[1].data,
                  color: () => chartData.datasets[1].color || '#4CAF50',
                  strokeWidth: 2,
                },
              ],
              legend: ['Despesas', 'Receitas']
            }}
            width={screenWidth}
            height={220}
            yAxisLabel="R$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#1A1A1A',
              backgroundGradientFrom: '#1A1A1A',
              backgroundGradientTo: '#1A1A1A',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}
      
      {/* Legenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF5252' }]} />
          <Text style={styles.legendText}>Despesas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Receitas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#BBBBBB',
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    padding: 20,
  },
  emptyMessage: {
    color: '#BBBBBB',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ChartSection; 