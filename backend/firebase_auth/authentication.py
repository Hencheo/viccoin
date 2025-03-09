import os
import logging
from django.conf import settings
from django.utils import timezone
from rest_framework import authentication
from rest_framework import exceptions

logger = logging.getLogger(__name__)

# Configurar acesso ao Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import auth, credentials
    FIREBASE_AVAILABLE = True
    logger.info("Firebase Admin SDK importado com sucesso")
except ImportError as e:
    logger.error(f"Erro ao importar Firebase Admin SDK: {str(e)}")
    logger.error("Verificando instalação do firebase-admin...")
    import subprocess
    try:
        subprocess.check_call(["pip", "install", "firebase-admin"])
        import firebase_admin
        from firebase_admin import auth, credentials
        FIREBASE_AVAILABLE = True
        logger.info("Firebase Admin SDK instalado e importado com sucesso")
    except Exception as e:
        logger.critical(f"Não foi possível instalar o Firebase Admin SDK: {str(e)}")
        FIREBASE_AVAILABLE = False
        raise ImportError(f"Firebase Admin SDK não disponível: {str(e)}")

# Variável global para controlar o estado de inicialização
firebase_initialized = False

def set_firebase_initialized(status):
    """Define o status de inicialização do Firebase."""
    global firebase_initialized
    firebase_initialized = status
    logger.info(f"Status de inicialização do Firebase definido como: {status}")

class FirebaseUser:
    """
    Classe personalizada para representar um usuário do Firebase.
    Esta classe imita o comportamento básico de um modelo de usuário do Django.
    """
    def __init__(self, firebase_data):
        self.firebase_data = firebase_data
        self.uid = firebase_data.get('uid')
        self.email = firebase_data.get('email')
        self.name = firebase_data.get('name')
        
    @property
    def is_authenticated(self):
        """
        Sempre retorna True. Este é o método que o Django REST Framework
        usa para determinar se o usuário está autenticado.
        """
        return True
        
    @property
    def is_anonymous(self):
        """
        Sempre retorna False. Os usuários do Firebase nunca são anônimos.
        """
        return False
        
    def get_id(self):
        """
        Retorna o ID do usuário do Firebase.
        """
        return self.uid
    
    def __str__(self):
        return f"FirebaseUser: {self.email or self.uid}"
    
    def to_dict(self):
        """
        Retorna os dados do usuário como um dicionário.
        """
        return self.firebase_data

class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Autenticação baseada em Firebase para o Django REST Framework.
    Verifica o token JWT do Firebase e retorna o usuário do Firebase.
    """
    
    def authenticate(self, request):
        """
        Autentica a requisição baseada no token JWT do Firebase.
        """
        # Permitir acesso ao endpoint de categorias sem autenticação
        if request.path_info.startswith('/api/categorias/'):
            return None
            
        # Permitir acesso ao endpoint de saúde sem autenticação
        if request.path_info.startswith('/api/health'):
            return None
            
        # Permitir acesso ao endpoint raiz para testes
        if request.path_info == '/':
            return None
            
        # Verificar se o Firebase está disponível
        if not FIREBASE_AVAILABLE:
            logger.error("Firebase Admin SDK não está disponível. A autenticação não funcionará.")
            raise exceptions.AuthenticationFailed('Serviço de autenticação indisponível')
            
        # Verificar se o Firebase foi inicializado
        if not firebase_initialized:
            logger.warning("Firebase não inicializado. Você precisa configurar as credenciais do Firebase.")
            raise exceptions.AuthenticationFailed('Firebase não está configurado corretamente no servidor')
            
        # Obter o token Authorization do cabeçalho
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            # Se estamos em desenvolvimento, criar um usuário de teste
            if settings.DEBUG:
                test_user_data = {
                    'uid': 'user_teste_123',
                    'name': 'Usuário Teste',
                    'email': 'teste@example.com'
                }
                firebase_user = FirebaseUser(test_user_data)
                request.firebase_user = firebase_user
                logger.debug("Modo DEBUG: Usando usuário de teste para autenticação")
                return (firebase_user, 'user_teste_123')
            return None
        
        # Verificar o formato do token
        try:
            token_parts = auth_header.split()
            if token_parts[0].lower() != 'bearer':
                return None
            id_token = token_parts[1]
        except (IndexError, ValueError):
            return None
            
        # Verificar o token com o Firebase
        try:
            # Verificar token
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            
            # Criar uma instância de FirebaseUser em vez de usar o dicionário diretamente
            firebase_user = FirebaseUser(decoded_token)
            
            # Armazenar informações do Firebase no request
            request.firebase_user = firebase_user
            
            # Retornar o usuário do Firebase e as credenciais
            return (firebase_user, uid)
            
        except Exception as e:
            logger.error(f"Erro de autenticação Firebase: {str(e)}")
            raise exceptions.AuthenticationFailed('Token inválido ou expirado') 