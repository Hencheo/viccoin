import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Inicializar o Firebase
creds_path = os.path.join(os.path.dirname(__file__), 'chave-privada-firebase.json')
try:
    # Verificar se já está inicializado
    app = firebase_admin.get_app()
    print("Firebase já inicializado!")
except ValueError:
    # Não está inicializado, vamos inicializar
    print(f"Inicializando Firebase com {creds_path}")
    cred = credentials.Certificate(creds_path)
    firebase_admin.initialize_app(cred)
    print("Firebase inicializado com sucesso!")

# Obter cliente Firestore
db = firestore.client()

# Definir categorias padrão
categorias_padrao = [
    {
        'nome': 'Alimentação',
        'descricao': 'Gastos com restaurantes, mercado e delivery',
        'cor': '#FF5733',
        'icone': 'restaurant',
        'ordem': 1
    },
    {
        'nome': 'Transporte',
        'descricao': 'Gastos com combustível, transporte público, Uber/99',
        'cor': '#33A8FF',
        'icone': 'directions_car',
        'ordem': 2
    },
    {
        'nome': 'Moradia',
        'descricao': 'Aluguel, condomínio, IPTU, contas de casa',
        'cor': '#33FF57',
        'icone': 'home',
        'ordem': 3
    },
    {
        'nome': 'Educação',
        'descricao': 'Mensalidades, cursos, livros',
        'cor': '#A833FF',
        'icone': 'school',
        'ordem': 4
    },
    {
        'nome': 'Saúde',
        'descricao': 'Plano de saúde, farmácia, consultas',
        'cor': '#FF3393',
        'icone': 'healing',
        'ordem': 5
    },
    {
        'nome': 'Lazer',
        'descricao': 'Cinema, passeios, viagens',
        'cor': '#FFDD33',
        'icone': 'beach_access',
        'ordem': 6
    },
    {
        'nome': 'Assinaturas',
        'descricao': 'Streaming, serviços recorrentes',
        'cor': '#33FFF3',
        'icone': 'subscriptions',
        'ordem': 7
    },
    {
        'nome': 'Beleza',
        'descricao': 'Cuidados pessoais, estética e produtos de beleza',
        'cor': '#FF33E6',
        'icone': 'face',
        'ordem': 8
    },
    {
        'nome': 'Vestuário',
        'descricao': 'Roupas, calçados e acessórios',
        'cor': '#B8FF33',
        'icone': 'checkroom',
        'ordem': 9
    },
    {
        'nome': 'Outros',
        'descricao': 'Despesas diversas',
        'cor': '#808080',
        'icone': 'more_horiz',
        'ordem': 10
    },
    {
        'nome': 'Renda',
        'descricao': 'Salários, freelances e outras fontes de renda',
        'cor': '#33FF8D',
        'icone': 'attach_money',
        'ordem': 11
    },
    {
        'nome': 'Investimentos',
        'descricao': 'Aplicações financeiras e retornos',
        'cor': '#33B8FF',
        'icone': 'trending_up',
        'ordem': 12
    }
]

# Verificar categorias existentes
categorias_ref = db.collection('categorias')
categorias_existentes = list(categorias_ref.get())
print(f"Categorias existentes: {len(categorias_existentes)}")

for cat in categorias_existentes:
    data = cat.to_dict()
    print(f"- {data.get('nome')} (ID: {cat.id})")

# Inicializar categorias
contador = 0
for cat_data in categorias_padrao:
    # Verificar se a categoria já existe pelo nome
    query = categorias_ref.where('nome', '==', cat_data['nome']).limit(1).get()
    if not list(query):
        print(f"Criando categoria: {cat_data['nome']}")
        # Adicionar timestamp de criação
        cat_data['created_at'] = firestore.SERVER_TIMESTAMP
        # Criar a categoria
        categorias_ref.add(cat_data)
        contador += 1
    else:
        print(f"Categoria já existe: {cat_data['nome']}")

print(f"{contador} categorias criadas.")
print("Processo concluído!")

# Confirmar categorias após inserção
categorias_atualizadas = list(categorias_ref.get())
print(f"Total de categorias após inserção: {len(categorias_atualizadas)}") 