import hashlib
import logging
from viccoin.firebase import db
from .auth_utils import hash_password

# Configurar logger
logger = logging.getLogger(__name__)

def is_sha256_hash(password_hash):
    """
    Verifica se o hash fornecido está no formato SHA-256 (64 caracteres hexadecimais).
    
    Args:
        password_hash (str): Hash da senha armazenada
        
    Returns:
        bool: True se parece ser um hash SHA-256, False caso contrário
    """
    return len(password_hash) == 64 and all(c in '0123456789abcdefABCDEF' for c in password_hash)

def check_sha256_password(password, hashed_password):
    """
    Verifica se a senha corresponde ao hash SHA-256 armazenado.
    
    Args:
        password (str): Senha em texto simples para verificar
        hashed_password (str): Hash SHA-256 da senha
        
    Returns:
        bool: True se a senha corresponder ao hash, False caso contrário
    """
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return password_hash == hashed_password

def migrate_password_if_needed(user_id, password, current_hash):
    """
    Verifica se o hash da senha está no formato antigo (SHA-256) e o atualiza para bcrypt se necessário.
    
    Args:
        user_id (str): ID do usuário no Firestore
        password (str): Senha em texto simples (já verificada)
        current_hash (str): Hash atual da senha
        
    Returns:
        bool: True se a migração foi realizada, False caso contrário
    """
    # Verificar se o hash atual é SHA-256
    if not is_sha256_hash(current_hash):
        # Já está no formato bcrypt ou outro formato não reconhecido
        return False
    
    try:
        # Gerar novo hash bcrypt
        new_hash = hash_password(password)
        
        # Atualizar no Firestore
        user_ref = db.collection('users').document(user_id)
        user_ref.update({'password_hash': new_hash})
        
        logger.info(f"Senha migrada com sucesso para o usuário {user_id}")
        return True
    except Exception as e:
        logger.error(f"Erro ao migrar senha para o usuário {user_id}: {str(e)}")
        # Não propagar o erro, pois a autenticação já foi bem-sucedida
        return False 