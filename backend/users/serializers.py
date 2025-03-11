import json
from django.core.exceptions import ValidationError

class UserSerializer:
    """
    Serializer para validar e transformar dados de usuário.
    """
    
    @staticmethod
    def validate_registration(request_data):
        """
        Valida os dados de registro de um usuário.
        
        Args:
            request_data (dict): Dados da requisição.
            
        Returns:
            dict: Dados validados.
            
        Raises:
            ValidationError: Se os dados não forem válidos.
        """
        errors = {}
        
        # Verificar campos obrigatórios
        required_fields = ['email', 'password', 'nome']
        for field in required_fields:
            if field not in request_data:
                errors[field] = 'Este campo é obrigatório.'
        
        # Verificar se há erros
        if errors:
            raise ValidationError(errors)
        
        # Validar email
        email = request_data.get('email')
        if email and '@' not in email:
            errors['email'] = 'Email inválido.'
        
        # Validar senha
        password = request_data.get('password')
        if password and len(password) < 6:
            errors['password'] = 'A senha deve ter pelo menos 6 caracteres.'
        
        # Verificar se há erros
        if errors:
            raise ValidationError(errors)
        
        # Retornar dados validados
        return {
            'email': email,
            'password': password,
            'nome': request_data.get('nome')
        }
    
    @staticmethod
    def validate_login(request_data):
        """
        Valida os dados de login de um usuário.
        
        Args:
            request_data (dict): Dados da requisição.
            
        Returns:
            dict: Dados validados.
            
        Raises:
            ValidationError: Se os dados não forem válidos.
        """
        errors = {}
        
        # Verificar campos obrigatórios
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in request_data:
                errors[field] = 'Este campo é obrigatório.'
        
        # Verificar se há erros
        if errors:
            raise ValidationError(errors)
        
        # Retornar dados validados
        return {
            'email': request_data.get('email'),
            'password': request_data.get('password')
        }
    
    @staticmethod
    def serialize(user):
        """
        Serializa um objeto User para JSON.
        
        Args:
            user (User): Objeto User a ser serializado.
            
        Returns:
            dict: Dados do usuário em formato JSON.
        """
        if user is None:
            return None
        
        # Criar dicionário com dados do usuário
        user_dict = {
            'uid': user.uid,
            'email': user.email,
            'nome': user.nome,
            'saldo': user.saldo
        }
        
        # Adicionar atributos extras
        for attr, value in user.__dict__.items():
            if attr not in ['uid', 'email', 'nome', 'saldo', 'password_hash']:
                user_dict[attr] = value
        
        return user_dict 