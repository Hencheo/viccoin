export default {
  "name": "VicCoin",
  "slug": "viccoin",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "dark",
  "newArchEnabled": true,
  "experiments": {
    "tsconfigPaths": true
  },
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#4B0082"
  },
  "ios": {
    "supportsTablet": true,
    "infoPlist": {
      "NSFaceIDUsageDescription": "Este aplicativo usa o Face ID para permitir um login mais rápido e seguro."
    },
    "bundleIdentifier": "com.viccoin.app"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#6A36D9"
    },
    "permissions": ["USE_BIOMETRIC", "USE_FINGERPRINT"],
    "package": "com.viccoin.app"
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    [
      "expo-local-authentication",
      {
        "faceIDPermission": "Este aplicativo usa o Face ID para permitir um login mais rápido e seguro."
      }
    ]
  ],
  "primaryColor": "#6A36D9",
  "description": "Aplicativo de controle financeiro VicCoin"
}; 