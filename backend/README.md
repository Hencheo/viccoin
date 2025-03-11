# VicCoin - Backend

API do VicCoin, desenvolvida com Django e Firebase.

## Tecnologias

- Django 5.1.7
- Firebase (Firestore)
- Render (Hospedagem)

## Estrutura do Projeto

```
backend/
├── viccoin/             # Configurações do projeto Django
├── users/               # App para gerenciamento de usuários
├── templates/           # Templates HTML
├── .env                 # Variáveis de ambiente (não versionado)
├── requirements.txt     # Dependências do projeto
└── Procfile             # Configuração para deploy no Render
```

## Endpoints da API

### Usuários

- `POST /api/users/register/` - Cadastro de usuário
  - Body: `{ "email": "email@exemplo.com", "password": "senha123", "nome": "Nome Completo" }`

- `POST /api/users/login/` - Login de usuário
  - Body: `{ "email": "email@exemplo.com", "password": "senha123" }`

- `GET /api/users/hello-world/` - Endpoint de teste

## Desenvolvimento Local

1. Clone o repositório
2. Crie e ative um ambiente virtual:
   ```
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   ```
3. Instale as dependências:
   ```
   pip install -r requirements.txt
   ```
4. Configure o arquivo `.env` com as variáveis necessárias
5. Execute o servidor de desenvolvimento:
   ```
   python manage.py runserver
   ```

## Deploy

O deploy é feito automaticamente no Render quando há um push para a branch main.

## Variáveis de Ambiente

- `SECRET_KEY` - Chave secreta do Django
- `DEBUG` - Modo de depuração (True/False)
- `ALLOWED_HOSTS` - Hosts permitidos, separados por vírgula
- `FIREBASE_CREDENTIALS_PATH` - Caminho para o arquivo de credenciais do Firebase 