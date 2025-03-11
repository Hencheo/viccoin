from viccoin.firebase import db
from .models import User
import hashlib

class UserService:
    """
    Serviço para operações relacionadas a usuários no Firestore.
    """
    
    @staticmethod
    def create_user(email, password, nome):
        """
        Cria um novo usuário no Firestore.
        
        Args:
            email (str): Email do usuário.
            password (str): Senha do usuário (será armazenada com hash).
            nome (str): Nome do usuário.
            
        Returns:
            User: Objeto User criado.
            
        Raises:
            ValueError: Se o email já estiver em uso.
        """
        # Verificar se o usuário já existe
        users_ref = db.collection('users')
        query = users_ref.where('email', '==', email).limit(1)
        results = query.get()
        
        if len(results) > 0:
            raise ValueError('Email já está em uso')
        
        # Criar hash da senha
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Criar novo usuário
        new_user = User(email=email, nome=nome, saldo=0.0)
        new_user.password_hash = password_hash
        
        # Salvar usuário no Firestore
        user_ref = users_ref.document()
        user_ref.set(new_user.to_dict())
        
        # Atualizar UID do usuário
        new_user.uid = user_ref.id
        
        return new_user
    
    @staticmethod
    def verify_user(email, password):
        """
        Verifica as credenciais do usuário.
        
        Args:
            email (str): Email do usuário.
            password (str): Senha do usuário.
            
        Returns:
            User or None: Objeto User se as credenciais forem válidas, None caso contrário.
        """
        # Criar hash da senha
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Buscar usuário por email
        users_ref = db.collection('users')
        query = users_ref.where('email', '==', email).limit(1)
        results = query.get()
        
        if len(results) == 0:
            return None
        
        # Verificar senha
        user_data = results[0].to_dict()
        if user_data.get('password_hash') != password_hash:
            return None
        
        # Criar objeto User
        user = User.from_dict(user_data, uid=results[0].id)
        
        return user
    
    @staticmethod
    def get_user_by_id(uid):
        """
        Obtém um usuário pelo ID.
        
        Args:
            uid (str): ID único do usuário.
            
        Returns:
            User or None: Objeto User se o usuário existir, None caso contrário.
        """
        user_ref = db.collection('users').document(uid)
        user_data = user_ref.get().to_dict()
        
        if user_data is None:
            return None
            
        return User.from_dict(user_data, uid=uid)
    
    @staticmethod
    def update_user(user):
        """
        Atualiza um usuário no Firestore.
        
        Args:
            user (User): Objeto User a ser atualizado.
            
        Returns:
            bool: True se a atualização for bem-sucedida, False caso contrário.
        """
        if user.uid is None:
            return False
            
        user_ref = db.collection('users').document(user.uid)
        user_ref.update(user.to_dict())
        
        return True 