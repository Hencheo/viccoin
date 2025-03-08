from firebase_admin import firestore
from typing import Dict, Any, List, Type, TypeVar, Optional, Generic, Tuple
import logging
from datetime import datetime, timedelta
from .models import (FirestoreModel, Categoria, Despesa, ResumoPorCategoria, User, Budget, 
                    Subscription, Notification, Report, Receita, ConfiguracaoFinanceira, 
                    Saldo, ResumoMensal)

logger = logging.getLogger(__name__)

# Tipo genérico para os modelos
T = TypeVar('T', bound=FirestoreModel)

class FirestoreService(Generic[T]):
    """
    Serviço base para interação com as coleções do Firestore.
    Implementa operações CRUD e garante a criação da coleção se não existir.
    """
    collection_name: str
    model_class: Type[T]

    def __init__(self, collection_name: str, model_class: Type[T]):
        self.collection_name = collection_name
        self.model_class = model_class
        self._ensure_collection_exists()

    def _ensure_collection_exists(self) -> None:
        """
        Verifica se a coleção existe e a cria se necessário.
        No Firestore, as coleções são criadas automaticamente quando um documento é adicionado.
        """
        # No Firestore, não é necessário criar coleções explicitamente,
        # mas podemos verificar se ela existe
        db = firestore.client()
        collections = [col.id for col in db.collections()]
        
        if self.collection_name not in collections:
            logger.info(f"Coleção '{self.collection_name}' não existe ainda. "
                       f"Será criada automaticamente quando o primeiro documento for adicionado.")

    def get_collection(self):
        """Obtém a referência para a coleção."""
        db = firestore.client()
        return db.collection(self.collection_name)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção específica do usuário."""
        return self.get_collection()

    def get_all(self) -> List[T]:
        """Obtém todos os documentos da coleção."""
        docs = self.get_collection().stream()
        return [self.model_class.from_dict(doc.to_dict(), doc.id) for doc in docs]

    def get_by_id(self, doc_id: str) -> Optional[T]:
        """Obtém um documento pelo ID."""
        doc = self.get_collection().document(doc_id).get()
        if not doc.exists:
            return None
        return self.model_class.from_dict(doc.to_dict(), doc.id)

    def create(self, model: T, user_id: Optional[str] = None) -> T:
        """Cria um novo documento."""
        data = model.to_dict()
        if user_id:
            data['created_by'] = user_id
        data['created_at'] = firestore.SERVER_TIMESTAMP
        
        # Cria um novo documento com ID automático
        doc_ref = self.get_collection().document()
        doc_ref.set(data)
        
        # Retorna o modelo com o ID atualizado
        model.id = doc_ref.id
        return model

    def update(self, model: T, user_id: Optional[str] = None) -> T:
        """Atualiza um documento existente."""
        if not model.id:
            raise ValueError("O modelo precisa ter um ID para ser atualizado")
        
        data = model.to_dict()
        if user_id:
            data['updated_by'] = user_id
        data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        # Atualiza o documento
        self.get_collection().document(model.id).update(data)
        return model

    def delete(self, doc_id: str) -> bool:
        """Remove um documento."""
        self.get_collection().document(doc_id).delete()
        return True

    def query(self, filters: List[tuple]) -> List[T]:
        """Executa uma consulta com filtros na coleção."""
        query = self.get_collection()
        for field, op, value in filters:
            query = query.where(field, op, value)
        
        docs = query.stream()
        return [self.model_class.from_dict(doc.to_dict(), doc.id) for doc in docs]


class CategoriaService(FirestoreService[Categoria]):
    """Serviço para manipulação de categorias no Firestore."""
    
    def __init__(self):
        super().__init__("categorias", Categoria)
    
    def get_by_nome(self, nome: str) -> Optional[Categoria]:
        """Busca uma categoria pelo nome."""
        categorias = self.query([("nome", "==", nome)])
        return categorias[0] if categorias else None


class ResumoPorCategoriaService(FirestoreService[ResumoPorCategoria]):
    """Serviço para manipulação de resumos por categoria no Firestore."""
    
    def __init__(self):
        super().__init__("resumos_categorias", ResumoPorCategoria)
    
    def get_resumo(self, user_id: str, categoria_id: str, ano: int, mes: int) -> Optional[ResumoPorCategoria]:
        """Busca um resumo por usuário, categoria, ano e mês."""
        id_composto = f"{user_id}_{categoria_id}_{ano}_{mes:02d}"
        return self.get_by_id(id_composto)
    
    def get_resumos_por_periodo(self, user_id: str, ano: int, mes: int) -> List[ResumoPorCategoria]:
        """Busca todos os resumos de um usuário por período."""
        return self.query([
            ("user_id", "==", user_id),
            ("ano", "==", ano),
            ("mes", "==", mes)
        ])
    
    def atualizar_resumo(self, user_id: str, categoria_id: str, categoria_nome: str, 
                      valor: float, data: datetime) -> ResumoPorCategoria:
        """
        Atualiza ou cria um resumo por categoria. Usa transação para garantir atomicidade.
        """
        ano = data.year
        mes = data.month
        
        db = firestore.client()
        id_composto = f"{user_id}_{categoria_id}_{ano}_{mes:02d}"
        resumo_ref = self.get_collection().document(id_composto)
        
        @firestore.transactional
        def atualizar_resumo_transaction(transaction, resumo_ref):
            resumo_doc = resumo_ref.get(transaction=transaction)
            
            if resumo_doc.exists:
                # Atualiza o resumo existente
                resumo_atual = resumo_doc.to_dict()
                valor_total = resumo_atual.get('valor_total', 0) + valor
                
                transaction.update(resumo_ref, {
                    'valor_total': valor_total,
                    'updated_at': firestore.SERVER_TIMESTAMP,
                    'updated_by': user_id
                })
                
                resumo = ResumoPorCategoria.from_dict(resumo_atual, id_composto)
                resumo.valor_total = valor_total
            else:
                # Cria um novo resumo
                resumo = ResumoPorCategoria(
                    id=id_composto,
                    user_id=user_id,
                    categoria_id=categoria_id,
                    categoria_nome=categoria_nome,
                    valor_total=valor,
                    mes=mes,
                    ano=ano,
                    created_by=user_id,
                    created_at=firestore.SERVER_TIMESTAMP
                )
                
                transaction.set(resumo_ref, resumo.to_dict())
            
            return resumo
        
        # Executa a transação
        transaction = db.transaction()
        return atualizar_resumo_transaction(transaction, resumo_ref)


class DespesaService(FirestoreService[Despesa]):
    """Serviço para manipulação de despesas no Firestore."""
    
    def __init__(self):
        super().__init__("despesas", Despesa)
        self.categoria_service = CategoriaService()
        self.resumo_service = ResumoPorCategoriaService()
    
    def get_user_collection(self, user_id: str):
        """Obtém a coleção específica do usuário."""
        db = firestore.client()
        return db.collection("usuarios").document(user_id).collection("despesas")
    
    def get_all_by_user(self, user_id: str) -> List[Despesa]:
        """Obtém todas as despesas de um usuário."""
        docs = self.get_user_collection(user_id).stream()
        return [Despesa.from_dict(doc.to_dict(), doc.id) for doc in docs]
    
    def get_by_id_for_user(self, user_id: str, doc_id: str) -> Optional[Despesa]:
        """Obtém uma despesa específica de um usuário."""
        doc = self.get_user_collection(user_id).document(doc_id).get()
        if not doc.exists:
            return None
        return Despesa.from_dict(doc.to_dict(), doc.id)
    
    def get_by_categoria(self, user_id: str, categoria_id: str) -> List[Despesa]:
        """Busca despesas por categoria de um usuário específico."""
        docs = self.get_user_collection(user_id).where("categoria_id", "==", categoria_id).stream()
        return [Despesa.from_dict(doc.to_dict(), doc.id) for doc in docs]
    
    def get_by_periodo(self, user_id: str, data_inicio: Any, data_fim: Any) -> List[Despesa]:
        """Busca despesas por período de data de um usuário específico."""
        docs = self.get_user_collection(user_id)\
                   .where("data", ">=", data_inicio)\
                   .where("data", "<=", data_fim)\
                   .stream()
        return [Despesa.from_dict(doc.to_dict(), doc.id) for doc in docs]
    
    def pesquisa_avancada(self, user_id: str, filtros: dict) -> List[Despesa]:
        """
        Realiza uma pesquisa avançada de despesas com múltiplos filtros.
        
        Parâmetros:
            user_id (str): ID do usuário
            filtros (dict): Dicionário com os filtros a serem aplicados, pode incluir:
                - categoria_id (str): ID da categoria
                - data_inicio (datetime): Data inicial para filtragem
                - data_fim (datetime): Data final para filtragem
                - valor_min (float): Valor mínimo da despesa
                - valor_max (float): Valor máximo da despesa
                - metodo_pagamento (str): Método de pagamento (cartão, dinheiro, pix, etc)
                - tags (List[str]): Lista de tags para filtrar
                - texto (str): Texto para buscar na descrição ou observações
                - recorrente (bool): Se é uma despesa recorrente
                - parcelado (bool): Se é uma despesa parcelada
        
        Retorna:
            List[Despesa]: Lista de despesas que atendem aos critérios
        """
        # Iniciar com a coleção do usuário
        query = self.get_user_collection(user_id)
        
        # Aplicar filtros
        # Categoria
        if filtros.get('categoria_id'):
            query = query.where("categoria_id", "==", filtros['categoria_id'])
        
        # Período de data
        data_inicio = filtros.get('data_inicio')
        data_fim = filtros.get('data_fim')
        if data_inicio:
            query = query.where("data", ">=", data_inicio)
        if data_fim:
            query = query.where("data", "<=", data_fim)
        
        # Método de pagamento
        if filtros.get('metodo_pagamento'):
            query = query.where("metodo_pagamento", "==", filtros['metodo_pagamento'])
        
        # Recorrente
        if 'recorrente' in filtros:
            query = query.where("recorrente", "==", filtros['recorrente'])
        
        # Parcelado
        if 'parcelado' in filtros:
            query = query.where("parcelado", "==", filtros['parcelado'])
        
        # Executar a consulta
        docs = query.stream()
        despesas = [Despesa.from_dict(doc.to_dict(), doc.id) for doc in docs]
        
        # Filtros que precisam ser aplicados em memória (não suportados diretamente pelo Firestore)
        resultado = despesas
        
        # Filtrar por valor
        valor_min = filtros.get('valor_min')
        valor_max = filtros.get('valor_max')
        if valor_min is not None:
            resultado = [d for d in resultado if d.valor >= float(valor_min)]
        if valor_max is not None:
            resultado = [d for d in resultado if d.valor <= float(valor_max)]
        
        # Filtrar por tags (se a despesa tiver pelo menos uma das tags solicitadas)
        tags = filtros.get('tags', [])
        if tags:
            resultado = [d for d in resultado if any(tag in d.tags for tag in tags)]
        
        # Filtrar por texto na descrição ou observações
        texto = filtros.get('texto')
        if texto:
            texto = texto.lower()
            resultado = [d for d in resultado if 
                        (d.descricao and texto in d.descricao.lower()) or 
                        (d.observacoes and texto in d.observacoes.lower())]
        
        return resultado
    
    def create_with_categoria(self, despesa: Despesa, user_id: str) -> Tuple[Despesa, Categoria, ResumoPorCategoria]:
        """
        Cria uma despesa associada a um usuário e garante que a categoria exista.
        Atualiza também o resumo da categoria.
        Usa transação para garantir atomicidade.
        """
        if not user_id:
            raise ValueError("O ID do usuário é obrigatório")
        
        db = firestore.client()
        transaction = db.transaction()
        
        @firestore.transactional
        def criar_despesa_transaction(transaction):
            categoria = None
            categoria_id = despesa.categoria_id
            categoria_nome = despesa.categoria_nome
            
            # 1. Verificar ou criar categoria
            if categoria_id:
                categoria_doc = self.categoria_service.get_collection().document(categoria_id).get(transaction=transaction)
                if categoria_doc.exists:
                    categoria = Categoria.from_dict(categoria_doc.to_dict(), categoria_id)
                    categoria_nome = categoria.nome
                else:
                    # Se ID da categoria existe mas documento não
                    if categoria_nome:
                        # Tenta buscar pela nome (fora da transação)
                        categoria = self.categoria_service.get_by_nome(categoria_nome)
                        if categoria:
                            categoria_id = categoria.id
                        else:
                            # Cria categoria com nome fornecido
                            nova_categoria = Categoria(nome=categoria_nome)
                            categoria_ref = self.categoria_service.get_collection().document()
                            transaction.set(categoria_ref, nova_categoria.to_dict())
                            categoria_id = categoria_ref.id
                            categoria = nova_categoria
                            categoria.id = categoria_id
            elif categoria_nome:
                # Sem ID, mas com nome - tenta buscar por nome (fora da transação)
                categoria = self.categoria_service.get_by_nome(categoria_nome)
                if categoria:
                    categoria_id = categoria.id
                else:
                    # Cria categoria
                    nova_categoria = Categoria(nome=categoria_nome)
                    categoria_ref = self.categoria_service.get_collection().document()
                    transaction.set(categoria_ref, nova_categoria.to_dict())
                    categoria_id = categoria_ref.id
                    categoria = nova_categoria
                    categoria.id = categoria_id
                
                despesa.categoria_id = categoria_id
                despesa.categoria_nome = categoria_nome
            
            # 2. Atualiza a despesa com as informações da categoria
            despesa.categoria_id = categoria_id
            despesa.categoria_nome = categoria_nome
            despesa.user_id = user_id
            
            data_despesa = datetime.now()
            if not despesa.data:
                despesa.data = firestore.SERVER_TIMESTAMP
                data_para_resumo = data_despesa
            else:
                # Se já tem data, usa para resumo (pode ser timestamp)
                data_para_resumo = data_despesa
            
            # 3. Salva a despesa na coleção do usuário
            despesa_data = despesa.to_dict()
            despesa_data['created_by'] = user_id
            despesa_data['created_at'] = firestore.SERVER_TIMESTAMP
            
            despesa_ref = self.get_user_collection(user_id).document()
            transaction.set(despesa_ref, despesa_data)
            despesa.id = despesa_ref.id
            
            # 4. Atualiza o resumo por categoria
            resumo_id = f"{user_id}_{categoria_id}_{data_para_resumo.year}_{data_para_resumo.month:02d}"
            resumo_ref = self.resumo_service.get_collection().document(resumo_id)
            resumo_doc = resumo_ref.get(transaction=transaction)
            
            if resumo_doc.exists:
                # Atualiza resumo existente
                resumo_data = resumo_doc.to_dict()
                valor_total = resumo_data.get('valor_total', 0) + despesa.valor
                
                transaction.update(resumo_ref, {
                    'valor_total': valor_total,
                    'updated_at': firestore.SERVER_TIMESTAMP,
                    'updated_by': user_id
                })
                
                resumo = ResumoPorCategoria.from_dict(resumo_data, resumo_id)
                resumo.valor_total = valor_total
            else:
                # Cria novo resumo
                resumo = ResumoPorCategoria(
                    id=resumo_id,
                    user_id=user_id,
                    categoria_id=categoria_id,
                    categoria_nome=categoria_nome,
                    valor_total=despesa.valor,
                    mes=data_para_resumo.month,
                    ano=data_para_resumo.year,
                    created_by=user_id,
                    created_at=firestore.SERVER_TIMESTAMP
                )
                
                transaction.set(resumo_ref, resumo.to_dict())
            
            return despesa, categoria, resumo
        
        # Executa a transação
        return criar_despesa_transaction(transaction)
    
    def update_with_categoria(self, despesa: Despesa, old_despesa: Despesa, user_id: str) -> Tuple[Despesa, Optional[ResumoPorCategoria], Optional[ResumoPorCategoria]]:
        """
        Atualiza uma despesa e os resumos relacionados.
        Usa transação para garantir atomicidade.
        """
        if not user_id:
            raise ValueError("O ID do usuário é obrigatório")
        
        if not despesa.id:
            raise ValueError("O ID da despesa é obrigatório")
        
        db = firestore.client()
        transaction = db.transaction()
        
        @firestore.transactional
        def atualizar_despesa_transaction(transaction):
            # 1. Se a categoria mudou, verificar ou criar nova categoria
            categoria_alterada = (old_despesa.categoria_id != despesa.categoria_id) or (old_despesa.categoria_nome != despesa.categoria_nome)
            
            if categoria_alterada and (despesa.categoria_id or despesa.categoria_nome):
                categoria = None
                categoria_id = despesa.categoria_id
                categoria_nome = despesa.categoria_nome
                
                if categoria_id:
                    categoria_doc = self.categoria_service.get_collection().document(categoria_id).get(transaction=transaction)
                    if categoria_doc.exists:
                        categoria = Categoria.from_dict(categoria_doc.to_dict(), categoria_id)
                        categoria_nome = categoria.nome
                    else:
                        # Se ID existe mas documento não
                        if categoria_nome:
                            # Busca por nome (fora da transação)
                            categoria = self.categoria_service.get_by_nome(categoria_nome)
                            if categoria:
                                categoria_id = categoria.id
                            else:
                                # Cria categoria
                                nova_categoria = Categoria(nome=categoria_nome)
                                categoria_ref = self.categoria_service.get_collection().document()
                                transaction.set(categoria_ref, nova_categoria.to_dict())
                                categoria_id = categoria_ref.id
                                categoria = nova_categoria
                                categoria.id = categoria_id
                elif categoria_nome:
                    # Busca por nome
                    categoria = self.categoria_service.get_by_nome(categoria_nome)
                    if categoria:
                        categoria_id = categoria.id
                    else:
                        # Cria categoria
                        nova_categoria = Categoria(nome=categoria_nome)
                        categoria_ref = self.categoria_service.get_collection().document()
                        transaction.set(categoria_ref, nova_categoria.to_dict())
                        categoria_id = categoria_ref.id
                        categoria = nova_categoria
                        categoria.id = categoria_id
                
                despesa.categoria_id = categoria_id
                despesa.categoria_nome = categoria_nome
            
            # 2. Atualiza a despesa
            despesa.user_id = user_id
            despesa_data = despesa.to_dict()
            despesa_data['updated_by'] = user_id
            despesa_data['updated_at'] = firestore.SERVER_TIMESTAMP
            
            despesa_ref = self.get_user_collection(user_id).document(despesa.id)
            transaction.update(despesa_ref, despesa_data)
            
            # 3. Atualiza resumos
            old_resumo = None
            new_resumo = None
            
            # Se valor, categoria ou data mudou, precisamos atualizar resumos
            valor_alterado = old_despesa.valor != despesa.valor
            data_alterada = old_despesa.data != despesa.data
            
            if valor_alterado or categoria_alterada or data_alterada:
                # Determina as datas para os resumos
                data_old = datetime.fromtimestamp(old_despesa.data.timestamp()) if hasattr(old_despesa.data, 'timestamp') else datetime.now()
                data_new = datetime.fromtimestamp(despesa.data.timestamp()) if hasattr(despesa.data, 'timestamp') else datetime.now()
                
                # Resumo antigo (subtrai o valor antigo)
                old_resumo_id = f"{user_id}_{old_despesa.categoria_id}_{data_old.year}_{data_old.month:02d}"
                old_resumo_ref = self.resumo_service.get_collection().document(old_resumo_id)
                old_resumo_doc = old_resumo_ref.get(transaction=transaction)
                
                if old_resumo_doc.exists:
                    old_resumo_data = old_resumo_doc.to_dict()
                    novo_valor = max(0, old_resumo_data.get('valor_total', 0) - old_despesa.valor)
                    
                    transaction.update(old_resumo_ref, {
                        'valor_total': novo_valor,
                        'updated_at': firestore.SERVER_TIMESTAMP,
                        'updated_by': user_id
                    })
                    
                    old_resumo = ResumoPorCategoria.from_dict(old_resumo_data, old_resumo_id)
                    old_resumo.valor_total = novo_valor
                
                # Resumo novo (adiciona o valor novo)
                if categoria_alterada or data_alterada or old_resumo_id != f"{user_id}_{despesa.categoria_id}_{data_new.year}_{data_new.month:02d}":
                    new_resumo_id = f"{user_id}_{despesa.categoria_id}_{data_new.year}_{data_new.month:02d}"
                    new_resumo_ref = self.resumo_service.get_collection().document(new_resumo_id)
                    new_resumo_doc = new_resumo_ref.get(transaction=transaction)
                    
                    if new_resumo_doc.exists:
                        new_resumo_data = new_resumo_doc.to_dict()
                        novo_valor = new_resumo_data.get('valor_total', 0) + despesa.valor
                        
                        transaction.update(new_resumo_ref, {
                            'valor_total': novo_valor,
                            'updated_at': firestore.SERVER_TIMESTAMP,
                            'updated_by': user_id
                        })
                        
                        new_resumo = ResumoPorCategoria.from_dict(new_resumo_data, new_resumo_id)
                        new_resumo.valor_total = novo_valor
                    else:
                        new_resumo = ResumoPorCategoria(
                            id=new_resumo_id,
                            user_id=user_id,
                            categoria_id=despesa.categoria_id,
                            categoria_nome=despesa.categoria_nome,
                            valor_total=despesa.valor,
                            mes=data_new.month,
                            ano=data_new.year,
                            created_by=user_id,
                            created_at=firestore.SERVER_TIMESTAMP
                        )
                        
                        transaction.set(new_resumo_ref, new_resumo.to_dict())
                
            return despesa, old_resumo, new_resumo
        
        # Executa a transação
        return atualizar_despesa_transaction(transaction)
    
    def delete_with_update_resumo(self, user_id: str, despesa_id: str) -> bool:
        """
        Remove uma despesa e atualiza o resumo relacionado.
        Usa transação para garantir atomicidade.
        """
        if not user_id or not despesa_id:
            raise ValueError("IDs de usuário e despesa são obrigatórios")
        
        db = firestore.client()
        transaction = db.transaction()
        
        @firestore.transactional
        def excluir_despesa_transaction(transaction):
            # 1. Obtém a despesa
            despesa_ref = self.get_user_collection(user_id).document(despesa_id)
            despesa_doc = despesa_ref.get(transaction=transaction)
            
            if not despesa_doc.exists:
                return False
            
            despesa_data = despesa_doc.to_dict()
            valor = despesa_data.get('valor', 0)
            categoria_id = despesa_data.get('categoria_id', '')
            
            # 2. Determina a data para o resumo
            data_timestamp = despesa_data.get('data')
            if data_timestamp:
                # Tenta converter o timestamp
                try:
                    data = datetime.fromtimestamp(data_timestamp.timestamp())
                except (AttributeError, ValueError):
                    data = datetime.now()
            else:
                data = datetime.now()
            
            # 3. Atualiza o resumo
            resumo_id = f"{user_id}_{categoria_id}_{data.year}_{data.month:02d}"
            resumo_ref = self.resumo_service.get_collection().document(resumo_id)
            resumo_doc = resumo_ref.get(transaction=transaction)
            
            if resumo_doc.exists:
                resumo_data = resumo_doc.to_dict()
                novo_valor = max(0, resumo_data.get('valor_total', 0) - valor)
                
                transaction.update(resumo_ref, {
                    'valor_total': novo_valor,
                    'updated_at': firestore.SERVER_TIMESTAMP,
                    'updated_by': user_id
                })
            
            # 4. Exclui a despesa
            transaction.delete(despesa_ref)
            
            return True
        
        # Executa a transação
        return excluir_despesa_transaction(transaction)


class UserService(FirestoreService[User]):
    """Serviço para manipulação de usuários no Firestore."""
    
    def __init__(self):
        super().__init__("users", User)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Busca um usuário pelo e-mail."""
        users = self.query([("email", "==", email)])
        return users[0] if users else None
    
    def create_or_update_user(self, firebase_user: Dict[str, Any]) -> User:
        """Cria ou atualiza um usuário a partir dos dados do Firebase Auth."""
        # Verificar se o usuário já existe
        user_id = firebase_user.get('uid')
        existing_user = self.get_by_id(user_id)
        
        if existing_user:
            # Atualizar usuário existente
            existing_user.name = firebase_user.get('name', firebase_user.get('displayName', ''))
            existing_user.email = firebase_user.get('email', '')
            existing_user.profile_picture_url = firebase_user.get('photoURL', '')
            return self.update(existing_user)
        else:
            # Criar novo usuário
            new_user = User(
                id=user_id,
                name=firebase_user.get('name', firebase_user.get('displayName', '')),
                email=firebase_user.get('email', ''),
                profile_picture_url=firebase_user.get('photoURL', ''),
                settings={}
            )
            return self.create(new_user)
    
    def resetar_dados_usuario(self, user_id: str) -> bool:
        """
        Exclui todos os dados do usuário, mantendo a conta.
        Retorna True se a operação for bem-sucedida.
        """
        db = firestore.client()
        
        @firestore.transactional
        def reset_transaction(transaction):
            # Excluir despesas
            try:
                despesa_service = DespesaService()
                despesas = despesa_service.get_all_by_user(user_id)
                for despesa in despesas:
                    despesa_ref = db.collection("usuarios").document(user_id).collection("despesas").document(despesa.id)
                    transaction.delete(despesa_ref)
                
                # Excluir receitas
                receita_service = ReceitaService()
                receitas = receita_service.get_all_by_user(user_id)
                for receita in receitas:
                    receita_ref = db.collection("usuarios").document(user_id).collection("receitas").document(receita.id)
                    transaction.delete(receita_ref)
                
                # Excluir orçamentos
                budget_service = BudgetService()
                orçamentos_ref = db.collection("usuarios").document(user_id).collection("orcamentos")
                for orcamento in orçamentos_ref.stream():
                    transaction.delete(orcamento.reference)
                
                # Excluir assinaturas
                assinaturas_ref = db.collection("usuarios").document(user_id).collection("assinaturas")
                for assinatura in assinaturas_ref.stream():
                    transaction.delete(assinatura.reference)
                
                # Resetar resumos por categoria
                resumos_categoria_ref = db.collection("usuarios").document(user_id).collection("resumos_categoria")
                for resumo in resumos_categoria_ref.stream():
                    transaction.delete(resumo.reference)
                
                # Resetar resumos mensais
                resumos_mensais_ref = db.collection("usuarios").document(user_id).collection("resumos_mensais")
                for resumo in resumos_mensais_ref.stream():
                    transaction.delete(resumo.reference)
                
                # Resetar saldos
                saldos_ref = db.collection("usuarios").document(user_id).collection("saldos")
                for saldo in saldos_ref.stream():
                    transaction.delete(saldo.reference)
                
                # Resetar notificações
                notificacoes_ref = db.collection("usuarios").document(user_id).collection("notificacoes")
                for notificacao in notificacoes_ref.stream():
                    transaction.delete(notificacao.reference)
                
                # Resetar configurações financeiras
                config_ref = db.collection("configuracoes_financeiras").where("user_id", "==", user_id)
                for config in config_ref.stream():
                    transaction.delete(config.reference)
                
                # Manter o usuário, mas resetar suas configurações
                user = self.get_by_id(user_id)
                if user:
                    user.settings = {}  # Resetar configurações
                    user_ref = self.get_collection().document(user_id)
                    transaction.set(user_ref, user.to_dict())
                
                return True
            except Exception as e:
                logger.error(f"Erro dentro da transação ao resetar dados: {str(e)}")
                return False
            
        try:
            return reset_transaction(db.transaction())
        except Exception as e:
            logger.error(f"Erro ao resetar dados do usuário {user_id}: {str(e)}")
            return False


class BudgetService(FirestoreService[Budget]):
    """Serviço para manipulação de orçamentos no Firestore."""
    
    def __init__(self):
        super().__init__("budgets", Budget)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de orçamentos do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_by_categoria_periodo(self, user_id: str, categoria_id: str, ano: int, mes: int) -> Optional[Budget]:
        """Busca um orçamento pela categoria, ano e mês."""
        budgets = self.query([
            ("user_id", "==", user_id),
            ("categoria_id", "==", categoria_id),
            ("ano", "==", ano),
            ("mes", "==", mes)
        ])
        return budgets[0] if budgets else None
    
    def get_all_by_periodo(self, user_id: str, ano: int, mes: int) -> List[Budget]:
        """Busca todos os orçamentos de um usuário para um período específico."""
        return self.query([
            ("user_id", "==", user_id),
            ("ano", "==", ano),
            ("mes", "==", mes)
        ])
    
    def atualizar_gasto_atual(self, user_id: str, categoria_id: str, valor: float, ano: int, mes: int) -> Optional[Budget]:
        """Atualiza o gasto atual de um orçamento após uma nova despesa."""
        budget = self.get_by_categoria_periodo(user_id, categoria_id, ano, mes)
        
        if not budget:
            # Se não existe orçamento para a categoria, retornar None
            return None
        
        # Atualizar o gasto atual
        budget.gasto_atual += valor
        return self.update(budget)


class SubscriptionService(FirestoreService[Subscription]):
    """Serviço para manipulação de assinaturas no Firestore."""
    
    def __init__(self):
        super().__init__("subscriptions", Subscription)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de assinaturas do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_all_active_by_user(self, user_id: str) -> List[Subscription]:
        """Busca todas as assinaturas ativas de um usuário."""
        return self.query([
            ("user_id", "==", user_id),
            ("ativa", "==", True)
        ])
    
    def get_by_nome_servico(self, user_id: str, nome_servico: str) -> Optional[Subscription]:
        """Busca uma assinatura pelo nome do serviço."""
        assinaturas = self.query([
            ("user_id", "==", user_id),
            ("nome_servico", "==", nome_servico)
        ])
        return assinaturas[0] if assinaturas else None


class NotificationService(FirestoreService[Notification]):
    """Serviço para manipulação de notificações no Firestore."""
    
    def __init__(self):
        super().__init__("notifications", Notification)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de notificações do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_unread_by_user(self, user_id: str) -> List[Notification]:
        """Busca todas as notificações não lidas de um usuário."""
        return self.query([
            ("user_id", "==", user_id),
            ("lida", "==", False)
        ])
    
    def mark_as_read(self, notification_id: str) -> Notification:
        """Marca uma notificação como lida."""
        notification = self.get_by_id(notification_id)
        if not notification:
            raise ValueError(f"Notificação não encontrada: {notification_id}")
        
        notification.lida = True
        return self.update(notification)
    
    def create_budget_alert(self, user_id: str, categoria_nome: str, percentual: float) -> Notification:
        """Cria uma notificação de alerta de orçamento."""
        notification = Notification(
            user_id=user_id,
            mensagem=f"Você já usou {percentual:.0f}% do seu orçamento para {categoria_nome}.",
            tipo="alerta_orcamento",
            lida=False,
            data=datetime.now()
        )
        return self.create(notification)


class ReportService(FirestoreService[Report]):
    """Serviço para manipulação de relatórios no Firestore."""
    
    def __init__(self):
        super().__init__("reports", Report)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de relatórios do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_by_period(self, user_id: str, tipo: str, periodo_inicio: datetime, periodo_fim: datetime) -> Optional[Report]:
        """Busca um relatório por período."""
        reports = self.query([
            ("user_id", "==", user_id),
            ("tipo", "==", tipo),
            ("periodo_inicio", ">=", periodo_inicio),
            ("periodo_fim", "<=", periodo_fim)
        ])
        return reports[0] if reports else None


class ReceitaService(FirestoreService[Receita]):
    """Serviço para manipulação de receitas no Firestore."""
    
    def __init__(self):
        super().__init__("receitas", Receita)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de receitas do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_all_by_user(self, user_id: str) -> List[Receita]:
        """Busca todas as receitas de um usuário."""
        return self.query([
            ("user_id", "==", user_id)
        ])
    
    def get_by_periodo(self, user_id: str, data_inicio: Any, data_fim: Any) -> List[Receita]:
        """Busca receitas em um período específico."""
        return self.query([
            ("user_id", "==", user_id),
            ("data", ">=", data_inicio),
            ("data", "<=", data_fim)
        ])
        
    def get_by_categoria(self, user_id: str, categoria_id: str) -> List[Receita]:
        """Busca receitas por categoria."""
        return self.query([
            ("user_id", "==", user_id),
            ("categoria_id", "==", categoria_id)
        ])
    
    def get_recorrentes(self, user_id: str) -> List[Receita]:
        """Busca todas as receitas recorrentes de um usuário."""
        return self.query([
            ("user_id", "==", user_id),
            ("recorrente", "==", True)
        ])


class ConfiguracaoFinanceiraService(FirestoreService[ConfiguracaoFinanceira]):
    """Serviço para manipulação de configurações financeiras no Firestore."""
    
    def __init__(self):
        super().__init__("configuracoes_financeiras", ConfiguracaoFinanceira)
    
    def get_by_user(self, user_id: str) -> Optional[ConfiguracaoFinanceira]:
        """Busca as configurações financeiras de um usuário."""
        return self.get_by_id(user_id)
    
    def create_or_update(self, config: ConfiguracaoFinanceira) -> ConfiguracaoFinanceira:
        """Cria ou atualiza as configurações financeiras de um usuário."""
        existing_config = self.get_by_id(config.user_id)
        
        if existing_config:
            # Atualizar configuração existente
            config.id = existing_config.id
            return self.update(config)
        else:
            # Criar nova configuração
            config.id = config.user_id  # Usar user_id como ID do documento
            return self.create(config)
    
    def get_or_create_default(self, user_id: str) -> ConfiguracaoFinanceira:
        """Obtém ou cria configurações financeiras padrão para um usuário."""
        existing_config = self.get_by_user(user_id)
        
        if existing_config:
            return existing_config
        
        # Criar configuração padrão
        config = ConfiguracaoFinanceira(
            id=user_id,
            user_id=user_id,
            data_salario=5,
            valor_salario_base=0.0,
            notificar_saldo_baixo=True,
            limite_saldo_alerta=100.0,
            mostrar_previsao_fluxo=True
        )
        
        return self.create(config)


class SaldoService(FirestoreService[Saldo]):
    """Serviço para manipulação de saldos no Firestore."""
    
    def __init__(self):
        super().__init__("saldos", Saldo)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de saldos do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_saldo_atual(self, user_id: str) -> float:
        """Obtém o saldo atual do usuário."""
        # Buscar o registro de saldo mais recente
        saldos = self.query([
            ("user_id", "==", user_id)
        ])
        
        if not saldos:
            return 0.0
        
        # Ordenar por data decrescente
        saldos_ordenados = sorted(saldos, key=lambda s: s.data if s.data else datetime.min, reverse=True)
        return saldos_ordenados[0].valor
    
    def registrar_movimentacao(self, user_id: str, valor: float, tipo: str, 
                              referencia_id: str, descricao: str) -> Saldo:
        """Registra uma nova movimentação no saldo e atualiza o saldo atual."""
        # Obter saldo atual
        saldo_atual = self.get_saldo_atual(user_id)
        
        # Calcular novo saldo
        novo_saldo = saldo_atual
        if tipo == "receita":
            novo_saldo += valor
        elif tipo == "despesa":
            novo_saldo -= valor
        else:  # Ajuste manual
            novo_saldo = valor
        
        # Criar registro de saldo
        saldo = Saldo(
            user_id=user_id,
            valor=novo_saldo,
            data=datetime.now(),
            tipo_movimentacao=tipo,
            referencia_id=referencia_id,
            saldo_anterior=saldo_atual,
            descricao=descricao
        )
        
        return self.create(saldo)


class ResumoMensalService(FirestoreService[ResumoMensal]):
    """Serviço para manipulação de resumos mensais no Firestore."""
    
    def __init__(self):
        super().__init__("resumos_mensais", ResumoMensal)
    
    def get_user_collection(self, user_id: str):
        """Obtém a referência para a coleção de resumos mensais do usuário."""
        return self.get_collection().where("user_id", "==", user_id)
    
    def get_by_periodo(self, user_id: str, ano: int, mes: int) -> Optional[ResumoMensal]:
        """Busca o resumo mensal de um período específico."""
        resumos = self.query([
            ("user_id", "==", user_id),
            ("ano", "==", ano),
            ("mes", "==", mes)
        ])
        
        return resumos[0] if resumos else None
    
    def atualizar_resumo(self, user_id: str, ano: int, mes: int) -> ResumoMensal:
        """
        Atualiza ou cria o resumo mensal com base nas despesas e receitas do período.
        Este método pode ser computacionalmente intensivo para muitas transações.
        """
        # Buscar resumo existente ou criar um novo
        id_composto = f"{user_id}_{ano}_{mes:02d}"
        resumo = self.get_by_id(id_composto)
        
        if not resumo:
            resumo = ResumoMensal(
                id=id_composto,
                user_id=user_id,
                ano=ano,
                mes=mes
            )
        
        # Buscar todas as despesas do período
        despesa_service = DespesaService()
        receita_service = ReceitaService()
        saldo_service = SaldoService()
        
        # Definir datas do período
        inicio_mes = datetime(ano, mes, 1)
        if mes == 12:
            fim_mes = datetime(ano + 1, 1, 1) - timedelta(days=1)
        else:
            fim_mes = datetime(ano, mes + 1, 1) - timedelta(days=1)
        
        # Buscar despesas e receitas do período
        despesas = despesa_service.get_by_periodo(user_id, inicio_mes, fim_mes)
        receitas = receita_service.get_by_periodo(user_id, inicio_mes, fim_mes)
        
        # Calcular totais
        resumo.total_despesas = sum(d.valor for d in despesas)
        resumo.total_receitas = sum(r.valor for r in receitas)
        
        # Calcular por categoria
        despesas_por_categoria = {}
        for despesa in despesas:
            if despesa.categoria_id in despesas_por_categoria:
                despesas_por_categoria[despesa.categoria_id] += despesa.valor
            else:
                despesas_por_categoria[despesa.categoria_id] = despesa.valor
        
        receitas_por_categoria = {}
        for receita in receitas:
            if receita.categoria_id in receitas_por_categoria:
                receitas_por_categoria[receita.categoria_id] += receita.valor
            else:
                receitas_por_categoria[receita.categoria_id] = receita.valor
        
        resumo.despesas_por_categoria = despesas_por_categoria
        resumo.receitas_por_categoria = receitas_por_categoria
        
        # Calcular saldos
        # Para o saldo inicial, pegamos o último saldo do mês anterior
        data_fim_mes_anterior = inicio_mes - timedelta(days=1)
        saldos_anteriores = self.query([
            ("user_id", "==", user_id),
            ("data", "<=", data_fim_mes_anterior)
        ])
        
        if saldos_anteriores:
            saldos_ordenados = sorted(saldos_anteriores, key=lambda s: s.data if s.data else datetime.min, reverse=True)
            resumo.saldo_inicial = saldos_ordenados[0].valor
        else:
            resumo.saldo_inicial = 0.0
        
        # Saldo final é o inicial + receitas - despesas
        resumo.saldo_final = resumo.saldo_inicial + resumo.total_receitas - resumo.total_despesas
        
        # Economia real é a diferença entre receitas e despesas
        resumo.economia_real = resumo.total_receitas - resumo.total_despesas
        
        return self.create(resumo) if not resumo.id else self.update(resumo)


class IntegrationService:
    """
    Serviço de integração que combina múltiplos serviços para operações mais complexas.
    """
    
    def __init__(self):
        self.despesa_service = DespesaService()
        self.receita_service = ReceitaService()
        self.budget_service = BudgetService()
        self.categoria_service = CategoriaService()
        self.saldo_service = SaldoService()
        self.resumo_mensal_service = ResumoMensalService()
    
    def registrar_nova_despesa(self, despesa: Despesa, user_id: str) -> Tuple[Despesa, Optional[Budget], Optional[Notification]]:
        """
        Registra uma nova despesa e atualiza todas as entidades relacionadas:
        - Despesa
        - Orçamento da categoria
        - Saldo do usuário
        - Resumo da categoria
        - Gera notificação se necessário
        
        Returns:
            Tuple[Despesa, Optional[Budget], Optional[Notification]]: 
            A despesa criada, o orçamento atualizado (se existir) e a notificação (se gerada)
        """
        # 1. Criar a despesa com categoria
        despesa, categoria, resumo_categoria = self.despesa_service.create_with_categoria(despesa, user_id)
        
        # 2. Atualizar orçamento da categoria se existir
        # Extrair mês e ano da data da despesa
        data_despesa = despesa.data
        if isinstance(data_despesa, str):
            data_despesa = datetime.fromisoformat(data_despesa.replace('Z', '+00:00'))
            
        mes = data_despesa.month
        ano = data_despesa.year
        
        # Verificar se existe orçamento para a categoria
        orcamento = self.budget_service.get_by_categoria_periodo(
            user_id, despesa.categoria_id, ano, mes
        )
        
        notificacao = None
        if orcamento:
            # Atualizar o gasto atual
            orcamento = self.budget_service.atualizar_gasto_atual(
                user_id, despesa.categoria_id, despesa.valor, ano, mes
            )
            
            # Verificar se deve gerar notificação de alerta (80% ou mais do orçamento)
            if orcamento.limite > 0 and orcamento.gasto_atual >= 0.8 * orcamento.limite:
                percentual = (orcamento.gasto_atual / orcamento.limite) * 100
                notificacao_service = NotificationService()
                notificacao = notificacao_service.create_budget_alert(
                    user_id, despesa.categoria_nome, percentual
                )
        
        # 3. Atualizar saldo do usuário
        saldo_atual = self.saldo_service.get_saldo_atual(user_id)
        self.saldo_service.registrar_movimentacao(
            user_id=user_id,
            valor=despesa.valor,
            tipo="despesa",
            referencia_id=despesa.id,
            descricao=f"Despesa: {despesa.descricao}"
        )
        
        return despesa, orcamento, notificacao
    
    def criar_assinatura_com_despesa(self, subscription: Subscription, user_id: str) -> Tuple[Subscription, Despesa]:
        """
        Cria uma assinatura e registra a primeira despesa associada.
        
        Returns:
            Tuple[Subscription, Despesa]: A assinatura e a despesa criadas
        """
        # 1. Criar a assinatura
        subscription_service = SubscriptionService()
        subscription = subscription_service.create(subscription)
        
        # 2. Criar a despesa associada
        despesa = Despesa(
            user_id=user_id,
            descricao=f"Assinatura: {subscription.nome_servico}",
            valor=subscription.valor,
            data=datetime.now(),
            categoria_id=subscription.categoria_id,
            categoria_nome=subscription.categoria_nome,
            metodo_pagamento="cartão",  # Assumindo cartão como padrão
            recorrente=True,
            parcelado=False
        )
        
        # Registrar a despesa com todas as integrações
        despesa, _, _ = self.registrar_nova_despesa(despesa, user_id)
        
        return subscription, despesa
    
    def registrar_receita(self, receita: Receita, user_id: str) -> Tuple[Receita, Saldo, Optional[ResumoMensal]]:
        """
        Registra uma nova receita e atualiza todas as entidades relacionadas:
        - Receita
        - Saldo do usuário
        - Resumo mensal
        
        Returns:
            Tuple[Receita, Saldo, Optional[ResumoMensal]]: 
            A receita criada, o saldo atualizado e o resumo mensal atualizado (se existir)
        """
        # 1. Criar a receita
        receita = self.receita_service.create(receita)
        
        # 2. Atualizar saldo do usuário
        saldo_atual = self.saldo_service.get_saldo_atual(user_id)
        saldo = self.saldo_service.registrar_movimentacao(
            user_id=user_id,
            valor=receita.valor,
            tipo="receita",
            referencia_id=receita.id,
            descricao=f"Receita: {receita.descricao}"
        )
        
        # 3. Atualizar resumo mensal
        data_receita = receita.data
        if isinstance(data_receita, str):
            data_receita = datetime.fromisoformat(data_receita.replace('Z', '+00:00'))
            
        mes = data_receita.month
        ano = data_receita.year
        
        resumo = self.resumo_mensal_service.atualizar_resumo(user_id, ano, mes)
        
        return receita, saldo, resumo


class OrcamentoAutomaticoService:
    """
    Serviço para geração automática de previsões de orçamento baseadas no histórico do usuário.
    """
    
    def __init__(self):
        self.despesa_service = DespesaService()
        self.budget_service = BudgetService()
        self.categoria_service = CategoriaService()
    
    def gerar_previsao_orcamento(self, user_id: str, mes_alvo: int, ano_alvo: int, 
                                 meses_historico: int = 3) -> List[Budget]:
        """
        Gera uma previsão de orçamento para o próximo período com base no histórico.
        
        Args:
            user_id: ID do usuário
            mes_alvo: Mês alvo para a previsão (1-12)
            ano_alvo: Ano alvo para a previsão
            meses_historico: Quantidade de meses a considerar no histórico (padrão: 3)
            
        Returns:
            Lista de orçamentos previstos para cada categoria
        """
        # 1. Calcular o período de histórico
        hoje = datetime.now()
        data_fim = datetime(ano_alvo, mes_alvo, 1) - timedelta(days=1)  # Último dia do mês anterior
        
        # Determinar data de início do histórico (N meses para trás)
        data_inicio = data_fim - timedelta(days=30 * meses_historico)
        
        # 2. Obter todas as despesas do período para análise
        despesas = self._obter_despesas_periodo(user_id, data_inicio, data_fim)
        
        # 3. Agrupar despesas por categoria e calcular estatísticas
        estatisticas_por_categoria = self._calcular_estatisticas_por_categoria(despesas)
        
        # 4. Gerar orçamentos previstos baseados nas estatísticas
        orcamentos_previstos = self._gerar_orcamentos_previstos(
            user_id, estatisticas_por_categoria, mes_alvo, ano_alvo
        )
        
        return orcamentos_previstos
    
    def _obter_despesas_periodo(self, user_id: str, data_inicio: datetime, data_fim: datetime) -> List[Despesa]:
        """
        Obtém todas as despesas no período especificado.
        """
        return self.despesa_service.get_by_periodo(user_id, data_inicio, data_fim)
    
    def _calcular_estatisticas_por_categoria(self, despesas: List[Despesa]) -> Dict[str, Dict]:
        """
        Calcula estatísticas de gastos por categoria.
        
        Returns:
            Dict com chaves sendo IDs de categoria e valores sendo dicionários com estatísticas:
            {
                'categoria_id': {
                    'categoria_nome': 'Nome da Categoria',
                    'total': 1000.0,  # Total gasto no período
                    'media_mensal': 333.33,  # Média mensal
                    'max_mensal': 400.0,  # Máximo gasto em um mês
                    'tendencia': 0.1,  # Tendência de aumento/diminuição (percentual)
                    'count': 10,  # Quantidade de despesas
                }
            }
        """
        # Agrupar despesas por categoria
        despesas_por_categoria = {}
        despesas_por_categoria_mes = {}
        
        for despesa in despesas:
            # Inicializar dicionários se necessário
            if despesa.categoria_id not in despesas_por_categoria:
                despesas_por_categoria[despesa.categoria_id] = {
                    'categoria_nome': despesa.categoria_nome,
                    'total': 0.0,
                    'count': 0,
                    'valores': []
                }
            
            # Calcular chave do mês
            data = despesa.data
            if isinstance(data, str):
                data = datetime.fromisoformat(data.replace('Z', '+00:00'))
            mes_ano = f"{data.year}-{data.month:02d}"
            
            # Inicializar dicionário para mês/ano se necessário
            if mes_ano not in despesas_por_categoria_mes:
                despesas_por_categoria_mes[mes_ano] = {}
            
            if despesa.categoria_id not in despesas_por_categoria_mes[mes_ano]:
                despesas_por_categoria_mes[mes_ano][despesa.categoria_id] = 0.0
            
            # Atualizar totais
            despesas_por_categoria[despesa.categoria_id]['total'] += despesa.valor
            despesas_por_categoria[despesa.categoria_id]['count'] += 1
            despesas_por_categoria[despesa.categoria_id]['valores'].append(despesa.valor)
            despesas_por_categoria_mes[mes_ano][despesa.categoria_id] += despesa.valor
        
        # Calcular estatísticas por categoria
        meses_unicos = list(despesas_por_categoria_mes.keys())
        meses_unicos.sort()  # Ordenar cronologicamente
        num_meses = len(meses_unicos)
        
        estatisticas = {}
        for categoria_id, stats in despesas_por_categoria.items():
            # Calcular média mensal
            media_mensal = stats['total'] / num_meses if num_meses > 0 else 0
            
            # Calcular máximo gasto em um único mês
            max_mensal = 0
            for mes in despesas_por_categoria_mes.values():
                if categoria_id in mes:
                    max_mensal = max(max_mensal, mes[categoria_id])
            
            # Calcular tendência (aumento/diminuição percentual)
            tendencia = 0
            if num_meses >= 2:
                # Pegar os dois últimos meses para tendência
                ultimo_mes = meses_unicos[-1]
                penultimo_mes = meses_unicos[-2]
                
                valor_ultimo = despesas_por_categoria_mes[ultimo_mes].get(categoria_id, 0)
                valor_penultimo = despesas_por_categoria_mes[penultimo_mes].get(categoria_id, 0)
                
                if valor_penultimo > 0:
                    tendencia = (valor_ultimo - valor_penultimo) / valor_penultimo
            
            estatisticas[categoria_id] = {
                'categoria_nome': stats['categoria_nome'],
                'total': stats['total'],
                'media_mensal': media_mensal,
                'max_mensal': max_mensal,
                'tendencia': tendencia,
                'count': stats['count']
            }
        
        return estatisticas
    
    def _gerar_orcamentos_previstos(self, user_id: str, estatisticas: Dict[str, Dict], 
                                   mes_alvo: int, ano_alvo: int) -> List[Budget]:
        """
        Gera orçamentos previstos baseados nas estatísticas calculadas.
        
        A previsão considera:
        - Média mensal de gastos
        - Tendência de aumento/diminuição
        - Máximo gasto em um único mês (para categorias essenciais)
        - Sazonalidades (se tiver dados suficientes)
        
        Returns:
            Lista de objetos Budget com os orçamentos previstos
        """
        orcamentos = []
        
        # Obter todas as categorias (mesmo as que não têm despesas no período)
        todas_categorias = self.categoria_service.get_all()
        
        for categoria in todas_categorias:
            # Ignorar categoria de receitas
            if categoria.nome.lower() == "renda" or categoria.nome.lower() == "receitas":
                continue
                
            # Buscar estatísticas para a categoria, se disponíveis
            stats = estatisticas.get(categoria.id, {
                'categoria_nome': categoria.nome,
                'total': 0.0,
                'media_mensal': 0.0,
                'max_mensal': 0.0,
                'tendencia': 0.0,
                'count': 0
            })
            
            # Determinar valor previsto para a categoria
            valor_previsto = self._calcular_valor_previsto(stats, mes_alvo, ano_alvo)
            
            # Calcular nível de confiança
            confianca = self._calcular_confianca(stats)
            
            # Calcular meta de economia (5-15% dependendo do tipo de categoria)
            # Categorias essenciais têm meta menor, categorias de lazer têm meta maior
            categorias_essenciais = ["alimentação", "moradia", "saúde", "transporte"]
            if categoria.nome.lower() in categorias_essenciais:
                meta_economia = 0.05  # 5% para categorias essenciais
            else:
                meta_economia = 0.15  # 15% para categorias não-essenciais
            
            # Criar orçamento previsto
            orcamento = Budget(
                user_id=user_id,
                categoria_id=categoria.id,
                categoria_nome=categoria.nome,
                limite=valor_previsto,
                gasto_atual=0.0,  # Começa zerado pois é uma previsão futura
                periodo="mensal",
                mes=mes_alvo,
                ano=ano_alvo,
                is_previsao=True,
                confianca=confianca,
                meta_economia=meta_economia,
                fonte_dados=f"Histórico de {stats['count']} transações"
            )
            
            # Definir ID composto
            orcamento.id = orcamento.get_id_composto()
            
            orcamentos.append(orcamento)
        
        return orcamentos
    
    def _calcular_valor_previsto(self, stats: Dict, mes_alvo: int, ano_alvo: int) -> float:
        """
        Calcula o valor previsto para uma categoria baseado nas estatísticas.
        
        Args:
            stats: Estatísticas da categoria
            mes_alvo: Mês alvo (1-12)
            ano_alvo: Ano alvo
            
        Returns:
            Valor previsto para o orçamento
        """
        # Partir da média mensal
        valor_base = stats['media_mensal']
        
        # Aplicar ajuste de tendência (limitado a 30% para evitar extremos)
        tendencia = max(min(stats['tendencia'], 0.3), -0.3)
        valor_com_tendencia = valor_base * (1 + tendencia)
        
        # Para categorias com poucas transações, usar um valor mais conservador
        if stats['count'] < 3:
            # Se tiver poucos dados, inclinar mais para o máximo mensal
            valor_previsto = max(valor_com_tendencia, stats['max_mensal'] * 0.8)
        else:
            # Com mais dados, confiar mais na tendência
            valor_previsto = valor_com_tendencia
        
        # Arredondar para 2 casas decimais
        return round(valor_previsto, 2)
    
    def _calcular_confianca(self, stats: Dict) -> float:
        """
        Calcula um percentual de confiança na previsão baseado na quantidade e consistência dos dados.
        
        Returns:
            Valor entre 0 e 1 representando a confiança na previsão
        """
        # Fatores que aumentam a confiança:
        # - Maior número de transações (count)
        # - Consistência nos valores (baixo desvio padrão)
        confianca_base = min(stats['count'] / 10, 1.0)  # 10+ transações = confiança máxima
        
        # Se não tiver transações, confiança zero
        if stats['count'] == 0:
            return 0.0
            
        # Se tiver apenas uma transação, confiança baixa
        if stats['count'] == 1:
            return 0.3
        
        # Calcular desvio padrão para avaliar consistência
        valores = stats.get('valores', [])
        if len(valores) > 1:
            import numpy as np
            desvio_padrao = np.std(valores)
            media = np.mean(valores)
            
            # Coeficiente de variação (CV) = desvio/média
            # Quanto menor o CV, mais consistentes são os dados
            if media > 0:
                cv = desvio_padrao / media
                fator_consistencia = max(1.0 - cv, 0.0)  # CV de 0 = consistência máxima
            else:
                fator_consistencia = 0.5  # Valor neutro se média for zero
        else:
            fator_consistencia = 0.5  # Valor neutro se não tiver dados suficientes
        
        # Calcular confiança final (média ponderada)
        confianca = (confianca_base * 0.7) + (fator_consistencia * 0.3)
        
        return round(min(confianca, 1.0), 2)  # Limitar entre 0 e 1, com 2 casas decimais
    
    def aplicar_previsao(self, user_id: str, orcamentos_previstos: List[Budget], 
                         substituir_existentes: bool = False) -> List[Budget]:
        """
        Aplica os orçamentos previstos ao Firestore, opcionalmente substituindo existentes.
        
        Args:
            user_id: ID do usuário
            orcamentos_previstos: Lista de orçamentos previstos
            substituir_existentes: Se deve substituir orçamentos existentes
            
        Returns:
            Lista de orçamentos salvos
        """
        resultados = []
        
        for orcamento in orcamentos_previstos:
            # Verificar se já existe um orçamento para esta categoria no mesmo período
            existente = self.budget_service.get_by_categoria_periodo(
                user_id, orcamento.categoria_id, orcamento.ano, orcamento.mes
            )
            
            if existente and not substituir_existentes:
                # Se existe e não deve substituir, pular
                continue
                
            # Garantir que está marcado como previsão automática
            orcamento.is_previsao = True
                
            # Salvar o orçamento
            salvo = self.budget_service.create(orcamento)
            resultados.append(salvo)
        
        return resultados 