import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings
import os
import json
import tempfile
import logging
import time
from functools import wraps

# Configurar logger
logger = logging.getLogger(__name__)

# Configuração de retry
MAX_RETRIES = 3
RETRY_DELAY = 1  # segundos

def retry_on_exception(max_retries=MAX_RETRIES, delay=RETRY_DELAY):
    """
    Decorador para tentar novamente uma operação em caso de erro.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"Falha após {max_retries} tentativas: {str(e)}", exc_info=True)
                        raise
                    
                    logger.warning(f"Tentativa {retries} falhou: {str(e)}. Tentando novamente em {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry_on_exception()
def initialize_firebase():
    """
    Inicializa o SDK do Firebase Admin com as credenciais fornecidas.
    Retorna o cliente do Firestore.
    """
    try:
        # Verificar se o Firebase já foi inicializado
        app = firebase_admin.get_app()
        logger.info("Firebase já inicializado, retornando app existente")
        return firestore.client()
    except ValueError:
        # Inicializar o Firebase se ainda não estiver inicializado
        logger.info("Inicializando Firebase pela primeira vez")
        
        # Verificar se estamos em produção (Render) e usar a variável de ambiente
        firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS_JSON')
        
        if firebase_creds_json:
            logger.info("Usando credenciais do Firebase da variável de ambiente")
            try:
                # Tentar carregar diretamente como dicionário 
                creds_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(creds_dict)
                logger.info("Credenciais carregadas diretamente do JSON")
            except json.JSONDecodeError:
                logger.warning("Não foi possível carregar JSON diretamente, tentando arquivo temporário")
                # Se não conseguir, usar abordagem de arquivo temporário
                try:
                    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp:
                        temp.write(firebase_creds_json.encode())
                        temp_path = temp.name
                    
                    logger.info(f"Arquivo temporário criado em: {temp_path}")
                    cred = credentials.Certificate(temp_path)
                    # Remover o arquivo após uso
                    os.unlink(temp_path)
                    logger.info("Credenciais carregadas via arquivo temporário")
                except Exception as e:
                    logger.error(f"Erro ao criar arquivo temporário: {str(e)}")
                    raise
        else:
            logger.info("Usando arquivo de credenciais local")
            # Estamos em ambiente local, usar o arquivo de credenciais
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        
        try:    
            app = firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado com sucesso")
            return firestore.client()
        except Exception as e:
            logger.error(f"Erro na inicialização do Firebase: {str(e)}")
            raise

# Classe para encapsular operações do Firestore com retry
class FirestoreClient:
    def __init__(self):
        self.db = None
        self._initialize()
    
    def _initialize(self):
        """Inicializa o cliente do Firestore."""
        if self.db is None:
            try:
                self.db = initialize_firebase()
                logger.info("Cliente Firestore inicializado com sucesso")
            except Exception as e:
                logger.error(f"Erro ao inicializar cliente Firestore: {str(e)}")
                raise
    
    @retry_on_exception()
    def collection(self, collection_path):
        """Wrapper para db.collection com retry."""
        self._initialize()
        return self.db.collection(collection_path)
    
    @retry_on_exception()
    def document(self, document_path):
        """Wrapper para db.document com retry."""
        self._initialize()
        return self.db.document(document_path)
    
    @retry_on_exception()
    def batch(self):
        """Wrapper para db.batch com retry."""
        self._initialize()
        return self.db.batch()
    
    @retry_on_exception()
    def transaction(self):
        """Wrapper para db.transaction com retry."""
        self._initialize()
        return self.db.transaction()

# Criar uma instância do cliente Firestore resiliente
try:
    db_client = FirestoreClient()
    db = db_client.db
    logger.info("Cliente Firestore inicializado com sucesso")
except Exception as e:
    logger.error(f"Erro ao inicializar cliente Firestore: {str(e)}")
    # Não vamos re-levantar a exceção aqui para evitar quebrar a inicialização do Django
    # Mas precisamos definir db para evitar erros de referência
    db = None 