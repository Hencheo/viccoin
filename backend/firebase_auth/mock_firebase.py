"""
Mock do Firebase Admin SDK para desenvolvimento.
Permite testar aplicações sem precisar do Firebase real.
"""
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MockAuth:
    """Mock da classe Auth do Firebase."""
    
    def verify_id_token(self, token, check_revoked=False, app=None):
        """
        Mock para verificação de tokens.
        Sempre retorna um token válido para usuário de teste.
        """
        logger.info(f"[MOCK] Verificando token: {token}")
        
        # Se um token de teste específico for fornecido, podemos usar para diferentes usuários de teste
        if token == "token_admin":
            return {
                "uid": "admin_user_123",
                "email": "admin@example.com",
                "name": "Admin de Teste",
                "picture": "https://via.placeholder.com/150",
                "email_verified": True,
                "iss": "https://securetoken.google.com/project-id",
                "aud": "project-id",
                "auth_time": int(datetime.now().timestamp()),
                "user_id": "admin_user_123",
                "sub": "admin_user_123",
                "iat": int(datetime.now().timestamp()),
                "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
                "firebase": {
                    "identities": {
                        "email": ["admin@example.com"]
                    },
                    "sign_in_provider": "password"
                },
                "claims": {
                    "admin": True
                }
            }
        
        # Token padrão para usuário de teste
        return {
            "uid": "test_user_123",
            "email": "test@example.com", 
            "name": "Usuário de Teste",
            "picture": "https://via.placeholder.com/150",
            "email_verified": True,
            "iss": "https://securetoken.google.com/project-id",
            "aud": "project-id",
            "auth_time": int(datetime.now().timestamp()),
            "user_id": "test_user_123",
            "sub": "test_user_123",
            "iat": int(datetime.now().timestamp()),
            "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
            "firebase": {
                "identities": {
                    "email": ["test@example.com"]
                },
                "sign_in_provider": "password"
            }
        }

    def create_custom_token(self, uid, developer_claims=None, app=None):
        """Mock para criação de tokens personalizados."""
        logger.info(f"[MOCK] Criando token personalizado para: {uid}")
        return f"mock_custom_token_{uid}"
    
    def get_user(self, uid, app=None):
        """Mock para obter informações de um usuário."""
        logger.info(f"[MOCK] Buscando usuário: {uid}")
        return {
            "uid": uid,
            "email": f"{uid}@example.com",
            "display_name": f"Usuário {uid}",
            "email_verified": True,
            "provider_data": [{"provider_id": "password"}]
        }

class MockCredentials:
    """Mock da classe Credentials do Firebase."""
    
    @staticmethod
    def Certificate(credential_path_or_dict):
        """
        Mock para criação de credenciais.
        Aceita tanto um caminho para arquivo quanto um dicionário.
        """
        if isinstance(credential_path_or_dict, str):
            logger.info(f"[MOCK] Credenciais carregadas do arquivo: {credential_path_or_dict}")
        else:
            logger.info("[MOCK] Credenciais carregadas do dicionário")
        
        return {"type": "mock_credentials"}

class MockApp:
    """Mock da classe App do Firebase."""
    
    def __init__(self, name=None):
        self.name = name or "[DEFAULT]"
        logger.info(f"[MOCK] App criado: {self.name}")
    
    def delete(self):
        """Mock para deletar o app."""
        logger.info(f"[MOCK] App deletado: {self.name}")

class MockFirebaseAdmin:
    """Mock da classe FirebaseAdmin."""
    
    def __init__(self):
        self._apps = {}
        self._default_app = None
        self.auth = MockAuth()

    def initialize_app(self, credential, options=None, name=None):
        """
        Mock para inicialização do app Firebase.
        Retorna uma instância de MockApp.
        """
        app_name = name or "[DEFAULT]"
        logger.info(f"[MOCK] Inicializando app Firebase: {app_name}")
        
        app = MockApp(app_name)
        self._apps[app_name] = app
        
        if app_name == "[DEFAULT]":
            self._default_app = app
            
        return app
    
    def get_app(self, name=None):
        """
        Mock para obter um app Firebase pelo nome.
        Retorna o app ou levanta uma exceção se não encontrado.
        """
        app_name = name or "[DEFAULT]"
        if app_name not in self._apps:
            raise ValueError(f"App {app_name} não foi inicializado")
        return self._apps[app_name]
    
    def delete_app(self, app):
        """
        Mock para deletar um app Firebase.
        """
        if hasattr(app, 'name') and app.name in self._apps:
            app.delete()
            del self._apps[app.name]
            if self._default_app and self._default_app.name == app.name:
                self._default_app = None

# Criar instância da classe para simular o comportamento do Firebase Admin
firebase_admin = MockFirebaseAdmin()
auth = firebase_admin.auth
credentials = MockCredentials 