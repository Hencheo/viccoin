# VicCoin Backend

Backend Django para o projeto VicCoin, integrado com Firebase Firestore.

## Requisitos

- Python 3.11+
- Django 5.1+
- Firebase Admin SDK
- Conta Firebase com Firestore habilitado

## Configuração do Ambiente

1. Clone o repositório
2. Crie um ambiente virtual:
   ```
   python -m venv venv
   ```
3. Ative o ambiente virtual:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```
5. Configure o arquivo `.env` baseado no `.env.example`
6. Adicione as credenciais do Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Gere uma chave privada para o Admin SDK
   - Salve o arquivo JSON em `credentials/firebase-credentials.json`

## Estrutura do Projeto

- `core/`: Configurações principais do Django
- `firebase_auth/`: App para autenticação com Firebase
- `firestore_api/`: App para API do Firestore
- `credentials/`: Diretório para armazenar credenciais do Firebase

## Executando o Projeto

```
python manage.py runserver
```

## Deploy no Render

O projeto está configurado para deploy no Render usando o arquivo `render.yaml`. Para fazer o deploy:

1. Crie uma conta no [Render](https://render.com/)
2. Conecte seu repositório GitHub
3. Clique em "Blueprint" e selecione o repositório
4. Configure as variáveis de ambiente necessárias
5. Faça o deploy

## Endpoints da API

A documentação completa da API estará disponível após a configuração do Firestore. 