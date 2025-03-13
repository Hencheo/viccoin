import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { formatarMoeda } from '../../../utils/formatters';

const ChartSection = ({ chartData, totalDespesas, totalGanhos }) => {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Visão Geral (30 dias)</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyMessage}>Sem dados para exibir o gráfico</Text>
        </View>
      </View>
    );
  }

  const saldo = totalGanhos - totalDespesas;
  const diffColor = saldo >= 0 ? '#4CAF50' : '#FF5252';

  const screenWidth = Dimensions.get('window').width - 48; // Margens

  // Encontrar o valor máximo no dataset para ajustar a escala do gráfico
  const allValues = [
    ...(chartData.datasets[0]?.data || []), 
    ...(chartData.datasets[1]?.data || [])
  ];
  const maxValue = Math.max(...allValues, 1);

  // Preparar labels mais curtos para exibição no gráfico
  // Isso é especialmente útil para datas do tipo "01/01-05/01" que podem ficar cortadas
  const formattedLabels = chartData.labels.map(label => {
    // Se o label contém uma barra, é uma data com mês (DD/MM)
    if (label.includes('/')) {
      // Pegar apenas o dia do início e fim, ignorando os meses
      const parts = label.split('-');
      if (parts.length === 2) {
        const startParts = parts[0].split('/');
        const endParts = parts[1].split('/');
        // Retornar apenas os dias: "DD-DD"
        if (startParts.length > 1 && endParts.length > 1) {
          return `${startParts[0]}-${endParts[0]}`;
        }
      }
    }
    return label;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visão Geral (30 dias)</Text>
      
      {/* Resumo financeiro */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
            {formatarMoeda(totalGanhos)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: '#FF5252' }]}>
            {formatarMoeda(totalDespesas)}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[styles.summaryValue, { color: diffColor }]}>
            {formatarMoeda(saldo)}
          </Text>
        </View>
      </View>
      
      {/* Gráfico */}
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: formattedLabels,
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
            yAxisLabel=""
            yAxisSuffix=""
            formatYLabel={(value) => {
              // Simplificar valores no eixo Y para melhor legibilidade
              const num = Number(value);
              if (num >= 1000) {
                return `${Math.round(num/1000)}k`;
              }
              return value;
            }}
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
              propsForLabels: {
                fontSize: 9,
                rotation: 0,
              },
              // Ajusta número de ticks no eixo Y
              count: 5,
            }}
            bezier
            style={styles.chart}
            fromZero={true}
            segments={5}
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
      
      {/* Explicação do período */}
      <Text style={styles.periodExplanation}>
        Dados dos últimos 30 dias, agrupados em períodos de 5 dias
      </Text>
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
  periodExplanation: {
    color: '#999999',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ChartSection; 