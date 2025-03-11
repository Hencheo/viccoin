import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings
import os
import json
import tempfile
import logging

# Configurar logger
logger = logging.getLogger(__name__)

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

# Criar uma instância do cliente Firestore
try:
    db = initialize_firebase()
    logger.info("Cliente Firestore inicializado com sucesso")
except Exception as e:
    logger.error(f"Erro ao inicializar cliente Firestore: {str(e)}")
    # Não vamos re-levantar a exceção aqui para evitar quebrar a inicialização do Django
    # Mas precisamos definir db para evitar erros de referência
    db = None 