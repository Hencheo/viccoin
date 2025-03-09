import firebase_admin
from firebase_admin import credentials, firestore
import json
import os
import time
from datetime import datetime

# Inicializando o Firebase Admin SDK com as credenciais
# Substitua pelo caminho do seu arquivo de credenciais
CREDS_PATH = os.path.join(os.path.dirname(__file__), 'backend/chave-privada-firebase.json')

def testar_firestore_direto():
    """
    Testa a conexão direta com o Firestore sem passar pelo backend Django no Render.
    """
    print("===== TESTANDO CONEXÃO DIRETA COM FIRESTORE =====")
    
    try:
        # Verificar se o arquivo de credenciais existe
        if not os.path.exists(CREDS_PATH):
            print(f"ERRO: Arquivo de credenciais não encontrado em {CREDS_PATH}")
            return False
            
        print(f"Arquivo de credenciais encontrado em {CREDS_PATH}")
        
        # Inicializar o Firebase (se não estiver inicializado)
        try:
            app = firebase_admin.get_app()
            print("Firebase já inicializado!")
        except ValueError:
            print("Inicializando Firebase com o arquivo de credenciais...")
            cred = credentials.Certificate(CREDS_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase inicializado com sucesso!")
        
        # Acessar o Firestore
        db = firestore.client()
        print("Cliente Firestore criado com sucesso!")
        
        # Listar as coleções existentes
        collections = [col.id for col in db.collections()]
        print(f"Coleções existentes: {collections}")
        
        # Criar uma categoria de teste
        timestamp = int(time.time())
        categoria_ref = db.collection('categorias').document()
        categoria_data = {
            'nome': f'Categoria Teste Direto {timestamp}',
            'descricao': 'Criada via teste direto com Firestore',
            'cor': '#2ECC71',
            'icone': 'test-icon-direct',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        print("\nCriando categoria de teste...")
        categoria_ref.set(categoria_data)
        categoria_id = categoria_ref.id
        print(f"Categoria criada com ID: {categoria_id}")
        
        # Criar uma despesa de teste
        despesa_ref = db.collection('despesas').document()
        despesa_data = {
            'descricao': f'Despesa Teste Direto {timestamp}',
            'valor': 250.0,
            'data': datetime.now(),
            'categoria_id': categoria_id,
            'categoria_nome': categoria_data['nome'],
            'metodo_pagamento': 'Teste Direto',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        print("\nCriando despesa de teste...")
        despesa_ref.set(despesa_data)
        print(f"Despesa criada com ID: {despesa_ref.id}")
        
        # Verificar se os dados foram salvos
        print("\nVerificando dados salvos...")
        categoria_salva = categoria_ref.get()
        if categoria_salva.exists:
            print(f"Categoria recuperada: {categoria_salva.to_dict()}")
        else:
            print("ERRO: Categoria não encontrada!")
        
        despesa_salva = despesa_ref.get()
        if despesa_salva.exists:
            print(f"Despesa recuperada: {despesa_salva.to_dict()}")
        else:
            print("ERRO: Despesa não encontrada!")
        
        print("\n===== TESTE DIRETO COM FIRESTORE CONCLUÍDO COM SUCESSO! =====")
        return True
        
    except Exception as e:
        print(f"\nERRO ao testar conexão com Firestore: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    testar_firestore_direto() 