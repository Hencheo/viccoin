# VicCoin - Aplicativo de Gestão Financeira

VicCoin é uma aplicação de gestão financeira que permite aos usuários controlar despesas, receitas, orçamentos e assinaturas.

## Arquitetura

A aplicação segue a seguinte arquitetura:

- **Backend**: Django + Django REST Framework
- **Banco de dados**: Firebase Firestore
- **Autenticação**: Firebase Authentication
- **Frontend**: (em desenvolvimento)

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Python 3.11+
- Conta no Firebase com Firestore e Authentication habilitados

### Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/Hencheo/viccoin.git
   cd viccoin
   ```

2. Configure o ambiente virtual Python:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate  # No Windows
   # source venv/bin/activate  # No Linux/Mac
   pip install -r requirements.txt
   ```

3. Configure as credenciais do Firebase:
   - Crie um arquivo `.env` baseado no `.env.example`
   - Coloque suas credenciais do Firebase em `backend/credentials/firebase-credentials.json` baseado no exemplo fornecido

4. Execute o servidor de desenvolvimento:
   ```
   python manage.py runserver
   ```

## Principais Funcionalidades

- Autenticação com Firebase
- Gestão de despesas e receitas
- Categorização automática
- Orçamentos e alertas
- Relatórios e análises
- Assinaturas e pagamentos recorrentes

## Estrutura do Projeto

- `/backend` - Código do backend Django
  - `/firebase_auth` - Módulo de autenticação com Firebase
  - `/firestore_api` - API REST que se comunica com o Firestore

## Implantação

O backend está configurado para ser implantado no Render.com. Veja as instruções detalhadas no arquivo `backend/README.md`.

## Licença

Este projeto é privado e não possui licença para uso público. 