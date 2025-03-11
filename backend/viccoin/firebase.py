import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings
import os

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
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        app = firebase_admin.initialize_app(cred)
    
    # Retornar o cliente do Firestore
    return firestore.client()

# Criar uma instância do cliente Firestore
db = initialize_firebase() 