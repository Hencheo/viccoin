import requests
import json
import time
from datetime import datetime

BASE_URL = "https://viccoin.onrender.com"

def teste_completo():
    print("===== TESTANDO COMUNICAÇÃO ENTRE BACKEND RENDER E FIREBASE =====")
    
    # Testar o endpoint de saúde
    print("\n1. Testando endpoint de saúde...")
    resp = requests.get(f"{BASE_URL}/api/health/")
    print(f"Status: {resp.status_code}")
    print(f"Resposta: {resp.json()}")
    
    # Criar uma categoria
    print("\n2. Criando categoria de teste...")
    categoria_data = {
        "nome": f"Test Categoria {int(time.time())}",
        "descricao": "Criada para teste automatizado",
        "cor": "#3498DB",
        "icone": "test-icon"
    }
    
    resp = requests.post(
        f"{BASE_URL}/api/categorias/",
        json=categoria_data
    )
    
    print(f"Status: {resp.status_code}")
    if resp.status_code in [200, 201]:
        categoria = resp.json()
        print(f"Categoria criada: {json.dumps(categoria, indent=2)}")
        categoria_id = categoria.get('id')
    else:
        print(f"Erro: {resp.text}")
        return
    
    # Criar uma despesa usando a categoria
    print("\n3. Criando despesa de teste...")
    despesa_data = {
        "descricao": f"Despesa Teste {int(time.time())}",
        "valor": 123.45,
        "data": datetime.now().isoformat(),
        "categoria_id": categoria_id,
        "categoria_nome": categoria_data["nome"],
        "metodo_pagamento": "Crédito",
        "observacoes": "Teste automatizado",
        "tags": ["teste", "python"]
    }
    
    resp = requests.post(
        f"{BASE_URL}/api/despesas/",
        json=despesa_data
    )
    
    print(f"Status: {resp.status_code}")
    if resp.status_code in [200, 201]:
        despesa = resp.json()
        print(f"Despesa criada: {json.dumps(despesa, indent=2)}")
        despesa_id = despesa.get('id')
    else:
        print(f"Erro: {resp.text}")
    
    # Criar uma receita
    print("\n4. Criando receita de teste...")
    receita_data = {
        "descricao": f"Receita Teste {int(time.time())}",
        "valor": 999.99,
        "data": datetime.now().isoformat(),
        "categoria_id": categoria_id,
        "categoria_nome": categoria_data["nome"],
        "fonte": "Teste Python",
        "observacoes": "Teste automatizado"
    }
    
    resp = requests.post(
        f"{BASE_URL}/api/receitas/",
        json=receita_data
    )
    
    print(f"Status: {resp.status_code}")
    if resp.status_code in [200, 201]:
        receita = resp.json()
        print(f"Receita criada: {json.dumps(receita, indent=2)}")
    else:
        print(f"Erro: {resp.text}")
    
    # Listar categorias para verificar
    print("\n5. Listando categorias para verificar...")
    resp = requests.get(f"{BASE_URL}/api/categorias/")
    
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        categorias = resp.json()
        print(f"Total de categorias: {len(categorias)}")
        print(f"Últimas 3 categorias: {json.dumps(categorias[-3:], indent=2) if len(categorias) >= 3 else categorias}")
    else:
        print(f"Erro: {resp.text}")
    
    print("\n===== TESTE CONCLUÍDO =====")
    print("Verifique o console do Firebase para confirmar se os dados foram salvos no Firestore!")

if __name__ == "__main__":
    teste_completo() 