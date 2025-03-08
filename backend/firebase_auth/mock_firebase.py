"""
Mock para o Firebase Admin SDK para desenvolvimento.
Usado quando a biblioteca real não está disponível.
"""

import logging
logger = logging.getLogger(__name__)

class MockAuth:
    """Mock para o módulo auth do Firebase."""
    
    def verify_id_token(self, token):
        """Mock para verificar tokens."""
        logger.warning("Usando mock para verify_id_token")
        return {
            'uid': 'user_teste_123',
            'name': 'Usuário Teste',
            'email': 'teste@example.com'
        }

class MockCredentials:
    """Mock para o módulo credentials do Firebase."""
    
    def Certificate(self, cert_dict_or_path):
        """Mock para gerar certificados."""
        logger.warning("Usando mock para Certificate")
        return {}

class MockFirebaseAdmin:
    """Mock para o módulo firebase_admin."""
    
    def __init__(self):
        self.auth = MockAuth()
        self.credentials = MockCredentials()
        self._apps = []
    
    def initialize_app(self, credential, options=None):
        """Mock para inicializar o app."""
        logger.warning("Usando mock para initialize_app")
        self._apps.append({
            'credential': credential,
            'options': options or {}
        })
        return self._apps[-1]

# Exportar mocks
auth = MockAuth()
credentials = MockCredentials()
firebase_admin_mock = MockFirebaseAdmin()
initialize_app = firebase_admin_mock.initialize_app 