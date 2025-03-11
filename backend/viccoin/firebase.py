import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings
import os
import json
import tempfile
import logging
import time
from functools import wraps
import datetime

# Configurar logger
logger = logging.getLogger(__name__)

# Configuração de retry
MAX_RETRIES = 3
RETRY_DELAY = 1  # segundos

def retry_on_exception(max_retries=MAX_RETRIES, delay=RETRY_DELAY):
    """
    Decorador para tentar novamente uma operação em caso de erro.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        logger.error(f"Falha após {max_retries} tentativas: {str(e)}", exc_info=True)
                        raise
                    
                    logger.warning(f"Tentativa {retries} falhou: {str(e)}. Tentando novamente em {delay}s...")
                    time.sleep(delay)
        return wrapper
    return decorator

@retry_on_exception()
def initialize_firebase():
    """
    Inicializa o SDK do Firebase Admin com as credenciais fornecidas.
    Retorna o cliente do Firestore.
    """
    try:
        # Verificar se o Firebase já foi inicializado
        app = firebase_admin.get_app()
        logger.info("Firebase já inicializado, retornando app existente")
        return firestore.client()
    except ValueError:
        # Inicializar o Firebase se ainda não estiver inicializado
        logger.info("Inicializando Firebase pela primeira vez")
        
        # Verificar se estamos em produção (Render) e usar a variável de ambiente
        firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS_JSON')
        
        if firebase_creds_json:
            logger.info("Usando credenciais do Firebase da variável de ambiente")
            try:
                # Tentar carregar diretamente como dicionário 
                creds_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(creds_dict)
                logger.info("Credenciais carregadas diretamente do JSON")
            except json.JSONDecodeError:
                logger.warning("Não foi possível carregar JSON diretamente, tentando arquivo temporário")
                # Se não conseguir, usar abordagem de arquivo temporário
                try:
                    with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp:
                        temp.write(firebase_creds_json.encode())
                        temp_path = temp.name
                    
                    logger.info(f"Arquivo temporário criado em: {temp_path}")
                    cred = credentials.Certificate(temp_path)
                    # Remover o arquivo após uso
                    os.unlink(temp_path)
                    logger.info("Credenciais carregadas via arquivo temporário")
                except Exception as e:
                    logger.error(f"Erro ao criar arquivo temporário: {str(e)}")
                    raise
        else:
            logger.info("Variável de ambiente FIREBASE_CREDENTIALS_JSON não encontrada, tentando arquivo local")
            
            # Verificar primeiro se o arquivo está no diretório raiz do projeto
            root_creds_path = os.path.join(os.path.dirname(settings.BASE_DIR), 'viccoin-a2fa7-firebase-adminsdk-fbsvc-9e866bc6d3.json')
            if os.path.exists(root_creds_path):
                logger.info(f"Usando arquivo de credenciais encontrado em: {root_creds_path}")
                cred = credentials.Certificate(root_creds_path)
            else:
                # Usar o caminho configurado nas settings como fallback
                creds_path = settings.FIREBASE_CREDENTIALS_PATH
                logger.info(f"Tentando usar arquivo de credenciais configurado: {creds_path}")
                
                if os.path.exists(creds_path):
                    cred = credentials.Certificate(creds_path)
                else:
                    # Tentar outros caminhos comuns
                    alternative_paths = [
                        os.path.join(settings.BASE_DIR, 'firebase-credentials.json'),
                        os.path.join(settings.BASE_DIR, 'firebase.json'),
                        os.path.join(settings.BASE_DIR.parent, 'firebase-credentials.json')
                    ]
                    
                    for path in alternative_paths:
                        if os.path.exists(path):
                            logger.info(f"Encontrado arquivo de credenciais alternativo em: {path}")
                            cred = credentials.Certificate(path)
                            break
                    else:
                        logger.error("Não foi possível encontrar o arquivo de credenciais do Firebase.")
                        raise FileNotFoundError(f"Arquivo de credenciais do Firebase não encontrado em: {creds_path} nem nos caminhos alternativos")
        
        try:    
            app = firebase_admin.initialize_app(cred)
            logger.info("Firebase inicializado com sucesso")
            return firestore.client()
        except Exception as e:
            logger.error(f"Erro na inicialização do Firebase: {str(e)}")
            raise

# Classe para encapsular operações do Firestore com retry
class FirestoreClient:
    def __init__(self):
        self.db = None
        self._initialize()
    
    def _initialize(self):
        """
        Inicializa o cliente Firestore com tratamento de erros.
        """
        try:
            self.db = initialize_firebase()
            logger.info("Cliente Firestore inicializado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao inicializar cliente Firestore: {str(e)}")
            # Não propagar o erro para evitar falha na inicialização da aplicação
            # O cliente tentará novamente nas operações subsequentes
    
    @retry_on_exception()
    def collection(self, collection_path):
        """
        Acessa uma coleção com retry em caso de falha.
        """
        return self.db.collection(collection_path)
    
    @retry_on_exception()
    def document(self, document_path):
        """
        Acessa um documento com retry em caso de falha.
        """
        return self.db.document(document_path)
    
    @retry_on_exception()
    def batch(self):
        """
        Cria um batch com retry em caso de falha.
        """
        return self.db.batch()
    
    @retry_on_exception()
    def transaction(self):
        """
        Cria uma transação com retry em caso de falha.
        """
        return self.db.transaction()
    
    @retry_on_exception()
    def add_despesa(self, user_id, dados_despesa):
        """
        Adiciona uma nova despesa à subcoleção 'despesas' de um usuário.
        
        Args:
            user_id: ID do documento do usuário
            dados_despesa: Dicionário com os dados da despesa
        
        Returns:
            ID do documento criado
        """
        try:
            despesa_ref = self.collection(f"users/{user_id}/despesas").add({
                'valor': float(dados_despesa.get('valor', 0)),
                'data': dados_despesa.get('data'),
                'descricao': dados_despesa.get('descricao', ''),
                'local': dados_despesa.get('local', ''),
                'categoria': dados_despesa.get('categoria', ''),
                'recorrente': dados_despesa.get('recorrente', False),
                'tipo': 'despesa'
            })
            
            # Atualiza o saldo do usuário
            usuario_ref = self.document(f"users/{user_id}")
            usuario = usuario_ref.get()
            
            if usuario.exists:
                saldo_atual = usuario.to_dict().get('saldo', 0)
                novo_saldo = saldo_atual - float(dados_despesa.get('valor', 0))
                usuario_ref.update({'saldo': novo_saldo})
            
            return despesa_ref[1].id
        except Exception as e:
            logger.error(f"Erro ao adicionar despesa: {str(e)}")
            raise
    
    @retry_on_exception()
    def add_ganho(self, user_id, dados_ganho):
        """
        Adiciona um novo ganho à subcoleção 'ganhos' de um usuário.
        
        Args:
            user_id: ID do documento do usuário
            dados_ganho: Dicionário com os dados do ganho
        
        Returns:
            ID do documento criado
        """
        try:
            ganho_ref = self.collection(f"users/{user_id}/ganhos").add({
                'valor': float(dados_ganho.get('valor', 0)),
                'data': dados_ganho.get('data'),
                'descricao': dados_ganho.get('descricao', ''),
                'categoria': dados_ganho.get('categoria', ''),
                'recorrente': dados_ganho.get('recorrente', False),
                'tipo': 'ganho'
            })
            
            # Atualiza o saldo do usuário
            usuario_ref = self.document(f"users/{user_id}")
            usuario = usuario_ref.get()
            
            if usuario.exists:
                saldo_atual = usuario.to_dict().get('saldo', 0)
                novo_saldo = saldo_atual + float(dados_ganho.get('valor', 0))
                usuario_ref.update({'saldo': novo_saldo})
            
            return ganho_ref[1].id
        except Exception as e:
            logger.error(f"Erro ao adicionar ganho: {str(e)}")
            raise
    
    @retry_on_exception()
    def add_salario(self, user_id, dados_salario):
        """
        Adiciona um novo registro de salário à subcoleção 'salario' de um usuário.
        
        Args:
            user_id: ID do documento do usuário
            dados_salario: Dicionário com os dados do salário
        
        Returns:
            ID do documento criado
        """
        try:
            salario_ref = self.collection(f"users/{user_id}/salario").add({
                'valor': float(dados_salario.get('valor', 0)),
                'data_recebimento': dados_salario.get('data_recebimento'),
                'periodo': dados_salario.get('periodo', 'mensal'),
                'recorrente': dados_salario.get('recorrente', True),
                'tipo': 'salario'
            })
            
            # Atualiza o saldo do usuário
            usuario_ref = self.document(f"users/{user_id}")
            usuario = usuario_ref.get()
            
            if usuario.exists:
                saldo_atual = usuario.to_dict().get('saldo', 0)
                novo_saldo = saldo_atual + float(dados_salario.get('valor', 0))
                usuario_ref.update({'saldo': novo_saldo})
            
            return salario_ref[1].id
        except Exception as e:
            logger.error(f"Erro ao adicionar salário: {str(e)}")
            raise
    
    @retry_on_exception()
    def get_transacoes(self, user_id, tipo=None, limite=10):
        """
        Obtém todas as transações (despesas, ganhos, salários) de um usuário.
        
        Args:
            user_id: ID do documento do usuário
            tipo: Tipo de transação (despesa, ganho, salario) ou None para todas
            limite: Número máximo de transações a retornar por tipo
            
        Returns:
            Lista de transações
        """
        transacoes = []
        
        try:
            if tipo is None or tipo == 'despesa':
                despesas_ref = self.collection(f"users/{user_id}/despesas").limit(limite).get()
                for despesa in despesas_ref:
                    dados = despesa.to_dict()
                    dados['id'] = despesa.id
                    transacoes.append(dados)
            
            if tipo is None or tipo == 'ganho':
                ganhos_ref = self.collection(f"users/{user_id}/ganhos").limit(limite).get()
                for ganho in ganhos_ref:
                    dados = ganho.to_dict()
                    dados['id'] = ganho.id
                    transacoes.append(dados)
            
            if tipo is None or tipo == 'salario':
                salarios_ref = self.collection(f"users/{user_id}/salario").limit(limite).get()
                for salario in salarios_ref:
                    dados = salario.to_dict()
                    dados['id'] = salario.id
                    transacoes.append(dados)
            
            return transacoes
        except Exception as e:
            logger.error(f"Erro ao obter transações: {str(e)}")
            raise

    @retry_on_exception()
    def get_transacoes_por_periodo(self, user_id, periodo=None, data_inicio=None, data_fim=None, tipo=None, limite=100):
        """
        Obtém transações de um usuário filtradas por período e/ou intervalo de datas.
        
        Args:
            user_id: ID do documento do usuário
            periodo: Período desejado ('semanal', 'mensal', 'anual') ou None
            data_inicio: Data inicial para filtro (formato 'YYYY-MM-DD')
            data_fim: Data final para filtro (formato 'YYYY-MM-DD')
            tipo: Tipo de transação ('despesa', 'ganho', 'salario') ou None para todas
            limite: Número máximo de transações a retornar por tipo
            
        Returns:
            Lista de transações filtradas e estatísticas agregadas
        """
        transacoes = []
        
        try:
            # Definir automaticamente intervalos de data com base no período, se não fornecidos
            if periodo and not (data_inicio and data_fim):
                hoje = datetime.datetime.now().date()
                if periodo == 'semanal':
                    # Início da semana (segunda-feira)
                    dia_semana = hoje.weekday()
                    data_inicio = (hoje - datetime.timedelta(days=dia_semana)).strftime('%Y-%m-%d')
                    data_fim = (hoje + datetime.timedelta(days=6-dia_semana)).strftime('%Y-%m-%d')
                elif periodo == 'mensal':
                    # Início do mês
                    data_inicio = hoje.replace(day=1).strftime('%Y-%m-%d')
                    # Fim do mês (trata diferentes números de dias por mês)
                    if hoje.month == 12:
                        data_fim = hoje.replace(year=hoje.year+1, month=1, day=1)
                    else:
                        data_fim = hoje.replace(month=hoje.month+1, day=1)
                    data_fim = (data_fim - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
                elif periodo == 'anual':
                    # Início do ano
                    data_inicio = hoje.replace(month=1, day=1).strftime('%Y-%m-%d')
                    # Fim do ano
                    data_fim = hoje.replace(month=12, day=31).strftime('%Y-%m-%d')
            
            logger.info(f"Consultando transações de {data_inicio} até {data_fim}")
            
            # Obter transações de cada tipo com filtros de data
            if tipo is None or tipo == 'despesa':
                despesas_query = self.collection(f"users/{user_id}/despesas")
                if data_inicio:
                    despesas_query = despesas_query.where('data', '>=', data_inicio)
                if data_fim:
                    despesas_query = despesas_query.where('data', '<=', data_fim)
                despesas_query = despesas_query.limit(limite)
                despesas_ref = despesas_query.get()
                
                for despesa in despesas_ref:
                    dados = despesa.to_dict()
                    dados['id'] = despesa.id
                    transacoes.append(dados)
            
            if tipo is None or tipo == 'ganho':
                ganhos_query = self.collection(f"users/{user_id}/ganhos")
                if data_inicio:
                    ganhos_query = ganhos_query.where('data', '>=', data_inicio)
                if data_fim:
                    ganhos_query = ganhos_query.where('data', '<=', data_fim)
                ganhos_query = ganhos_query.limit(limite)
                ganhos_ref = ganhos_query.get()
                
                for ganho in ganhos_ref:
                    dados = ganho.to_dict()
                    dados['id'] = ganho.id
                    transacoes.append(dados)
            
            if tipo is None or tipo == 'salario':
                salarios_query = self.collection(f"users/{user_id}/salario")
                if data_inicio:
                    salarios_query = salarios_query.where('data_recebimento', '>=', data_inicio)
                if data_fim:
                    salarios_query = salarios_query.where('data_recebimento', '<=', data_fim)
                salarios_query = salarios_query.limit(limite)
                salarios_ref = salarios_query.get()
                
                for salario in salarios_ref:
                    dados = salario.to_dict()
                    dados['id'] = salario.id
                    transacoes.append(dados)
            
            # Calcular estatísticas agregadas
            total_despesas = sum(t['valor'] for t in transacoes if t.get('tipo') == 'despesa')
            total_ganhos = sum(t['valor'] for t in transacoes if t.get('tipo') in ['ganho', 'salario'])
            saldo_periodo = total_ganhos - total_despesas
            
            # Agrupar por categoria
            categorias = {}
            for t in transacoes:
                categoria = t.get('categoria', 'Sem categoria')
                if categoria not in categorias:
                    categorias[categoria] = {
                        'despesas': 0,
                        'ganhos': 0
                    }
                
                if t.get('tipo') == 'despesa':
                    categorias[categoria]['despesas'] += float(t.get('valor', 0))
                else:
                    categorias[categoria]['ganhos'] += float(t.get('valor', 0))
            
            return {
                'transacoes': transacoes,
                'total_despesas': total_despesas,
                'total_ganhos': total_ganhos,
                'saldo_periodo': saldo_periodo,
                'categorias': categorias,
                'periodo': {
                    'tipo': periodo,
                    'data_inicio': data_inicio,
                    'data_fim': data_fim
                }
            }
        except Exception as e:
            logger.error(f"Erro ao obter transações por período: {str(e)}")
            raise

# Singleton para acesso global
firestore_client = FirestoreClient()

# Inicializar o cliente Firestore resiliente
try:
    db = initialize_firebase()
    logger.info("Cliente Firestore inicializado com sucesso")
except Exception as e:
    logger.error(f"Erro ao inicializar Firebase: {str(e)}")
    # Definir db como None para evitar erros de referência
    db = None 