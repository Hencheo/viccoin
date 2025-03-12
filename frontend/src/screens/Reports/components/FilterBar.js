import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const FilterBar = ({ 
  selectedPeriod, 
  onChangePeriod, 
  selectedCategory, 
  onChangeCategory,
  categories = []
}) => {
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  // Opções de período
  const periodOptions = [
    { label: 'Semana', value: 'week' },
    { label: 'Mês', value: 'month' },
    { label: 'Trimestre', value: 'quarter' },
    { label: 'Ano', value: 'year' },
    { label: 'Todos', value: 'all' }
  ];

  // Opções de categoria (dinâmicas, baseadas nas transações)
  const categoryOptions = [
    { label: 'Todas', value: 'all' },
    ...categories.map(cat => ({ 
      label: cat.categoria, 
      value: cat.categoria
    }))
  ];

  const toggleCategoryFilter = () => {
    setShowCategoryFilter(prev => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Filtro de período */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Período:</Text>
        <View style={styles.chipContainer}>
          {periodOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                selectedPeriod === option.value && styles.chipActive
              ]}
              onPress={() => onChangePeriod(option.value)}
            >
              <Text 
                style={[
                  styles.chipText,
                  selectedPeriod === option.value && styles.chipTextActive
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filtro de categoria */}
      {categories.length > 0 && (
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.categoryHeader}
            onPress={toggleCategoryFilter}
          >
            <Text style={styles.filterLabel}>Categoria:</Text>
            <Text style={styles.selectedCategory}>
              {categoryOptions.find(c => c.value === selectedCategory)?.label || 'Todas'}
            </Text>
          </TouchableOpacity>
          
          {showCategoryFilter && (
            <View style={styles.chipContainer}>
              {categoryOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    selectedCategory === option.value && styles.chipActive
                  ]}
                  onPress={() => {
                    onChangeCategory(option.value);
                    setShowCategoryFilter(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.chipText,
                      selectedCategory === option.value && styles.chipTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  chip: {
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(162, 57, 255, 0.2)',
  },
  chipText: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#A239FF',
    fontWeight: 'bold',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCategory: {
    color: '#A239FF',
    fontWeight: 'bold',
  },
});

export default FilterBar; 