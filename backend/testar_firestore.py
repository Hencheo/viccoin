import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Caminho para o arquivo de credenciais
CREDS_PATH = os.path.join(os.path.dirname(__file__), 'chave-privada-firebase.json')

def testar_conexao_firestore():
    """
    Testa a conexão com o Firestore usando o arquivo de credenciais.
    """
    print("Iniciando teste de conexão com o Firestore...")
    
    try:
        # Verificar se o arquivo de credenciais existe
        if not os.path.exists(CREDS_PATH):
            print(f"ERRO: Arquivo de credenciais não encontrado em {CREDS_PATH}")
            return False
            
        print(f"Arquivo de credenciais encontrado em {CREDS_PATH}")
        
        # Inicializar o Firebase
        try:
            # Verificar se já está inicializado
            app = firebase_admin.get_app()
            print("Firebase já inicializado!")
        except ValueError:
            # Não está inicializado, vamos inicializar
            print("Inicializando Firebase com o arquivo de credenciais...")
            cred = credentials.Certificate(CREDS_PATH)
            firebase_admin.initialize_app(cred)
            print("Firebase inicializado com sucesso!")
        
        # Acessar o Firestore
        db = firestore.client()
        print("Cliente Firestore criado com sucesso!")
        
        # Listar as coleções
        collections = [col.id for col in db.collections()]
        print(f"Coleções encontradas: {collections}")
        
        # Tentar acessar alguns documentos
        if collections:
            # Pegar a primeira coleção
            first_collection = collections[0]
            print(f"Acessando primeira coleção: {first_collection}")
            
            # Listar documentos
            docs = list(db.collection(first_collection).limit(5).stream())
            print(f"Encontrados {len(docs)} documentos na coleção {first_collection}")
            
            # Mostrar IDs dos documentos
            if docs:
                doc_ids = [doc.id for doc in docs]
                print(f"IDs dos documentos: {doc_ids}")
                
                # Mostrar dados do primeiro documento
                primeiro_doc = docs[0].to_dict()
                print(f"Dados do primeiro documento: {json.dumps(primeiro_doc, indent=2, default=str)}")
        
        print("Teste de conexão com o Firestore concluído com SUCESSO!")
        return True
        
    except Exception as e:
        print(f"ERRO ao testar conexão com o Firestore: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    testar_conexao_firestore() 