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
        Configuração inicial da aplicação.
        No ambiente Render, usamos autenticação de teste, então não precisamos inicializar o Firebase.
        """
        # Não fazer nada se estamos executando em modo de migração ou coleta de estáticos
        if 'migrate' in sys.argv or 'collectstatic' in sys.argv or 'makemigrations' in sys.argv:
            return

        # Em produção no Render, estamos usando autenticação de teste
        # então não precisamos inicializar o Firebase
        try:
            from .authentication import set_firebase_initialized
            # Definir como inicializado para permitir testes
            set_firebase_initialized(True)
            logger.info("Usando autenticação de teste para o ambiente Render.")
        except Exception as e:
            logger.error(f"Erro ao configurar autenticação: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
