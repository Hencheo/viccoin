# VicCoin Frontend

Frontend do aplicativo VicCoin de gestão financeira, desenvolvido com React Native e Expo.

## Estrutura do Projeto

```
frontend/
├── assets/               # Imagens, fontes, etc
├── src/
│   ├── api/              # Serviços de API para comunicação com o backend
│   │   ├── config.js     # Configuração da API (URLs do backend)
│   │   ├── auth.js       # Serviços de autenticação
│   │   ├── expenses.js   # Serviços para despesas
│   │   └── income.js     # Serviços para receitas
│   ├── components/       # Componentes reutilizáveis
│   │   ├── ExpenseItem.js
│   │   ├── CategoryTag.js
│   │   └── ...
│   ├── screens/          # Telas do aplicativo
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── ExpensesScreen.js
│   │   └── ...
│   ├── contexts/         # Contextos de React (estado global)
│   │   ├── AuthContext.js
│   │   └── ...
│   ├── navigation/       # Configuração de navegação
│   │   └── AppNavigator.js
│   └── utils/            # Funções utilitárias
│       ├── dateUtils.js
│       └── currencyUtils.js
└── App.js                # Ponto de entrada
```

## Requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Expo CLI

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/viccoin.git
cd viccoin/frontend
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

## Executando o Aplicativo

```bash
npm start
# ou
yarn start
```

Isso iniciará o servidor de desenvolvimento do Expo. Você pode executar o aplicativo em:

- Dispositivo físico: escaneie o QR code com o aplicativo Expo Go
- Emulador Android: pressione `a` no terminal
- Emulador iOS: pressione `i` no terminal (apenas macOS)
- Web: pressione `w` no terminal

## Comunicação com o Backend

O frontend se comunica com o backend Django hospedado no Render através de uma API RESTful. A configuração da URL base da API está em `src/api/config.js`.

## Principais Funcionalidades

- Autenticação de usuários (login/registro)
- Visualização de dashboard financeiro
- Gerenciamento de despesas e receitas
- Categorização de transações
- Relatórios e gráficos financeiros

## Tecnologias Utilizadas

- React Native
- Expo
- React Navigation
- Axios
- React Native Paper
- AsyncStorage 