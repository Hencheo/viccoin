"""
Módulo fake para substituir o Firebase Firestore em ambientes onde não está disponível.
Este arquivo é usado para permitir que a aplicação funcione sem Firebase quando necessário.
"""
import logging
from typing import Any, List, Dict, Callable, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FakeFirestore:
    """Implementação fake do cliente Firestore."""
    
    def __init__(self):
        self.collections = {}
        logger.warning("Usando implementação FAKE do Firestore. Apenas para desenvolvimento/testes.")
    
    def collection(self, collection_name):
        """Retorna uma coleção fake."""
        if collection_name not in self.collections:
            self.collections[collection_name] = FakeCollection(collection_name)
        return self.collections[collection_name]

class FakeCollection:
    """Implementação fake de uma coleção Firestore."""
    
    def __init__(self, name):
        self.name = name
        self.documents = {}
        self.queries = []
    
    def document(self, doc_id):
        """Retorna um documento fake."""
        if doc_id not in self.documents:
            self.documents[doc_id] = FakeDocument(doc_id, {})
        return self.documents[doc_id]
    
    def add(self, data, doc_id=None):
        """Adiciona um documento à coleção fake."""
        if doc_id is None:
            # Gerar um ID simples para o documento
            doc_id = f"fake-doc-{len(self.documents)}"
        
        doc = FakeDocument(doc_id, data)
        self.documents[doc_id] = doc
        return doc_id, doc
    
    def where(self, field, op, value):
        """Adiciona uma condição de filtro à consulta fake."""
        # Simplesmente retorna a própria coleção para encadear mais condições
        self.queries.append((field, op, value))
        return self
    
    def stream(self):
        """Retorna um stream fake de documentos."""
        # Nesta implementação fake, retornamos todos os documentos
        return self.documents.values()

class FakeDocument:
    """Implementação fake de um documento Firestore."""
    
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
    
    def set(self, data, merge=False):
        """Define os dados do documento fake."""
        if merge:
            self._data.update(data)
        else:
            self._data = data
        return self
    
    def update(self, data):
        """Atualiza os dados do documento fake."""
        self._data.update(data)
        return self
    
    def get(self):
        """Obtém os dados do documento fake."""
        return FakeDocumentSnapshot(self.id, self._data)
    
    def delete(self):
        """Exclui o documento fake."""
        # Na implementação fake, não fazemos nada
        return True
    
    def to_dict(self):
        """Retorna os dados como dicionário."""
        return self._data.copy()

class FakeDocumentSnapshot:
    """Implementação fake de um snapshot de documento Firestore."""
    
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = True
    
    def to_dict(self):
        """Retorna os dados como dicionário."""
        return self._data.copy()

class FakeFirebaseAdmin:
    """Implementação fake do firebase_admin."""
    
    @staticmethod
    def initialize_app(credential=None, options=None):
        """Inicializa um app fake."""
        logger.warning("Inicializando app FAKE do Firebase. Apenas para desenvolvimento/testes.")
        return FakeApp()

class FakeApp:
    """Implementação fake de um app Firebase."""
    
    def __init__(self):
        self.name = "fake-app"

class FakeCredentials:
    """Implementação fake de credenciais Firebase."""
    
    @staticmethod
    def Certificate(cert_path_or_dict):
        """Retorna credenciais fake."""
        return {"type": "fake-credentials"}

class FakeAuth:
    """Implementação fake de autenticação Firebase."""
    
    @staticmethod
    def verify_id_token(token):
        """Verifica um token fake."""
        return {
            'uid': 'fake-user-123',
            'email': 'usuario@exemplo.com',
            'name': 'Usuário Fake'
        }

def transactional(transaction_func):
    """
    Decorator fake para funções transacionais.
    """
    def wrapper(*args, **kwargs):
        # Ignoramos o argumento de transação e passamos os outros argumentos
        if args and isinstance(args[0], FakeTransaction):
            return transaction_func(args[0], *args[1:], **kwargs)
        else:
            fake_transaction = FakeTransaction()
            return transaction_func(fake_transaction, *args, **kwargs)
    return wrapper

class FakeTransaction:
    """Implementação fake de uma transação Firestore."""
    
    def __init__(self):
        pass
    
    def get(self, doc_ref):
        """Obtém um documento na transação fake."""
        return doc_ref.get()
    
    def set(self, doc_ref, data, merge=False):
        """Define os dados de um documento na transação fake."""
        doc_ref.set(data, merge)
        return self
    
    def update(self, doc_ref, data):
        """Atualiza os dados de um documento na transação fake."""
        doc_ref.update(data)
        return self
    
    def delete(self, doc_ref):
        """Exclui um documento na transação fake."""
        doc_ref.delete()
        return self

# Função para criar um cliente fake
def client():
    """Retorna um cliente Firestore fake."""
    return FakeFirestore()

# Firebase Admin exportando objetos fake
firebase_admin = FakeFirebaseAdmin()
auth = FakeAuth()
credentials = FakeCredentials()

# Export para ser usado em outras partes do código
__all__ = [
    'client', 'transactional', 
    'firebase_admin', 'auth', 'credentials'
] 