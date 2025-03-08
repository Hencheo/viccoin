from django.db import models
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime

# Create your models here.

@dataclass
class FirestoreModel:
    """Classe base para modelos de dados do Firestore."""
    id: Optional[str] = None
    created_at: Any = None
    updated_at: Any = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto em um dicionário para salvar no Firestore."""
        # Filtra campos None, exceto se forem explicitamente definidos como None
        return {k: v for k, v in self.__dict__.items() if v is not None or k in self.__dataclass_fields__}

    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        """Cria uma instância da classe a partir de um dicionário do Firestore."""
        if doc_id:
            data['id'] = doc_id
        # Filtra campos que não existem no modelo
        filtered_data = {k: v for k, v in data.items() if k in cls.__dataclass_fields__}
        return cls(**filtered_data)

@dataclass
class User(FirestoreModel):
    """Representa um usuário do sistema."""
    name: str = ""
    email: str = ""
    profile_picture_url: str = ""
    settings: Dict[str, Any] = field(default_factory=dict)
    
@dataclass
class Categoria(FirestoreModel):
    """Representa uma categoria de despesa."""
    nome: str = ""
    descricao: str = ""
    cor: str = "#000000"  # Cor em formato hexadecimal para UI
    icone: str = ""  # Nome ou código do ícone
    limite_mensal: float = 0.0  # Limite de gastos mensal para esta categoria
    ordem: int = 0  # Ordem de exibição

@dataclass
class Despesa(FirestoreModel):
    """Representa uma despesa/transação."""
    descricao: str = ""
    valor: float = 0.0
    data: Any = None  # Data da despesa - será um timestamp
    categoria_id: str = ""  # ID da categoria
    categoria_nome: str = ""  # Nome da categoria (desnormalização para consultas rápidas)
    metodo_pagamento: str = ""  # Cartão, dinheiro, pix, etc.
    observacoes: str = ""
    comprovante_url: str = ""  # URL para comprovante/recibo
    tags: List[str] = field(default_factory=list)
    recorrente: bool = False
    parcelado: bool = False
    numero_parcelas: int = 1
    parcela_atual: int = 1
    user_id: str = ""  # ID do usuário proprietário da despesa

@dataclass
class Budget(FirestoreModel):
    """Representa um orçamento mensal para uma categoria."""
    user_id: str = ""  # ID do usuário
    categoria_id: str = ""  # ID da categoria
    categoria_nome: str = ""  # Nome da categoria (desnormalização)
    limite: float = 0.0  # Valor limite para a categoria
    gasto_atual: float = 0.0  # Valor já gasto
    periodo: str = "mensal"  # Período: mensal, semanal, anual
    mes: int = 0  # Mês do orçamento (1-12)
    ano: int = 0  # Ano do orçamento
    is_previsao: bool = False  # Indica se o orçamento foi gerado automaticamente
    confianca: float = 0.0  # Confiança na previsão (0.0 a 1.0)
    meta_economia: float = 0.0  # Meta de economia (redução) sugerida
    fonte_dados: str = ""  # Fonte dos dados usados para previsão
    
    def get_id_composto(self) -> str:
        """Gera um ID composto para o documento baseado em user_id, categoria_id, mês e ano."""
        return f"{self.user_id}_{self.categoria_id}_{self.ano}_{self.mes:02d}"

@dataclass
class Subscription(FirestoreModel):
    """Representa uma assinatura recorrente."""
    user_id: str = ""  # ID do usuário
    nome_servico: str = ""  # Nome do serviço
    valor: float = 0.0  # Valor da assinatura
    data_renovacao: Any = None  # Próxima data de cobrança
    frequencia: str = "mensal"  # Frequência: mensal, anual, etc.
    categoria_id: str = ""  # ID da categoria
    categoria_nome: str = ""  # Nome da categoria
    ativa: bool = True  # Se a assinatura está ativa
    
@dataclass
class Notification(FirestoreModel):
    """Representa uma notificação para o usuário."""
    user_id: str = ""  # ID do usuário
    mensagem: str = ""  # Conteúdo da notificação
    tipo: str = ""  # Tipo da notificação (alerta_orcamento, lembrete_assinatura, etc.)
    lida: bool = False  # Se a notificação foi lida
    data: Any = None  # Data da notificação
    
@dataclass
class Report(FirestoreModel):
    """Representa um relatório gerado para o usuário."""
    user_id: str = ""  # ID do usuário
    tipo: str = ""  # Tipo do relatório (diario, semanal, mensal)
    data_geracao: Any = None  # Data de geração
    dados: Dict[str, Any] = field(default_factory=dict)  # Dados do relatório
    periodo_inicio: Any = None  # Data de início do período
    periodo_fim: Any = None  # Data de fim do período

@dataclass
class ResumoPorCategoria(FirestoreModel):
    """Representa um resumo de gastos por categoria para um usuário."""
    user_id: str = ""  # ID do usuário
    categoria_id: str = ""  # ID da categoria
    categoria_nome: str = ""  # Nome da categoria
    valor_total: float = 0.0  # Valor total gasto na categoria
    mes: int = 0  # Mês do resumo (1-12)
    ano: int = 0  # Ano do resumo
    
    def get_id_composto(self) -> str:
        """Gera um ID composto para o documento baseado em user_id, categoria_id, mês e ano."""
        return f"{self.user_id}_{self.categoria_id}_{self.ano}_{self.mes:02d}"

@dataclass
class Receita(FirestoreModel):
    """Representa uma receita (entrada de dinheiro) do usuário."""
    user_id: str = ""  # ID do usuário
    tipo: str = ""  # Tipo de receita (salario, freelancer, presente, venda, mesada, etc.)
    valor: float = 0.0  # Valor da receita
    data: Any = None  # Data do recebimento
    descricao: str = ""  # Descrição opcional
    recorrente: bool = False  # Se é um recebimento recorrente
    frequencia: str = ""  # Frequência (mensal, semanal, etc. - para recorrentes)
    data_proxima: Any = None  # Próxima data esperada (para recorrentes)
    categoria_id: str = ""  # Referência opcional a uma categoria de receitas
    categoria_nome: str = ""  # Nome da categoria (desnormalização para consultas rápidas)
    comprovante_url: str = ""  # URL para comprovante/recibo

@dataclass
class ConfiguracaoFinanceira(FirestoreModel):
    """Representa as configurações financeiras de um usuário."""
    user_id: str = ""  # ID do usuário (usado como ID do documento)
    data_salario: int = 5  # Dia do mês para recebimento do salário principal (default: dia 5)
    valor_salario_base: float = 0.0  # Valor base do salário para cálculos
    notificar_saldo_baixo: bool = True  # Se deve notificar quando o saldo estiver baixo
    limite_saldo_alerta: float = 100.0  # Valor para alerta de saldo baixo
    mostrar_previsao_fluxo: bool = True  # Se deve mostrar previsão de fluxo de caixa
    categorias_receitas: List[str] = field(default_factory=list)  # IDs de categorias aplicáveis a receitas
    
@dataclass
class Saldo(FirestoreModel):
    """Representa um registro de saldo do usuário."""
    user_id: str = ""  # ID do usuário
    valor: float = 0.0  # Valor do saldo naquele momento
    data: Any = None  # Data do registro
    tipo_movimentacao: str = ""  # Tipo (receita, despesa, ajuste)
    referencia_id: str = ""  # ID da receita ou despesa que causou a alteração
    saldo_anterior: float = 0.0  # Saldo antes desta movimentação
    descricao: str = ""  # Descrição da movimentação

@dataclass
class ResumoMensal(FirestoreModel):
    """Representa um resumo financeiro mensal do usuário."""
    user_id: str = ""  # ID do usuário
    ano: int = 0  # Ano do resumo
    mes: int = 0  # Mês do resumo (1-12)
    total_receitas: float = 0.0  # Total de receitas no mês
    total_despesas: float = 0.0  # Total de despesas no mês
    saldo_inicial: float = 0.0  # Saldo no início do mês
    saldo_final: float = 0.0  # Saldo calculado no final do mês
    receitas_por_categoria: Dict[str, float] = field(default_factory=dict)  # Totais por categoria de receita
    despesas_por_categoria: Dict[str, float] = field(default_factory=dict)  # Totais por categoria de despesa
    meta_economia: float = 0.0  # Meta de economia para o mês
    economia_real: float = 0.0  # Economia real alcançada
    
    def get_id_composto(self) -> str:
        """Gera um ID composto para o documento baseado em user_id, ano e mês."""
        return f"{self.user_id}_{self.ano}_{self.mes:02d}"
