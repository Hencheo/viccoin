from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .services import CategoriaService, SaldoService, ReceitaService, DespesaService, OrcamentoAutomaticoService
from .models import Receita, Despesa, Budget
from datetime import datetime
from .views import (CategoriaViewSet, DespesaViewSet, ResumoPorCategoriaViewSet,
                   UserViewSet, BudgetViewSet, SubscriptionViewSet,
                   NotificationViewSet, ReportViewSet, ReceitaViewSet,
                   ConfiguracaoFinanceiraViewSet, SaldoViewSet, ResumoMensalViewSet)

# Criar um router e registrar os ViewSets
router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'despesas', DespesaViewSet, basename='despesa')
router.register(r'resumos', ResumoPorCategoriaViewSet, basename='resumo')
router.register(r'users', UserViewSet, basename='user')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'receitas', ReceitaViewSet, basename='receita')
router.register(r'configuracoes', ConfiguracaoFinanceiraViewSet, basename='configuracao')
router.register(r'saldos', SaldoViewSet, basename='saldo')
router.register(r'resumos-mensais', ResumoMensalViewSet, basename='resumo-mensal')

@api_view(['GET'])
@permission_classes([AllowAny])
def categorias_publicas(request):
    """
    Endpoint público para listar categorias sem necessidade de autenticação.
    Usado para testes.
    """
    service = CategoriaService()
    categorias = service.get_all()
    serialized_categorias = [c.to_dict() for c in categorias]
    return Response(serialized_categorias)

@api_view(['GET'])
@permission_classes([AllowAny])
def saldo_atual_publico(request):
    """
    Endpoint público para testar o saldo atual.
    Usado apenas para testes.
    """
    # Usamos um ID de usuário fixo para teste
    user_id = "user_teste_123"
    service = SaldoService()
    
    try:
        saldo_atual = service.get_saldo_atual(user_id)
        return Response({
            "saldo": saldo_atual,
            "user_id": user_id,
            "mensagem": "Este é um endpoint público apenas para testes"
        })
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def criar_receita_publico(request):
    """
    Endpoint público para criar uma receita sem necessidade de autenticação.
    Usado para testes.
    """
    try:
        data = request.data
        user_id = "user_teste_123"  # ID fixo para testes
        
        # Criar objeto Receita
        receita = Receita(
            user_id=user_id,
            tipo=data.get('tipo', 'salario'),
            valor=float(data.get('valor', 0.0)),
            data=datetime.now(),
            descricao=data.get('descricao', 'Receita de teste'),
            recorrente=data.get('recorrente', False),
            frequencia=data.get('frequencia', ''),
            categoria_id=data.get('categoria_id', ''),
            categoria_nome=data.get('categoria_nome', '')
        )
        
        # Salvar a receita
        service = ReceitaService()
        nova_receita = service.create(receita)
        
        # Atualizar o saldo
        saldo_service = SaldoService()
        saldo_atual = saldo_service.get_saldo_atual(user_id)
        novo_saldo = saldo_atual + receita.valor
        
        # Registrar movimentação de saldo
        saldo = saldo_service.registrar_movimentacao(
            user_id=user_id,
            valor=receita.valor,
            tipo="receita",
            referencia_id=nova_receita.id,
            descricao=f"Receita: {receita.descricao}"
        )
        
        return Response({
            "mensagem": "Receita criada com sucesso",
            "receita": nova_receita.to_dict(),
            "saldo_anterior": saldo_atual,
            "saldo_atual": novo_saldo
        })
    
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def criar_despesa_publico(request):
    """
    Endpoint público para criar uma despesa sem necessidade de autenticação.
    Usado para testes.
    """
    try:
        data = request.data
        user_id = "user_teste_123"  # ID fixo para testes
        
        # Criar objeto Despesa
        despesa = Despesa(
            user_id=user_id,
            descricao=data.get('descricao', 'Despesa de teste'),
            valor=float(data.get('valor', 0.0)),
            data=datetime.now(),
            categoria_id=data.get('categoria_id', ''),
            categoria_nome=data.get('categoria_nome', ''),
            metodo_pagamento=data.get('metodo_pagamento', 'cartão'),
            observacoes=data.get('observacoes', ''),
            recorrente=data.get('recorrente', False),
            parcelado=data.get('parcelado', False),
            numero_parcelas=int(data.get('numero_parcelas', 1)),
            parcela_atual=int(data.get('parcela_atual', 1))
        )
        
        # Salvar a despesa
        service = DespesaService()
        nova_despesa = service.create(despesa)
        
        # Atualizar o saldo
        saldo_service = SaldoService()
        saldo_atual = saldo_service.get_saldo_atual(user_id)
        novo_saldo = saldo_atual - despesa.valor
        
        # Registrar movimentação de saldo
        saldo = saldo_service.registrar_movimentacao(
            user_id=user_id,
            valor=despesa.valor,
            tipo="despesa",
            referencia_id=nova_despesa.id,
            descricao=f"Despesa: {despesa.descricao}"
        )
        
        return Response({
            "mensagem": "Despesa criada com sucesso",
            "despesa": nova_despesa.to_dict(),
            "saldo_anterior": saldo_atual,
            "saldo_atual": novo_saldo
        })
    
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def pesquisa_despesas_publico(request):
    """
    Endpoint público para testar a pesquisa avançada de despesas.
    Usado para testes.
    """
    try:
        # Usar ID de usuário fixo para testes
        user_id = "user_teste_123"
        
        # Obter filtros do corpo da requisição
        filtros = request.data
        
        # Processar datas se fornecidas
        if 'data_inicio' in filtros and isinstance(filtros['data_inicio'], str):
            try:
                filtros['data_inicio'] = datetime.fromisoformat(filtros['data_inicio'].replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {"error": "Formato de data inicial inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)"},
                    status=400
                )
        
        if 'data_fim' in filtros and isinstance(filtros['data_fim'], str):
            try:
                filtros['data_fim'] = datetime.fromisoformat(filtros['data_fim'].replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {"error": "Formato de data final inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)"},
                    status=400
                )
        
        # Converter valores string para tipos apropriados
        for campo in ['valor_min', 'valor_max']:
            if campo in filtros and isinstance(filtros[campo], str):
                try:
                    filtros[campo] = float(filtros[campo])
                except ValueError:
                    return Response(
                        {"error": f"Valor inválido para {campo}"},
                        status=400
                    )
        
        # Converter strings "true"/"false" para booleanos
        for campo in ['recorrente', 'parcelado']:
            if campo in filtros and isinstance(filtros[campo], str):
                filtros[campo] = filtros[campo].lower() == 'true'
        
        # Iniciar consulta diretamente no Firestore
        from firebase_admin import firestore
        db = firestore.client()
        query = db.collection('despesas').where('user_id', '==', user_id)
        
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
        
        # Converter para dicionários
        despesas = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            despesas.append(data)
        
        # Filtros que precisam ser aplicados em memória
        resultado = despesas
        
        # Filtrar por valor
        valor_min = filtros.get('valor_min')
        valor_max = filtros.get('valor_max')
        if valor_min is not None:
            resultado = [d for d in resultado if d.get('valor', 0) >= float(valor_min)]
        if valor_max is not None:
            resultado = [d for d in resultado if d.get('valor', 0) <= float(valor_max)]
        
        # Filtrar por tags
        tags = filtros.get('tags', [])
        if tags:
            resultado = [d for d in resultado if 'tags' in d and any(tag in d['tags'] for tag in tags)]
        
        # Filtrar por texto na descrição ou observações
        texto = filtros.get('texto')
        if texto:
            texto = texto.lower()
            resultado = [d for d in resultado if 
                        ('descricao' in d and d['descricao'] and texto in d['descricao'].lower()) or 
                        ('observacoes' in d and d['observacoes'] and texto in d['observacoes'].lower())]
        
        # Adicionar informações de paginação
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Calcular índices
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        # Obter resultado paginado
        paginado = resultado[start_idx:end_idx]
        
        # Preparar resposta
        response = {
            "resultados": paginado,
            "total": len(resultado),
            "pagina_atual": page,
            "total_paginas": (len(resultado) + page_size - 1) // page_size,
            "filtros_aplicados": {k: str(v) if isinstance(v, datetime) else v for k, v in filtros.items()}
        }
        
        return Response(response)
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_despesas_publico(request):
    """
    Endpoint público para listar todas as despesas.
    Usado para testes.
    """
    try:
        # Usar ID de usuário fixo para testes
        user_id = "user_teste_123"
        
        # Buscar todas as despesas diretamente do Firestore
        from firebase_admin import firestore
        db = firestore.client()
        despesas_ref = db.collection('despesas').where('user_id', '==', user_id)
        despesas_docs = despesas_ref.stream()
        
        # Converter para objetos Despesa
        despesas = []
        for doc in despesas_docs:
            data = doc.to_dict()
            data['id'] = doc.id
            despesas.append(data)
        
        # Retornar como JSON
        return Response(despesas)
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def previsao_orcamento_publico(request):
    """
    Endpoint público para testar a previsão automática de orçamentos.
    Usado para testes.
    """
    try:
        # Usar ID de usuário fixo para testes
        user_id = "user_teste_123"
        
        # Parâmetros de entrada
        data = request.data
        mes_alvo = data.get('mes')
        ano_alvo = data.get('ano')
        meses_historico = data.get('meses_historico', 3)
        
        # Validar parâmetros
        if not mes_alvo or not ano_alvo:
            hoje = datetime.now()
            # Se não informou, gerar para o próximo mês
            if not mes_alvo:
                mes_alvo = hoje.month + 1
                if mes_alvo > 12:
                    mes_alvo = 1
                    ano_alvo = hoje.year + 1
            if not ano_alvo:
                ano_alvo = hoje.year
        
        # Converter para inteiros
        mes_alvo = int(mes_alvo)
        ano_alvo = int(ano_alvo)
        meses_historico = int(meses_historico)
        
        # Validar mês
        if mes_alvo < 1 or mes_alvo > 12:
            return Response(
                {"error": "Mês deve ser um valor entre 1 e 12"},
                status=400
            )
        
        # Gerar previsão
        service = OrcamentoAutomaticoService()
        orcamentos_previstos = service.gerar_previsao_orcamento(
            user_id, mes_alvo, ano_alvo, meses_historico
        )
        
        # Aplicar previsão se solicitado
        aplicar = data.get('aplicar', False)
        if aplicar:
            substituir = data.get('substituir_existentes', False)
            orcamentos_salvos = service.aplicar_previsao(
                user_id, orcamentos_previstos, substituir
            )
            resposta = {
                "aplicados": len(orcamentos_salvos),
                "previsao": [o.to_dict() for o in orcamentos_previstos],
                "mes": mes_alvo,
                "ano": ano_alvo,
                "meses_historico": meses_historico,
                "mensagem": "Previsão de orçamento gerada e aplicada com sucesso"
            }
        else:
            resposta = {
                "previsao": [o.to_dict() for o in orcamentos_previstos],
                "mes": mes_alvo,
                "ano": ano_alvo,
                "meses_historico": meses_historico,
                "mensagem": "Previsão de orçamento gerada com sucesso (não foi aplicada)"
            }
        
        return Response(resposta)
    except Exception as e:
        return Response({"detail": str(e)}, status=500)

# URLs da API
urlpatterns = [
    path('', include(router.urls)),
    path('categorias-publicas/', categorias_publicas, name='categorias-publicas'),
    path('saldo-atual-publico/', saldo_atual_publico, name='saldo-atual-publico'),
    path('criar-receita-publico/', criar_receita_publico, name='criar-receita-publico'),
    path('criar-despesa-publico/', criar_despesa_publico, name='criar-despesa-publico'),
    path('pesquisa-despesas-publico/', pesquisa_despesas_publico, name='pesquisa-despesas-publico'),
    path('listar-despesas-publico/', listar_despesas_publico, name='listar-despesas-publico'),
    path('previsao-orcamento-publico/', previsao_orcamento_publico, name='previsao-orcamento-publico'),
] 