/**
 * Theme.js - Sistema de temas para o aplicativo VicCoin
 * 
 * ESTRUTURA DE TEMAS:
 * Este arquivo define a aparência visual do aplicativo através de um sistema de temas.
 * Para facilitar a implementação de múltiplos temas no futuro (claro, escuro, etc.),
 * utilizamos nomes semânticos para os elementos visuais, em vez de nomes baseados em cores.
 * 
 * COMO USAR:
 * 1. Nunca use valores de cores diretamente no código. Sempre use as variáveis deste tema.
 * 2. Use nomes semânticos ao se referir aos elementos (ex: theme.colors.accent.main em vez de "cor pessego")
 * 3. Para implementar um novo tema, basta criar um objeto com a mesma estrutura e trocar os valores.
 */

const theme = {
  colors: {
    // Cores de destaque do aplicativo (antes laranja/pêssego)
    accent: {
      main: '#E101A3',       // Cor principal de destaque (antes primary)
      light: '#E101A3',      // Versão mais clara da cor principal (antes background.light)
      dark: '#D0018F',       // Versão mais escura da cor principal
      contrast: '#FFFFFF',   // Cor que contrasta bem com a cor principal
    },
    
    // Cores de fundo do aplicativo
    background: {
      primary: '#121212',    // Fundo principal do app (antes background.dark)
      secondary: '#1E1E1E',  // Fundo secundário (para cards, etc.) (antes card.background)
      tertiary: '#2D2D2D',   // Fundo terciário (para elementos destacados) (antes card.highlight)
    },
    
    // Cores para textos
    text: {
      primary: '#FFFFFF',    // Texto principal sobre fundos escuros (antes text.light)
      secondary: '#8A8A8A',  // Texto secundário/subtítulos (antes text.muted)
      inverse: '#000000',    // Texto sobre cor de destaque (antes text.dark)
    },
    
    // Cores para bordas e separadores
    border: {
      light: '#2A2A2A',      // Bordas sutis (antes card.border)
      medium: '#3A3A3A',     // Bordas médias
      focus: '#E101A3',      // Bordas para elementos em foco (usa accent.main)
    },
    
    // Cores para elementos de UI específicos
    ui: {
      statusBar: '#F13FB7',  // Cor da barra de status (antes statusBar)
      tabBar: '#000000',     // Cor da barra de navegação (antes tabBar)
      iconActive: '#FFFFFF', // Ícones ativos (antes icon.active)
      iconInactive: '#757575', // Ícones inativos (antes icon.inactive)
    },
    
    // Cores para feedback/transações
    feedback: {
      success: '#4CAF50',    // Sucesso/receitas (antes transaction.income)
      error: '#F44336',      // Erro/despesas (antes transaction.expense)
      warning: '#FFC107',    // Avisos
      info: '#2196F3',       // Informativo
    }
  },
  
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System',
      bold: 'System',
    },
    fontSize: {
      tiny: 10,
      small: 12,
      body: 14,
      button: 16,
      title: 18,
      subtitle: 20,
      header: 28,
      large: 32,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    }
  },
  
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 44,
  },
  
  borderRadius: {
    small: 6,
    medium: 12,
    large: 20,
    xl: 24,
    round: 100,
  },
  
  shadow: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    strong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    }
  },
  
  // Configurações específicas para a barra de status e navegação
  statusBarHeight: 25,
  bottomNavHeight: 90,
};

export default theme; 