from django.apps import AppConfig
import os
import logging
import json

logger = logging.getLogger(__name__)

class FirebaseAuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'firebase_auth'
    
    def ready(self):
        """
        Inicializa o Firebase quando a aplicação estiver pronta.
        Pode usar variáveis de ambiente ou arquivo de credenciais.
        """
        from django.conf import settings
        import firebase_admin
        from firebase_admin import credentials
        
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
                from .authentication import firebase_initialized
                globals()['firebase_initialized'] = True
                
                logger.info("Firebase inicializado com sucesso usando variáveis de ambiente!")
            
            # Fallback para arquivo de credenciais se variáveis de ambiente não estiverem completas
            elif hasattr(settings, 'FIREBASE_CREDENTIALS_PATH') and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
                try:
                    # Inicializar o Firebase com o arquivo de credenciais
                    logger.info("Inicializando Firebase com arquivo de credenciais")
                    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                    firebase_admin.initialize_app(cred)
                    
                    # Marcar o Firebase como inicializado
                    from .authentication import firebase_initialized
                    globals()['firebase_initialized'] = True
                    
                    logger.info("Firebase inicializado com sucesso usando arquivo de credenciais!")
                except Exception as e:
                    logger.error(f"Erro ao inicializar o Firebase com arquivo: {str(e)}")
            else:
                logger.warning(
                    "Credenciais do Firebase não encontradas nas variáveis de ambiente ou no arquivo. "
                    "Configure as variáveis de ambiente FIREBASE_* ou o arquivo de credenciais em: %s", 
                    getattr(settings, 'FIREBASE_CREDENTIALS_PATH', 'Caminho não configurado')
                )
        except Exception as e:
            logger.error(f"Erro ao inicializar o Firebase: {str(e)}")
