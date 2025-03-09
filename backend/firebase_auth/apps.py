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

        # Importações dentro do método para evitar problemas de dependência circular
        try:
            from .authentication import set_firebase_initialized
        except ImportError:
            logger.error("Erro ao importar authentication.py")
            return
            
        try:
            import firebase_admin
            from firebase_admin import credentials
            # Firebase está disponível - verificamos a existência de credenciais
            firebase_available = True
        except ImportError:
            logger.error("Firebase Admin SDK não disponível. Tentando instalar...")
            import subprocess
            try:
                subprocess.check_call(["pip", "install", "firebase-admin"])
                import firebase_admin
                from firebase_admin import credentials
                firebase_available = True
                logger.info("Firebase Admin SDK instalado com sucesso")
            except Exception as e:
                logger.critical(f"Não foi possível instalar o Firebase Admin SDK: {str(e)}")
                firebase_available = False
                raise ImportError(f"Firebase Admin SDK não disponível: {str(e)}")
            
        # Definir como False inicialmente, pode mudar se a inicialização tiver sucesso
        set_firebase_initialized(False)
            
        # Se Firebase não está disponível, abortamos
        if not firebase_available:
            logger.critical("Firebase Admin SDK não disponível. A aplicação pode não funcionar corretamente.")
            return
            
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
            # Antes de inicializar, verificar se já existe alguma app do Firebase
            try:
                # Se já existe uma app, não precisa inicializar de novo
                default_app = firebase_admin.get_app()
                logger.info("Firebase já inicializado. Usando app existente.")
                set_firebase_initialized(True)
                return
            except ValueError:
                # Nenhuma app encontrada, vamos criar uma nova
                pass
                
            if has_all_env_vars:
                # Usar credenciais de variáveis de ambiente
                logger.info("Inicializando Firebase com credenciais de variáveis de ambiente")
                
                # Remover valores None do dicionário
                firebase_creds = {k: v for k, v in firebase_env_vars.items() if v is not None}
                
                # Para depuração, escreva as credenciais (exceto a private_key)
                debug_creds = firebase_creds.copy()
                if 'private_key' in debug_creds:
                    debug_creds['private_key'] = '***REDACTED***'
                logger.debug(f"Credenciais Firebase: {debug_creds}")
                
                cred = credentials.Certificate(firebase_creds)
                firebase_admin.initialize_app(cred)
                
                # Marcar o Firebase como inicializado
                set_firebase_initialized(True)
                
                logger.info("Firebase inicializado com sucesso usando variáveis de ambiente!")
            
            # Fallback para arquivo de credenciais se variáveis de ambiente não estiverem completas
            elif 'FIREBASE_CREDENTIALS_PATH' in os.environ:
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
            
            # Se estamos em modo DEBUG, podemos usar o usuário de teste
            elif os.environ.get('DEBUG', 'false').lower() == 'true':
                logger.warning("Modo DEBUG: Firebase não inicializado, mas iremos permitir autenticação com usuário de teste")
                set_firebase_initialized(True)
            else:
                # Não conseguimos inicializar o Firebase
                logger.critical("Não foi possível inicializar o Firebase. Verifique as credenciais.")
                
        except Exception as e:
            logger.error(f"Erro ao inicializar o Firebase: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
