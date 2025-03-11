import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings
import os
import json
import tempfile

def initialize_firebase():
    """
    Inicializa o SDK do Firebase Admin com as credenciais fornecidas.
    Retorna o cliente do Firestore.
    """
    try:
        # Verificar se o Firebase já foi inicializado
        app = firebase_admin.get_app()
    except ValueError:
        # Inicializar o Firebase se ainda não estiver inicializado
        # Verificar se estamos em produção (Render) e usar a variável de ambiente
        firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS_JSON')
        
        if firebase_creds_json:
            # Estamos em produção, usar credenciais da variável de ambiente
            # Criar um arquivo temporário com as credenciais
            with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp:
                temp.write(firebase_creds_json.encode())
                temp_path = temp.name
            
            cred = credentials.Certificate(temp_path)
            # Remover o arquivo após uso
            os.unlink(temp_path)
        else:
            # Estamos em ambiente local, usar o arquivo de credenciais
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            
        app = firebase_admin.initialize_app(cred)
    
    # Retornar o cliente do Firestore
    return firestore.client()

# Criar uma instância do cliente Firestore
db = initialize_firebase() 