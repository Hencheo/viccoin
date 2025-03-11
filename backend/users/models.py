from django.db import models

class User:
    """
    Classe que representa um usuário no sistema.
    Não é um modelo Django, já que estamos usando Firebase como banco de dados.
    """
    def __init__(self, uid=None, email=None, nome=None, saldo=0.0, **kwargs):
        """
        Inicializa um novo usuário.
        
        Args:
            uid (str, opcional): ID único do usuário no Firebase Auth.
            email (str, opcional): Email do usuário.
            nome (str, opcional): Nome do usuário.
            saldo (float, opcional): Saldo inicial do usuário. Padrão é 0.0.
            **kwargs: Atributos adicionais do usuário.
        """
        self.uid = uid
        self.email = email
        self.nome = nome
        self.saldo = saldo
        
        # Adicionar atributos extras
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self):
        """
        Converte o usuário em um dicionário para armazenamento no Firestore.
        
        Returns:
            dict: Dicionário com os atributos do usuário.
        """
        user_dict = {
            'email': self.email,
            'nome': self.nome,
            'saldo': self.saldo,
        }
        
        # Adicionar atributos extras
        for attr, value in self.__dict__.items():
            if attr not in ['uid', 'email', 'nome', 'saldo']:
                user_dict[attr] = value
        
        return user_dict
    
    @classmethod
    def from_dict(cls, user_dict, uid=None):
        """
        Cria um objeto User a partir de um dicionário do Firestore.
        
        Args:
            user_dict (dict): Dicionário com os atributos do usuário.
            uid (str, opcional): ID único do usuário no Firebase Auth.
            
        Returns:
            User: Objeto User criado a partir do dicionário.
        """
        if user_dict is None:
            return None
        
        # Extrair campos conhecidos
        email = user_dict.get('email')
        nome = user_dict.get('nome')
        saldo = user_dict.get('saldo', 0.0)
        
        # Criar usuário com campos conhecidos
        user = cls(uid=uid, email=email, nome=nome, saldo=saldo)
        
        # Adicionar campos extras
        for key, value in user_dict.items():
            if key not in ['email', 'nome', 'saldo']:
                setattr(user, key, value)
        
        return user
