# VicCoin - Backend

API do VicCoin, desenvolvida com Django e Firebase.

## Tecnologias

- Django 5.1.7
- Firebase (Firestore)
- Autenticação JWT
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
  - Retorna um token JWT para autenticação

- `GET /api/users/perfil/` - Perfil do usuário autenticado
  - Requer autenticação via token JWT
  - Header: `Authorization: Bearer {seu_token_jwt}`

- `GET /api/users/hello-world/` - Endpoint de teste

## Autenticação

O sistema utiliza autenticação baseada em token JWT (JSON Web Token). Após fazer login, você receberá um token que deve ser incluído no cabeçalho das requisições para endpoints protegidos.

### Como usar o token:

1. Faça login para obter o token:
   ```
   POST /api/users/login/
   Body: { "email": "seu@email.com", "password": "sua_senha" }
   ```

2. Extraia o token da resposta de login:
   ```json
   {
     "success": true,
     "message": "Login realizado com sucesso",
     "user": { ... },
     "token": "seu_token_jwt"
   }
   ```

3. Inclua o token no cabeçalho Authorization:
   ```
   Authorization: Bearer seu_token_jwt
   ```

4. Acesse endpoints protegidos, como `/api/users/perfil/`

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