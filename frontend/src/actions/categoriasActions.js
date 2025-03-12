import { SET_CATEGORIAS, ADD_CATEGORIA } from '../constants/actionTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const carregarCategorias = () => async (dispatch) => {
  try {
    // Carregar categorias do AsyncStorage
    const despesasString = await AsyncStorage.getItem('@VicCoin:categoriasDespesas');
    const ganhosString = await AsyncStorage.getItem('@VicCoin:categoriasGanhos');
    const salariosString = await AsyncStorage.getItem('@VicCoin:categoriasSalario');
    
    const despesas = despesasString ? JSON.parse(despesasString) : [
      'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação',
      'Lazer', 'Supermercado', 'Vestuário', 'Outras'
    ];
    
    const ganhos = ganhosString ? JSON.parse(ganhosString) : [
      'Freelance', 'Investimentos', 'Vendas', 'Presentes', 'Outras'
    ];
    
    const salarios = salariosString ? JSON.parse(salariosString) : [
      'Mensal', 'Quinzenal', 'Semanal', 'Bônus', 'Participação', 'Outras'
    ];
    
    dispatch({
      type: SET_CATEGORIAS,
      payload: {
        despesas,
        ganhos,
        salarios,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    return { success: false, message: error.message };
  }
};

export const adicionarCategoria = (tipo, categoria) => async (dispatch, getState) => {
  try {
    const state = getState();
    let categorias;
    let chaveStorage;
    
    if (tipo === 'despesa') {
      // Verificar se a categoria já existe
      if (state.categorias.despesas.includes(categoria)) {
        return { success: false, message: 'Esta categoria já existe' };
      }
      
      categorias = [...state.categorias.despesas, categoria];
      chaveStorage = '@VicCoin:categoriasDespesas';
    } else if (tipo === 'ganho') {
      // Verificar se a categoria já existe
      if (state.categorias.ganhos.includes(categoria)) {
        return { success: false, message: 'Esta categoria já existe' };
      }
      
      categorias = [...state.categorias.ganhos, categoria];
      chaveStorage = '@VicCoin:categoriasGanhos';
    } else if (tipo === 'salario') {
      // Verificar se a categoria já existe
      if (state.categorias.salarios.includes(categoria)) {
        return { success: false, message: 'Esta categoria já existe' };
      }
      
      categorias = [...state.categorias.salarios, categoria];
      chaveStorage = '@VicCoin:categoriasSalario';
    } else {
      return { success: false, message: 'Tipo de categoria inválido' };
    }
    
    // Salvar no AsyncStorage
    await AsyncStorage.setItem(chaveStorage, JSON.stringify(categorias));
    
    // Atualizar o estado
    dispatch({
      type: ADD_CATEGORIA,
      payload: { tipo, categoria },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar categoria:', error);
    return { success: false, message: error.message };
  }
}; 