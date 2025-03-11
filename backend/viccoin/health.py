from django.http import JsonResponse
from viccoin.firebase import db
import logging
import datetime
import time
import threading
from django.conf import settings

# Configurar logger
logger = logging.getLogger(__name__)

# Cache para armazenar o resultado do último teste
health_status = {
    'last_check': None,
    'firebase': {
        'status': 'unknown',
        'last_success': None,
        'error': None
    },
    'system': {
        'status': 'ok',
        'start_time': datetime.datetime.now().isoformat()
    }
}

# Configuração
CHECK_INTERVAL = 60  # segundos

def check_firebase_connection():
    """
    Verifica a conexão com o Firebase e atualiza o status.
    """
    try:
        # Tentar realizar uma operação simples para verificar a conexão
        test_ref = db.collection('health_checks').document('connection')
        test_ref.set({
            'timestamp': datetime.datetime.now().isoformat(),
            'environment': 'render' if not settings.DEBUG else 'development'
        })
        
        # Ler o documento para confirmar a operação
        test_ref.get()
        
        # Atualizar status
        health_status['firebase']['status'] = 'ok'
        health_status['firebase']['last_success'] = datetime.datetime.now().isoformat()
        health_status['firebase']['error'] = None
        
        return True
    except Exception as e:
        logger.error(f"Erro na verificação de saúde do Firebase: {str(e)}", exc_info=True)
        
        # Atualizar status
        health_status['firebase']['status'] = 'error'
        health_status['firebase']['error'] = str(e)
        
        return False

def periodic_health_check():
    """
    Executa verificações de saúde periodicamente em background.
    """
    while True:
        try:
            # Atualizar timestamp
            health_status['last_check'] = datetime.datetime.now().isoformat()
            
            # Verificar Firebase
            check_firebase_connection()
            
            # Aguardar próxima verificação
            time.sleep(CHECK_INTERVAL)
        except Exception as e:
            logger.error(f"Erro na verificação periódica de saúde: {str(e)}", exc_info=True)
            time.sleep(CHECK_INTERVAL)

# Iniciar verificação periódica em background
health_check_thread = threading.Thread(target=periodic_health_check, daemon=True)
health_check_thread.start()

def health_check_view(request):
    """
    View para verificar a saúde da aplicação.
    """
    # Executar verificação na hora se o último check for muito antigo
    if health_status['last_check'] is None:
        health_status['last_check'] = datetime.datetime.now().isoformat()
        check_firebase_connection()
    
    status_code = 200
    if health_status['firebase']['status'] != 'ok':
        status_code = 500
    
    return JsonResponse({
        'timestamp': datetime.datetime.now().isoformat(),
        'services': {
            'firebase': health_status['firebase'],
            'system': health_status['system']
        },
        'last_check': health_status['last_check']
    }, status=status_code) 