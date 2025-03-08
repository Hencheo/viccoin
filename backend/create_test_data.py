import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from firestore_api.models import Despesa
from firestore_api.services import DespesaService
from datetime import datetime, timedelta
import random

def create_test_expenses():
    # Criar serviço
    service = DespesaService()

    # ID de usuário para testes
    user_id = 'user_teste_123'

    # Categorias
    categorias = [
        {'id': 't6uvZkAjDRJ5LaWgvOGN', 'nome': 'Alimentacao'},
        {'id': 'srTRuwgsVTfxbg3mxBxF', 'nome': 'Transporte'},
        {'id': 'jJQVh206TgiQRhJfkXta', 'nome': 'Moradia'}
    ]

    # Métodos de pagamento
    metodos = ['cartao', 'dinheiro', 'pix', 'transferencia']

    # Tags possíveis
    todas_tags = ['essencial', 'lazer', 'trabalho', 'casa', 'transporte', 'mercado', 'restaurante']

    # Criar 10 despesas de teste com datas diferentes nos últimos 60 dias
    for i in range(1, 11):
        # Selecionar categoria
        categoria = random.choice(categorias)
        
        # Gerar valor aleatório
        valor = round(random.uniform(10, 1000), 2)
        
        # Selecionar método de pagamento
        metodo = random.choice(metodos)
        
        # Selecionar tags aleatórias (1 a 3)
        num_tags = random.randint(1, 3)
        tags = random.sample(todas_tags, num_tags)
        
        # Data aleatória nos últimos 60 dias
        dias_atras = random.randint(0, 60)
        data = datetime.now() - timedelta(days=dias_atras)
        
        # Criar objeto despesa
        despesa = Despesa(
            user_id=user_id,
            descricao=f'Despesa de teste {i}',
            valor=valor,
            data=data,
            categoria_id=categoria['id'],
            categoria_nome=categoria['nome'],
            metodo_pagamento=metodo,
            observacoes=f'Observação para despesa {i}',
            recorrente=random.choice([True, False]),
            parcelado=random.choice([True, False]),
            tags=tags
        )
        
        # Salvar no Firestore
        service.create(despesa)
        print(f'Criada despesa {i}: {valor} - {categoria["nome"]} - {metodo} - {tags}')

    print('Despesas de teste criadas com sucesso!')

if __name__ == '__main__':
    create_test_expenses() 