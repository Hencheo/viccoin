import bcrypt
import jwt
import datetime
from django.conf import settings
import logging

# Configurar logger
logger = logging.getLogger(__name__)

# Chave secreta para tokens JWT
JWT_SECRET = settings.SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DELTA = datetime.timedelta(days=1)  # Token válido por 1 dia

def hash_password(password):
    """
    Cria um hash seguro da senha usando bcrypt.
    
    Args:
        password (str): Senha em texto simples
        
    Returns:
        str: Hash da senha em formato string
    """
    # Gera o salt e o hash da senha
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt)
    return hashed.decode('utf-8')  # Retorna o hash como string

def check_password(password, hashed_password):
    """
    Verifica se a senha corresponde ao hash armazenado.
    
    Args:
        password (str): Senha em texto simples para verificar
        hashed_password (str): Hash da senha armazenado
        
    Returns:
        bool: True se a senha corresponder ao hash, False caso contrário
    """
    try:
        return bcrypt.checkpw(password.encode(), hashed_password.encode())
    except Exception as e:
        logger.error(f"Erro ao verificar senha: {str(e)}")
        return False

def generate_token(user_id, email):
    """
    Gera um token JWT para o usuário autenticado.
    
    Args:
        user_id (str): ID único do usuário
        email (str): Email do usuário
        
    Returns:
        str: Token JWT
    """
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + JWT_EXPIRATION_DELTA,
        'iat': datetime.datetime.utcnow()
    }
    
    try:
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return token
    except Exception as e:
        logger.error(f"Erro ao gerar token: {str(e)}")
        return None

def validate_token(token):
    """
    Valida um token JWT.
    
    Args:
        token (str): Token JWT a ser validado
        
    Returns:
        dict or None: Payload do token se válido, None caso contrário
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expirado")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token inválido: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Erro ao validar token: {str(e)}")
        return None

def token_required(view_func):
    """
    Decorador para verificar se o token JWT é válido.
    
    Args:
        view_func (callable): Função de view a ser decorada
        
    Returns:
        callable: Função wrapper que verifica o token
    """
    from functools import wraps
    from django.http import JsonResponse
    
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Obter token do cabeçalho Authorization
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return JsonResponse({
                'success': False,
                'message': 'Token de autenticação não fornecido'
            }, status=401)
        
        # Verificar formato do cabeçalho (Bearer {token})
        parts = auth_header.split()
        if parts[0].lower() != 'bearer' or len(parts) != 2:
            return JsonResponse({
                'success': False,
                'message': 'Formato de token inválido'
            }, status=401)
        
        token = parts[1]
        payload = validate_token(token)
        
        if payload is None:
            return JsonResponse({
                'success': False,
                'message': 'Token inválido ou expirado'
            }, status=401)
        
        # Adicionar informações do usuário ao request para uso na view
        request.user_id = payload.get('user_id')
        request.user_email = payload.get('email')
        
        # Tudo certo, continuar para a view
        return view_func(request, *args, **kwargs)
    
    return wrapper 