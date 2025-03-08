from django.core.management.base import BaseCommand
from firestore_api.models import Categoria
from firestore_api.services import (CategoriaService, BudgetService, UserService, 
                                  SubscriptionService, NotificationService, ReportService,
                                  ReceitaService, ConfiguracaoFinanceiraService,
                                  SaldoService, ResumoMensalService)
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Inicializa as coleções do Firestore com dados padrão'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Inicializando coleções do Firestore...'))
        
        # Inicializar categorias padrão
        self.inicializar_categorias()
        
        # Inicializar estrutura para outras coleções
        self.inicializar_estrutura_firestore()
        
        # Se a opção de criar dados de teste estiver ativada
        if options.get('test_data', False):
            self.criar_dados_teste()
        
        self.stdout.write(self.style.SUCCESS('Coleções inicializadas com sucesso!'))
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test-data',
            action='store_true',
            help='Criar dados de teste nas coleções',
        )
    
    def criar_dados_teste(self):
        """Cria dados de teste nas coleções para validar a integração."""
        self.stdout.write('Criando dados de teste...')
        
        # Criar um usuário teste
        from firestore_api.services import UserService, CategoriaService, IntegrationService
        from firestore_api.models import User, Despesa, Subscription, Budget, Receita
        from datetime import datetime
        
        # Criar usuário teste
        user_service = UserService()
        user = User(
            id="user_teste_123",
            name="Usuário Teste",
            email="teste@example.com",
            profile_picture_url="https://via.placeholder.com/150",
            settings={}
        )
        user_service.create(user)
        self.stdout.write(self.style.SUCCESS(f"Usuário de teste criado: {user.name} ({user.id})"))
        
        # Obter categoria para associar às despesas
        categoria_service = CategoriaService()
        categorias = categoria_service.get_all()
        if not categorias:
            self.stdout.write(self.style.ERROR("Nenhuma categoria encontrada!"))
            return
        
        # Escolher categoria aleatória
        import random
        categoria = random.choice(categorias)
        
        # Criar orçamento para a categoria
        integration = IntegrationService()
        
        # Criar configuração financeira para o usuário
        config_service = ConfiguracaoFinanceiraService()
        config = config_service.get_or_create_default(user.id)
        config.valor_salario_base = 5000.0  # Definir salário base
        config.data_salario = 5  # Recebimento dia 5
        config_service.create_or_update(config)
        self.stdout.write(self.style.SUCCESS(f"Configuração financeira criada"))
        
        # Criar budget
        budget = Budget(
            user_id=user.id,
            categoria_id=categoria.id,
            categoria_nome=categoria.nome,
            limite=1000.0,
            gasto_atual=0.0,
            periodo="mensal",
            mes=datetime.now().month,
            ano=datetime.now().year
        )
        budget = integration.budget_service.create(budget)
        self.stdout.write(self.style.SUCCESS(f"Orçamento criado para categoria: {categoria.nome}"))
        
        # Criar uma receita de salário
        receita = Receita(
            user_id=user.id,
            tipo="salario",
            valor=5000.0,
            data=datetime.now(),
            descricao="Salário mensal",
            recorrente=True,
            frequencia="mensal"
        )
        receita, saldo, resumo = integration.registrar_receita(receita, user.id)
        self.stdout.write(self.style.SUCCESS(f"Receita de salário criada: R$ {receita.valor}"))
        self.stdout.write(self.style.SUCCESS(f"Saldo inicial atualizado: R$ {saldo.valor}"))
        
        # Criar uma despesa associada ao usuário e categoria
        despesa = Despesa(
            descricao="Despesa de teste",
            valor=150.0,
            data=datetime.now(),
            categoria_id=categoria.id,
            categoria_nome=categoria.nome,
            metodo_pagamento="Cartão de Crédito",
            observacoes="Despesa criada para testes",
            user_id=user.id
        )
        
        # Usar serviço de integração para garantir que todas as entidades relacionadas sejam atualizadas
        despesa, budget_atualizado, notification = integration.registrar_nova_despesa(despesa, user.id)
        self.stdout.write(self.style.SUCCESS(f"Despesa de teste criada: {despesa.descricao} (R$ {despesa.valor})"))
        
        if budget_atualizado:
            self.stdout.write(self.style.SUCCESS(f"Orçamento atualizado: R$ {budget_atualizado.gasto_atual} de R$ {budget_atualizado.limite}"))
        
        if notification:
            self.stdout.write(self.style.SUCCESS(f"Notificação criada: {notification.mensagem}"))
        
        # Criar uma assinatura para o usuário
        subscription = Subscription(
            user_id=user.id,
            nome_servico="Netflix",
            valor=39.90,
            data_renovacao=datetime.now(),
            frequencia="mensal",
            categoria_id=categoria.id,
            categoria_nome=categoria.nome,
            ativa=True
        )
        
        subscription, despesa_assinatura = integration.criar_assinatura_com_despesa(subscription, user.id)
        self.stdout.write(self.style.SUCCESS(f"Assinatura criada: {subscription.nome_servico} (R$ {subscription.valor})"))
        self.stdout.write(self.style.SUCCESS(f"Despesa de assinatura criada: {despesa_assinatura.descricao}"))
        
        # Gerar balanço mensal
        balanco = integration.calcular_balanco_mensal(user.id, datetime.now().year, datetime.now().month)
        self.stdout.write(self.style.SUCCESS(f"Balanço mensal gerado - Saldo atual: R$ {balanco['saldo_atual']}"))
        
        self.stdout.write(self.style.SUCCESS('Dados de teste criados com sucesso!'))
    
    def inicializar_estrutura_firestore(self):
        """Inicializa a estrutura básica das coleções no Firestore."""
        self.stdout.write('Verificando estrutura do Firestore...')
        
        # Inicializar serviços
        user_service = UserService()
        budget_service = BudgetService()
        subscription_service = SubscriptionService()
        notification_service = NotificationService()
        report_service = ReportService()
        receita_service = ReceitaService()
        config_service = ConfiguracaoFinanceiraService()
        saldo_service = SaldoService()
        resumo_mensal_service = ResumoMensalService()
        
        # Verificar se as coleções existem
        self.stdout.write(f"Verificando coleção 'users'...")
        self.stdout.write(f"Verificando coleção 'budgets'...")
        self.stdout.write(f"Verificando coleção 'subscriptions'...")
        self.stdout.write(f"Verificando coleção 'notifications'...")
        self.stdout.write(f"Verificando coleção 'reports'...")
        self.stdout.write(f"Verificando coleção 'receitas'...")
        self.stdout.write(f"Verificando coleção 'configuracoes_financeiras'...")
        self.stdout.write(f"Verificando coleção 'saldos'...")
        self.stdout.write(f"Verificando coleção 'resumos_mensais'...")
        
        self.stdout.write(self.style.SUCCESS('Estrutura do Firestore verificada!'))
    
    def inicializar_categorias(self):
        """Inicializa categorias padrão no Firestore."""
        categorias_padrao = [
            {
                'nome': 'Alimentação',
                'descricao': 'Gastos com restaurantes, mercado e delivery',
                'cor': '#FF5733',
                'icone': 'restaurant',
                'ordem': 1
            },
            {
                'nome': 'Transporte',
                'descricao': 'Gastos com combustível, transporte público, Uber/99',
                'cor': '#33A8FF',
                'icone': 'directions_car',
                'ordem': 2
            },
            {
                'nome': 'Moradia',
                'descricao': 'Aluguel, condomínio, IPTU, contas de casa',
                'cor': '#33FF57',
                'icone': 'home',
                'ordem': 3
            },
            {
                'nome': 'Educação',
                'descricao': 'Mensalidades, cursos, livros',
                'cor': '#A833FF',
                'icone': 'school',
                'ordem': 4
            },
            {
                'nome': 'Saúde',
                'descricao': 'Plano de saúde, farmácia, consultas',
                'cor': '#FF3393',
                'icone': 'healing',
                'ordem': 5
            },
            {
                'nome': 'Lazer',
                'descricao': 'Cinema, passeios, viagens',
                'cor': '#FFDD33',
                'icone': 'beach_access',
                'ordem': 6
            },
            {
                'nome': 'Assinaturas',
                'descricao': 'Streaming, serviços recorrentes',
                'cor': '#33FFF3',
                'icone': 'subscriptions',
                'ordem': 7
            },
            {
                'nome': 'Outros',
                'descricao': 'Despesas diversas',
                'cor': '#808080',
                'icone': 'more_horiz',
                'ordem': 8
            },
            {
                'nome': 'Renda',
                'descricao': 'Salários, freelances e outras fontes de renda',
                'cor': '#33FF8D',
                'icone': 'attach_money',
                'ordem': 9
            },
            {
                'nome': 'Investimentos',
                'descricao': 'Aplicações financeiras e retornos',
                'cor': '#33B8FF',
                'icone': 'trending_up',
                'ordem': 10
            }
        ]
        
        service = CategoriaService()
        
        for cat_data in categorias_padrao:
            # Verificar se já existe
            categoria_existente = service.get_by_nome(cat_data['nome'])
            if not categoria_existente:
                # Criar a categoria
                categoria = Categoria(**cat_data)
                service.create(categoria)
                self.stdout.write(self.style.SUCCESS(f"Categoria '{cat_data['nome']}' criada com sucesso!"))
            else:
                self.stdout.write(f"Categoria '{cat_data['nome']}' já existe, pulando.") 