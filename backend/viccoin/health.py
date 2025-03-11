from django.http import JsonResponse
from viccoin.firebase import db
import logging
import datetime
import time
import threading
from django.conf import settings

# Configurar logger
logger = logging.getLogger(__name__)

# Dicionário para armazenar o status de saúde
health_status = {
    'last_check': None,
    'firebase': {
        'status': 'unknown',
        'last_success': None,
        'last_failure': None,
        'error': None
    },
    'system': {
        'status': 'ok',
        'uptime': 0,
        'start_time': datetime.datetime.now().isoformat()
    }
}

# Intervalo de verificação em segundos
CHECK_INTERVAL = 60

def check_firebase_connection():
    """
    Verifica a conexão com o Firebase e atualiza o status de saúde.
    """
    try:
        # Tentar acessar o Firestore
        if db:
            # Tentar uma operação simples
            db.collection('health_checks').document('last_check').set({
                'timestamp': datetime.datetime.now().isoformat(),
                'status': 'ok'
            })
            
            # Atualizar status
            health_status['firebase']['status'] = 'ok'
            health_status['firebase']['last_success'] = datetime.datetime.now().isoformat()
            health_status['firebase']['error'] = None
            logger.info("Verificação de saúde do Firebase: OK")
            return True
    except Exception as e:
        # Registrar falha
        health_status['firebase']['status'] = 'error'
        health_status['firebase']['last_failure'] = datetime.datetime.now().isoformat()
        health_status['firebase']['error'] = str(e)
        logger.error(f"Erro na verificação de saúde do Firebase: {str(e)}")
        return False

def periodic_health_check():
    """
    Executa verificações de saúde periodicamente em segundo plano.
    """
    while True:
        try:
            # Atualizar timestamp da última verificação
            health_status['last_check'] = datetime.datetime.now().isoformat()
            
            # Verificar Firebase
            check_firebase_connection()
            
            # Atualizar uptime
            start_time = datetime.datetime.fromisoformat(health_status['system']['start_time'])
            now = datetime.datetime.now()
            health_status['system']['uptime'] = (now - start_time).total_seconds()
            
            # Aguardar até a próxima verificação
            time.sleep(CHECK_INTERVAL)
        except Exception as e:
            logger.error(f"Erro na verificação periódica de saúde: {str(e)}")
            time.sleep(CHECK_INTERVAL)

# Iniciar thread de verificação periódica
health_check_thread = threading.Thread(target=periodic_health_check, daemon=True)
health_check_thread.start()

def health_check_view(request):
    """
    View para retornar o status de saúde atual.
    """
    # Executar uma verificação imediata se solicitado
    if request.GET.get('check') == 'true':
        check_firebase_connection()
    
    # Preparar resposta
    response = {
        'timestamp': datetime.datetime.now().isoformat(),
        'last_check': health_status['last_check'],
        'services': {
            'firebase': health_status['firebase'],
            'system': health_status['system']
        },
        'status': 'ok' if health_status['firebase']['status'] == 'ok' else 'error'
    }
    
    # Definir código de status HTTP com base no status geral
    status_code = 200 if response['status'] == 'ok' else 500
    
    return JsonResponse(response, status=status_code) 