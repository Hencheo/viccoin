# Guia para Personalizar o Ícone e Splash Screen no VicCoin

Este documento fornece instruções detalhadas sobre como personalizar o ícone do aplicativo e a tela de splash do seu aplicativo VicCoin desenvolvido com Expo.

## Ícones do Aplicativo

O Expo requer vários tamanhos de ícones para diferentes plataformas. Aqui estão as especificações:

### Preparando os Ícones

1. **Ícone principal** (`icon.png`): 
   - Tamanho: 1024x1024 pixels
   - Formato: PNG com fundo transparente
   - Localização: `frontend/assets/icon.png`

2. **Ícone adaptativo Android** (`adaptive-icon.png`):
   - Tamanho: 1024x1024 pixels
   - Formato: PNG com fundo transparente
   - Localização: `frontend/assets/adaptive-icon.png`
   - Este é apenas o foreground, o background é uma cor configurada em `app.json`

3. **Favicon para Web** (`favicon.png`):
   - Tamanho: 196x196 pixels
   - Formato: PNG
   - Localização: `frontend/assets/favicon.png`

### Criando um Ícone no Estilo VicCoin

Para criar um ícone que corresponda ao tema "Nebulosa Roxa" do VicCoin:

1. Use as cores do tema: `#4B0082`, `#6A36D9`, `#3B0062`
2. Crie um símbolo simples que represente finanças ou a letra "V" de VicCoin
3. Adicione elementos nebulosos ou efeitos gradientes similares ao cartão principal

## Tela de Splash (Splash Screen)

A tela de splash é a primeira tela exibida quando seu aplicativo é iniciado.

### Preparando a Imagem de Splash

1. **Imagem de Splash** (`splash-icon.png`):
   - Tamanho recomendado: 1242x2436 pixels (proporção do iPhone X)
   - Formato: PNG
   - Localização: `frontend/assets/splash-icon.png`
   - Mantenha a imagem simples, geralmente apenas um logotipo no centro

### Configurando a Tela de Splash

O Expo possui duas formas de configurar a tela de splash:

#### 1. Configuração Básica via app.json/app.config.js

Já configuramos as cores principais no arquivo `app.config.js`:

```js
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#4B0082"
},
```

Esta é a forma mais simples, mas não permite animações.

#### 2. Tela de Splash Personalizada com Animações

Para uma experiência mais rica, você pode criar uma tela de splash personalizada. Criamos um exemplo em `src/assets/SplashScreen.js`.

Para implementar isso:

1. Instale os pacotes necessários:
   ```
   npx expo install expo-splash-screen expo-font
   ```

2. Modifique seu `App.js` para usar a tela de splash personalizada:
   ```jsx
   import React, { useState, useEffect } from 'react';
   import { View } from 'react-native';
   import SplashScreen from './src/assets/SplashScreen';
   import AppNavigator from './src/navigation/AppNavigator';

   export default function App() {
     const [isSplashVisible, setIsSplashVisible] = useState(true);

     return (
       <View style={{ flex: 1 }}>
         {isSplashVisible ? (
           <SplashScreen onFinish={() => setIsSplashVisible(false)} />
         ) : (
           <AppNavigator />
         )}
       </View>
     );
   }
   ```

## Construindo o APK com os Novos Assets

Depois de adicionar seus novos ícones e configuração de splash, execute:

```
cd frontend
npx expo prebuild --clean
npx expo build:android
```

Para iOS:
```
npx expo build:ios
```

## Outras Dicas

1. **Testando a tela de splash**: 
   - No Expo Go, a tela de splash personalizada em código funcionará, mas a configurada em `app.json` não será visível.
   - Para testar completamente, você precisa gerar um build.

2. **Gerando ícones automaticamente**:
   - Você pode usar ferramentas como [Expo Icon Builder](https://apetools.webprofusion.com/app/#/tools/imagegorilla) ou [App Icon Generator](https://appicon.co/) para gerar todos os tamanhos necessários.

3. **Atualização OTA (Over The Air)**:
   - Note que alterações no `app.json`/`app.config.js` relacionadas a ícones e splash screen não serão aplicadas via atualizações OTA. Você precisará enviar uma nova versão para as lojas.

Esperamos que este guia ajude a personalizar seu aplicativo VicCoin com uma identidade visual atraente e profissional! 