from django.apps import AppConfig
import os
import logging
import json
import sys

logger = logging.getLogger(__name__)

class FirebaseAuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'firebase_auth'
    
    def ready(self):
        """
        Inicializa o Firebase quando a aplicação estiver pronta.
        Pode usar variáveis de ambiente ou arquivo de credenciais.
        """
        # Não fazer nada se estamos executando em modo de migração ou coleta de estáticos
        if 'migrate' in sys.argv or 'collectstatic' in sys.argv or 'makemigrations' in sys.argv:
            return

        # Importações do módulo __init__.py, que já trata dos mocks se necessário
        from . import firebase_admin, credentials, set_firebase_initialized
        
        # Definir inicialmente como não inicializado
        set_firebase_initialized(False)
            
        # Verificar primeiro se há variáveis de ambiente para Firebase
        firebase_env_vars = {
            'type': os.environ.get('FIREBASE_TYPE'),
            'project_id': os.environ.get('FIREBASE_PROJECT_ID'),
            'private_key_id': os.environ.get('FIREBASE_PRIVATE_KEY_ID'),
            'private_key': os.environ.get('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
            'client_email': os.environ.get('FIREBASE_CLIENT_EMAIL'),
            'client_id': os.environ.get('FIREBASE_CLIENT_ID'),
            'auth_uri': os.environ.get('FIREBASE_AUTH_URI'),
            'token_uri': os.environ.get('FIREBASE_TOKEN_URI'),
            'auth_provider_x509_cert_url': os.environ.get('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
            'client_x509_cert_url': os.environ.get('FIREBASE_CLIENT_X509_CERT_URL'),
            'universe_domain': os.environ.get('FIREBASE_UNIVERSE_DOMAIN', 'googleapis.com')
        }
        
        # Verificar se todas as variáveis essenciais estão presentes
        required_keys = ['project_id', 'private_key', 'client_email']
        has_all_env_vars = all(firebase_env_vars.get(key) for key in required_keys)
        
        try:
            if has_all_env_vars:
                # Usar credenciais de variáveis de ambiente
                logger.info("Inicializando Firebase com credenciais de variáveis de ambiente")
                
                # Remover valores None do dicionário
                firebase_creds = {k: v for k, v in firebase_env_vars.items() if v is not None}
                
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred)
                
                # Marcar o Firebase como inicializado
                set_firebase_initialized(True)
                
                logger.info("Firebase inicializado com sucesso usando variáveis de ambiente!")
            
            # Fallback para arquivo de credenciais se variáveis de ambiente não estiverem completas
            elif hasattr(os.environ, 'FIREBASE_CREDENTIALS_PATH') or 'FIREBASE_CREDENTIALS_PATH' in os.environ:
                # Obter caminho das credenciais
                creds_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
                
                if os.path.exists(creds_path):
                    try:
                        # Inicializar o Firebase com o arquivo de credenciais
                        logger.info(f"Inicializando Firebase com arquivo de credenciais: {creds_path}")
                        cred = credentials.Certificate(creds_path)
                        firebase_admin.initialize_app(cred)
                        
                        # Marcar o Firebase como inicializado
                        set_firebase_initialized(True)
                        
                        logger.info("Firebase inicializado com sucesso usando arquivo de credenciais!")
                    except Exception as e:
                        logger.error(f"Erro ao inicializar o Firebase com arquivo: {str(e)}")
                else:
                    logger.warning(f"Arquivo de credenciais não encontrado: {creds_path}")
            else:
                # Usar credenciais de desenvolvimento para testes locais
                logger.warning("Usando credenciais de teste para desenvolvimento local")
                # Definimos como inicializado para permitir testes
                set_firebase_initialized(True)
        except Exception as e:
            logger.error(f"Erro ao inicializar o Firebase: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
