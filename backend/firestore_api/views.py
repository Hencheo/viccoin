from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny
from firebase_admin import firestore
from datetime import datetime, timedelta
import logging

from .models import (Categoria, Despesa, ResumoPorCategoria, User, Budget, 
                    Subscription, Notification, Report, Receita, 
                    ConfiguracaoFinanceira, Saldo, ResumoMensal)
from .services import (CategoriaService, DespesaService, ResumoPorCategoriaService,
                      UserService, BudgetService, SubscriptionService, 
                      NotificationService, ReportService, IntegrationService,
                      ReceitaService, ConfiguracaoFinanceiraService, 
                      SaldoService, ResumoMensalService, OrcamentoAutomaticoService)

logger = logging.getLogger(__name__)

class FirestoreViewSet(viewsets.ViewSet):
    """
    ViewSet base para operações com o Firestore.
    Esta classe será estendida para cada coleção específica.
    """
    collection_name = None  # Deve ser definido nas subclasses
    
    def get_collection(self):
        """
        Retorna a referência para a coleção no Firestore.
        """
        if not self.collection_name:
            raise ValueError("collection_name não definido na subclasse")
        
        db = firestore.client()
        return db.collection(self.collection_name)
    
    def get_user_id(self, request):
        """
        Obtém o ID do usuário autenticado.
        """
        if hasattr(request, 'firebase_user'):
            if hasattr(request.firebase_user, 'uid'):
                return request.firebase_user.uid
            elif isinstance(request.firebase_user, dict):
                # Fallback para compatibilidade com código existente
                return request.firebase_user.get('uid')
        return None
    
    def list(self, request):
        """
        Lista todos os documentos da coleção.
        """
        try:
            collection = self.get_collection()
            docs = collection.stream()
            
            result = []
            for doc in docs:
                item = doc.to_dict()
                item['id'] = doc.id
                result.append(item)
                
            return Response(result)
        except Exception as e:
            logger.error(f"Erro ao listar documentos: {str(e)}")
            return Response(
                {"error": "Erro ao buscar documentos"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """
        Recupera um documento específico pelo ID.
        """
        try:
            doc_ref = self.get_collection().document(pk)
            doc = doc_ref.get()
            
            if not doc.exists:
                return Response(
                    {"error": "Documento não encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            data = doc.to_dict()
            data['id'] = doc.id
            
            return Response(data)
        except Exception as e:
            logger.error(f"Erro ao recuperar documento: {str(e)}")
            return Response(
                {"error": "Erro ao buscar documento"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """
        Cria um novo documento na coleção.
        """
        try:
            data = request.data
            collection = self.get_collection()
            
            # Adicionar dados do usuário autenticado
            if hasattr(request, 'firebase_user'):
                data['created_by'] = request.firebase_user.get('uid')
            
            # Adicionar timestamp
            data['created_at'] = firestore.SERVER_TIMESTAMP
            
            # Criar documento
            doc_ref = collection.document()
            doc_ref.set(data)
            
            # Retornar dados com ID
            result = data.copy()
            result['id'] = doc_ref.id
            
            return Response(result, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Erro ao criar documento: {str(e)}")
            return Response(
                {"error": "Erro ao criar documento"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        """
        Atualiza um documento existente.
        """
        try:
            data = request.data
            doc_ref = self.get_collection().document(pk)
            
            # Verificar se o documento existe
            doc = doc_ref.get()
            if not doc.exists:
                return Response(
                    {"error": "Documento não encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Adicionar dados do usuário autenticado
            if hasattr(request, 'firebase_user'):
                data['updated_by'] = request.firebase_user.get('uid')
            
            # Adicionar timestamp
            data['updated_at'] = firestore.SERVER_TIMESTAMP
            
            # Atualizar documento
            doc_ref.update(data)
            
            # Retornar dados atualizados
            updated_doc = doc_ref.get()
            result = updated_doc.to_dict()
            result['id'] = updated_doc.id
            
            return Response(result)
        except Exception as e:
            logger.error(f"Erro ao atualizar documento: {str(e)}")
            return Response(
                {"error": "Erro ao atualizar documento"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, pk=None):
        """
        Remove um documento da coleção.
        """
        try:
            doc_ref = self.get_collection().document(pk)
            
            # Verificar se o documento existe
            doc = doc_ref.get()
            if not doc.exists:
                return Response(
                    {"error": "Documento não encontrado"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Excluir documento
            doc_ref.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir documento: {str(e)}")
            return Response(
                {"error": "Erro ao excluir documento"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CategoriaViewSet(FirestoreViewSet):
    """ViewSet para gerenciar categorias de despesas."""
    collection_name = "categorias"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = CategoriaService()
    
    @action(detail=False, methods=['get'])
    def por_nome(self, request):
        """Busca categorias por nome."""
        nome = request.query_params.get('nome', '')
        if not nome:
            return Response(
                {"detail": "É necessário fornecer um parâmetro 'nome'."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            categoria = self.service.get_by_nome(nome)
            if categoria:
                return Response(categoria.to_dict())
            else:
                return Response(
                    {"detail": f"Categoria com nome '{nome}' não encontrada."},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {"detail": f"Erro ao buscar categoria: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    # Sobrescrever list para permitir acesso sem autenticação
    def list(self, request):
        """Lista todas as categorias disponíveis."""
        from rest_framework.permissions import AllowAny
        self.permission_classes = [AllowAny]
        
        try:
            categorias = self.service.get_all()
            serialized_categorias = [c.to_dict() for c in categorias]
            return Response(serialized_categorias)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao listar categorias: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DespesaViewSet(FirestoreViewSet):
    """ViewSet para gerenciar despesas por usuário."""
    collection_name = "despesas"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = DespesaService()
    
    def list(self, request):
        """Lista todas as despesas do usuário autenticado."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            despesas = self.service.get_all_by_user(user_id)
            return Response([d.__dict__ for d in despesas])
        except Exception as e:
            logger.error(f"Erro ao listar despesas: {str(e)}")
            return Response(
                {"error": "Erro ao buscar despesas"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, pk=None):
        """Recupera uma despesa específica do usuário."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            despesa = self.service.get_by_id_for_user(user_id, pk)
            if not despesa:
                return Response(
                    {"error": "Despesa não encontrada"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(despesa.__dict__)
        except Exception as e:
            logger.error(f"Erro ao recuperar despesa: {str(e)}")
            return Response(
                {"error": "Erro ao buscar despesa"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """
        Cria uma nova despesa para o usuário autenticado.
        Categoriza automaticamente e atualiza os resumos por categoria.
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            data = request.data
            
            # Criar objeto despesa
            despesa = Despesa(
                descricao=data.get('descricao', ''),
                valor=float(data.get('valor', 0)),
                data=firestore.SERVER_TIMESTAMP,
                categoria_id=data.get('categoria_id', ''),
                categoria_nome=data.get('categoria_nome', ''),
                metodo_pagamento=data.get('metodo_pagamento', ''),
                observacoes=data.get('observacoes', ''),
                comprovante_url=data.get('comprovante_url', ''),
                tags=data.get('tags', []),
                recorrente=data.get('recorrente', False),
                parcelado=data.get('parcelado', False),
                numero_parcelas=int(data.get('numero_parcelas', 1)),
                parcela_atual=int(data.get('parcela_atual', 1)),
                user_id=user_id
            )
            
            # Criar despesa com categoria e atualização de resumo
            despesa, categoria, resumo = self.service.create_with_categoria(despesa, user_id)
            
            # Preparar resposta
            resultado = {
                "despesa": despesa.__dict__,
                "categoria": categoria.__dict__,
                "resumo": resumo.__dict__
            }
            
            return Response(resultado, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Erro ao criar despesa: {str(e)}")
            return Response(
                {"error": f"Erro ao criar despesa: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        """
        Atualiza uma despesa existente do usuário.
        Atualiza também os resumos por categoria se necessário.
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Obter despesa atual
            old_despesa = self.service.get_by_id_for_user(user_id, pk)
            if not old_despesa:
                return Response(
                    {"error": "Despesa não encontrada"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            data = request.data
            
            # Criar objeto despesa com dados atualizados
            despesa = Despesa(
                id=pk,
                descricao=data.get('descricao', old_despesa.descricao),
                valor=float(data.get('valor', old_despesa.valor)),
                data=data.get('data', old_despesa.data),
                categoria_id=data.get('categoria_id', old_despesa.categoria_id),
                categoria_nome=data.get('categoria_nome', old_despesa.categoria_nome),
                metodo_pagamento=data.get('metodo_pagamento', old_despesa.metodo_pagamento),
                observacoes=data.get('observacoes', old_despesa.observacoes),
                comprovante_url=data.get('comprovante_url', old_despesa.comprovante_url),
                tags=data.get('tags', old_despesa.tags),
                recorrente=data.get('recorrente', old_despesa.recorrente),
                parcelado=data.get('parcelado', old_despesa.parcelado),
                numero_parcelas=int(data.get('numero_parcelas', old_despesa.numero_parcelas)),
                parcela_atual=int(data.get('parcela_atual', old_despesa.parcela_atual)),
                user_id=user_id
            )
            
            # Atualizar despesa e resumos
            despesa, old_resumo, new_resumo = self.service.update_with_categoria(despesa, old_despesa, user_id)
            
            # Preparar resposta
            resultado = {
                "despesa": despesa.__dict__,
                "resumo_anterior": old_resumo.__dict__ if old_resumo else None,
                "resumo_atual": new_resumo.__dict__ if new_resumo else None
            }
            
            return Response(resultado)
        except Exception as e:
            logger.error(f"Erro ao atualizar despesa: {str(e)}")
            return Response(
                {"error": f"Erro ao atualizar despesa: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, pk=None):
        """
        Remove uma despesa do usuário e atualiza o resumo por categoria.
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Excluir despesa e atualizar resumo
            resultado = self.service.delete_with_update_resumo(user_id, pk)
            
            if not resultado:
                return Response(
                    {"error": "Despesa não encontrada"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Erro ao excluir despesa: {str(e)}")
            return Response(
                {"error": f"Erro ao excluir despesa: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Busca despesas por categoria do usuário autenticado."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        categoria_id = request.query_params.get('categoria_id', '')
        if not categoria_id:
            return Response(
                {"error": "ID da categoria não especificado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            despesas = self.service.get_by_categoria(user_id, categoria_id)
            return Response([d.__dict__ for d in despesas])
        except Exception as e:
            logger.error(f"Erro ao buscar despesas por categoria: {str(e)}")
            return Response(
                {"error": "Erro ao buscar despesas"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def por_periodo(self, request):
        """Busca despesas por período de data do usuário autenticado."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        data_inicio = request.query_params.get('data_inicio', '')
        data_fim = request.query_params.get('data_fim', '')
        
        if not data_inicio or not data_fim:
            return Response(
                {"error": "Data inicial e final são obrigatórias"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Converter strings para timestamps
            inicio = datetime.fromisoformat(data_inicio.replace('Z', '+00:00'))
            fim = datetime.fromisoformat(data_fim.replace('Z', '+00:00'))
            
            despesas = self.service.get_by_periodo(user_id, inicio, fim)
            return Response([d.__dict__ for d in despesas])
        except Exception as e:
            logger.error(f"Erro ao buscar despesas por período: {str(e)}")
            return Response(
                {"error": f"Erro ao buscar despesas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def registrar_com_integracao(self, request):
        """
        Registra uma nova despesa e atualiza todas as entidades relacionadas.
        Usa o serviço de integração para garantir consistência entre coleções.
        """
        user_id = request.firebase_user.get('uid')
        data = request.data.copy()
        data['user_id'] = user_id
        
        try:
            despesa = Despesa(**data)
            
            # Usar o serviço de integração
            integration_service = IntegrationService()
            despesa, budget, notification = integration_service.registrar_nova_despesa(despesa, user_id)
            
            # Preparar resposta
            response_data = {
                'despesa': despesa.to_dict(),
                'budget': budget.to_dict() if budget else None,
                'notification': notification.to_dict() if notification else None
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao registrar despesa: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def pesquisa_avancada(self, request):
        """
        Realiza pesquisa avançada de despesas com múltiplos filtros.
        POST: /api/despesas/pesquisa_avancada/
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Obter filtros do corpo da requisição
        filtros = request.data
        
        # Processar datas se fornecidas em formato string
        if 'data_inicio' in filtros and isinstance(filtros['data_inicio'], str):
            try:
                filtros['data_inicio'] = datetime.fromisoformat(filtros['data_inicio'].replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {"error": "Formato de data inicial inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'data_fim' in filtros and isinstance(filtros['data_fim'], str):
            try:
                filtros['data_fim'] = datetime.fromisoformat(filtros['data_fim'].replace('Z', '+00:00'))
            except ValueError:
                return Response(
                    {"error": "Formato de data final inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Converter valores string para tipos apropriados
        if 'valor_min' in filtros and isinstance(filtros['valor_min'], str):
            try:
                filtros['valor_min'] = float(filtros['valor_min'])
            except ValueError:
                return Response(
                    {"error": "Valor mínimo inválido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'valor_max' in filtros and isinstance(filtros['valor_max'], str):
            try:
                filtros['valor_max'] = float(filtros['valor_max'])
            except ValueError:
                return Response(
                    {"error": "Valor máximo inválido"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Converter strings "true"/"false" para booleanos
        for campo in ['recorrente', 'parcelado']:
            if campo in filtros and isinstance(filtros[campo], str):
                filtros[campo] = filtros[campo].lower() == 'true'
        
        try:
            despesas = self.service.pesquisa_avancada(user_id, filtros)
            
            # Adicionar informações de paginação se solicitado
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # Calcular índices para paginação
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Obter resultado paginado
            paginado = despesas[start_idx:end_idx]
            
            # Preparar resposta com metadados
            response = {
                "resultados": [d.__dict__ for d in paginado],
                "total": len(despesas),
                "pagina_atual": page,
                "total_paginas": (len(despesas) + page_size - 1) // page_size,
                "filtros_aplicados": filtros
            }
            
            return Response(response)
        except Exception as e:
            logger.error(f"Erro na pesquisa avançada: {str(e)}")
            return Response(
                {"error": f"Erro ao realizar pesquisa: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def por_metodo_pagamento(self, request):
        """
        Busca despesas por método de pagamento do usuário autenticado.
        GET: /api/despesas/por_metodo_pagamento/?metodo=pix
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        metodo = request.query_params.get('metodo', '')
        if not metodo:
            return Response(
                {"error": "Parâmetro 'metodo' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar todas as despesas do usuário
            despesas = self.service.get_all_by_user(user_id)
            
            # Filtrar por método de pagamento
            filtradas = [d for d in despesas if d.metodo_pagamento and d.metodo_pagamento.lower() == metodo.lower()]
            
            # Ordenar por data (mais recentes primeiro)
            ordenadas = sorted(filtradas, key=lambda d: d.data if d.data else datetime.min, reverse=True)
            
            return Response([d.__dict__ for d in ordenadas])
        except Exception as e:
            logger.error(f"Erro ao buscar despesas por método de pagamento: {str(e)}")
            return Response(
                {"error": f"Erro ao buscar despesas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def pesquisa_texto(self, request):
        """
        Realiza pesquisa de despesas por texto na descrição ou observações.
        GET: /api/despesas/pesquisa_texto/?texto=termo
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        texto = request.query_params.get('texto', '')
        if not texto:
            return Response(
                {"error": "Parâmetro 'texto' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar todas as despesas do usuário
            despesas = self.service.get_all_by_user(user_id)
            
            # Filtrar por texto na descrição ou observações
            texto = texto.lower()
            filtradas = [d for d in despesas if 
                      (d.descricao and texto in d.descricao.lower()) or 
                      (d.observacoes and texto in d.observacoes.lower())]
            
            # Ordenar por data (mais recentes primeiro)
            ordenadas = sorted(filtradas, key=lambda d: d.data if d.data else datetime.min, reverse=True)
            
            # Adicionar informações de paginação se solicitado
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # Calcular índices para paginação
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Obter resultado paginado
            paginado = ordenadas[start_idx:end_idx]
            
            # Preparar resposta com metadados
            response = {
                "resultados": [d.__dict__ for d in paginado],
                "total": len(ordenadas),
                "pagina_atual": page,
                "total_paginas": (len(ordenadas) + page_size - 1) // page_size,
                "termo_pesquisa": texto
            }
            
            return Response(response)
        except Exception as e:
            logger.error(f"Erro na pesquisa por texto: {str(e)}")
            return Response(
                {"error": f"Erro ao realizar pesquisa: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def por_tags(self, request):
        """
        Busca despesas que contenham todas as tags especificadas.
        GET: /api/despesas/por_tags/?tags=casa,mercado
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        tags_str = request.query_params.get('tags', '')
        if not tags_str:
            return Response(
                {"error": "Parâmetro 'tags' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Dividir string em lista de tags, removendo espaços
        tags = [tag.strip() for tag in tags_str.split(',')]
        
        try:
            # Buscar todas as despesas do usuário
            despesas = self.service.get_all_by_user(user_id)
            
            # Filtrar por tags (despesa deve conter TODAS as tags especificadas)
            filtradas = [d for d in despesas if all(tag in d.tags for tag in tags)]
            
            # Ordenar por data (mais recentes primeiro)
            ordenadas = sorted(filtradas, key=lambda d: d.data if d.data else datetime.min, reverse=True)
            
            # Adicionar informações de paginação se solicitado
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            
            # Calcular índices para paginação
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            
            # Obter resultado paginado
            paginado = ordenadas[start_idx:end_idx]
            
            # Preparar resposta com metadados
            response = {
                "resultados": [d.__dict__ for d in paginado],
                "total": len(ordenadas),
                "pagina_atual": page,
                "total_paginas": (len(ordenadas) + page_size - 1) // page_size,
                "tags_pesquisadas": tags
            }
            
            return Response(response)
        except Exception as e:
            logger.error(f"Erro ao buscar despesas por tags: {str(e)}")
            return Response(
                {"error": f"Erro ao buscar despesas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResumoPorCategoriaViewSet(FirestoreViewSet):
    """ViewSet para resumo de gastos por categoria."""
    collection_name = "resumos_categorias"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = ResumoPorCategoriaService()
    
    def list(self, request):
        """Lista todos os resumos do usuário autenticado."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Pegar parâmetros de período (opcional)
            ano = request.query_params.get('ano')
            mes = request.query_params.get('mes')
            
            if ano and mes:
                # Buscar resumos por período
                ano = int(ano)
                mes = int(mes)
                resumos = self.service.get_resumos_por_periodo(user_id, ano, mes)
            else:
                # Buscar todos (implementação básica - na prática, pode precisar de paginação)
                resumos = self.service.query([("user_id", "==", user_id)])
            
            return Response([r.__dict__ for r in resumos])
        except Exception as e:
            logger.error(f"Erro ao listar resumos: {str(e)}")
            return Response(
                {"error": "Erro ao buscar resumos de categorias"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def por_periodo(self, request):
        """Busca resumos por período (ano e mês)."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        ano = request.query_params.get('ano')
        mes = request.query_params.get('mes')
        
        if not ano or not mes:
            return Response(
                {"error": "Ano e mês são obrigatórios"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ano = int(ano)
            mes = int(mes)
            
            resumos = self.service.get_resumos_por_periodo(user_id, ano, mes)
            return Response([r.__dict__ for r in resumos])
        except Exception as e:
            logger.error(f"Erro ao buscar resumos por período: {str(e)}")
            return Response(
                {"error": "Erro ao buscar resumos de categorias"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserViewSet(FirestoreViewSet):
    """ViewSet para gerenciar usuários."""
    collection_name = "users"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = UserService()

    def create(self, request, *args, **kwargs):
        """
        Cria ou atualiza um usuário quando o usuário faz login.
        Esse método é chamado automaticamente pelo Firebase Authentication.
        """
        # O usuário atual está autenticado pelo Firebase, então podemos
        # usar diretamente os dados do usuário do Firebase
        firebase_user = request.firebase_user
        
        try:
            user = self.service.create_or_update_user(firebase_user)
            serialized_user = user.to_dict()
            return Response(serialized_user, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao criar/atualizar usuário: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, pk=None, *args, **kwargs):
        """
        Retorna os dados do usuário atual.
        Se pk='me', retorna o usuário autenticado.
        """
        if pk == 'me':
            # Usar o UID do usuário autenticado
            pk = request.firebase_user.get('uid')
            
        return super().retrieve(request, pk, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def resetar_dados(self, request):
        """
        Remove todos os dados do usuário, mantendo a conta.
        """
        # Obter o user_id do usuário autenticado
        user_id = request.firebase_user.get_id() if hasattr(request.firebase_user, 'get_id') else request.firebase_user.get('uid')
        
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado ou ID não encontrado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Chamar o método de serviço que implementa a transação
            success = self.service.resetar_dados_usuario(user_id)
            
            if success:
                return Response(
                    {"message": "Todos os dados foram excluídos com sucesso."},
                    status=status.HTTP_200_OK
                )
            return Response(
                {"error": "Não foi possível excluir os dados."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Erro ao resetar dados do usuário: {str(e)}")
            return Response(
                {"error": f"Erro ao excluir dados: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BudgetViewSet(FirestoreViewSet):
    """ViewSet para gerenciar orçamentos."""
    collection_name = "budgets"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = BudgetService()
        self.orcamento_automatico_service = OrcamentoAutomaticoService()
        
    @action(detail=False, methods=['get'])
    def by_period(self, request):
        """Busca orçamentos por período (mês/ano)."""
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        ano = request.query_params.get('ano')
        mes = request.query_params.get('mes')
        
        if not ano or not mes:
            # Se não informou mês/ano, usar o mês atual
            hoje = datetime.now()
            ano = hoje.year
            mes = hoje.month
        else:
            ano = int(ano)
            mes = int(mes)
            
        budgets = self.service.get_all_by_periodo(user_id, ano, mes)
        serialized_budgets = [b.to_dict() for b in budgets]
        return Response(serialized_budgets)
    
    @action(detail=False, methods=['post'])
    def gerar_previsao(self, request):
        """
        Gera uma previsão automática de orçamentos baseada no histórico de despesas.
        Não salva os orçamentos, apenas retorna a previsão para avaliação do usuário.
        
        POST /api/budgets/gerar_previsao/
        Body:
        {
            "mes": 4,  # Mês alvo da previsão (1-12)
            "ano": 2025,  # Ano alvo da previsão
            "meses_historico": 3  # Quantidade de meses a considerar no histórico (opcional, padrão: 3)
        }
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
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
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Gerar previsão
            orcamentos_previstos = self.orcamento_automatico_service.gerar_previsao_orcamento(
                user_id, mes_alvo, ano_alvo, meses_historico
            )
            
            # Retornar resultado
            return Response({
                "previsao": [o.to_dict() for o in orcamentos_previstos],
                "mes": mes_alvo,
                "ano": ano_alvo,
                "meses_historico": meses_historico
            })
        except Exception as e:
            logger.error(f"Erro ao gerar previsão de orçamento: {str(e)}")
            return Response(
                {"error": f"Erro ao gerar previsão: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def aplicar_previsao(self, request):
        """
        Aplica uma previsão automática de orçamentos, salvando-a no Firestore.
        
        POST /api/budgets/aplicar_previsao/
        Body:
        {
            "mes": 4,  # Mês alvo da previsão (1-12)
            "ano": 2025,  # Ano alvo da previsão
            "meses_historico": 3,  # Quantidade de meses a considerar no histórico (opcional, padrão: 3)
            "substituir_existentes": false  # Se deve substituir orçamentos existentes (opcional, padrão: false)
        }
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Parâmetros de entrada
        data = request.data
        mes_alvo = data.get('mes')
        ano_alvo = data.get('ano')
        meses_historico = data.get('meses_historico', 3)
        substituir_existentes = data.get('substituir_existentes', False)
        
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
        
        # Converter para inteiros/booleanos
        mes_alvo = int(mes_alvo)
        ano_alvo = int(ano_alvo)
        meses_historico = int(meses_historico)
        if isinstance(substituir_existentes, str):
            substituir_existentes = substituir_existentes.lower() == 'true'
        
        # Validar mês
        if mes_alvo < 1 or mes_alvo > 12:
            return Response(
                {"error": "Mês deve ser um valor entre 1 e 12"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Gerar previsão
            orcamentos_previstos = self.orcamento_automatico_service.gerar_previsao_orcamento(
                user_id, mes_alvo, ano_alvo, meses_historico
            )
            
            # Aplicar previsão
            orcamentos_salvos = self.orcamento_automatico_service.aplicar_previsao(
                user_id, orcamentos_previstos, substituir_existentes
            )
            
            # Retornar resultado
            return Response({
                "aplicados": len(orcamentos_salvos),
                "orcamentos": [o.to_dict() for o in orcamentos_salvos],
                "mes": mes_alvo,
                "ano": ano_alvo
            })
        except Exception as e:
            logger.error(f"Erro ao aplicar previsão de orçamento: {str(e)}")
            return Response(
                {"error": f"Erro ao aplicar previsão: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def previsoes(self, request):
        """
        Lista todas as previsões automáticas de orçamento para um período específico.
        
        GET /api/budgets/previsoes/?ano=2025&mes=4
        """
        user_id = self.get_user_id(request)
        if not user_id:
            return Response(
                {"error": "Usuário não autenticado"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        ano = request.query_params.get('ano')
        mes = request.query_params.get('mes')
        
        if not ano or not mes:
            # Se não informou mês/ano, usar o mês atual
            hoje = datetime.now()
            ano = hoje.year
            mes = hoje.month
        else:
            ano = int(ano)
            mes = int(mes)
            
        try:
            # Buscar todos os orçamentos do período
            orcamentos = self.service.get_all_by_periodo(user_id, ano, mes)
            
            # Filtrar apenas as previsões automáticas
            previsoes = [o for o in orcamentos if o.is_previsao]
            
            return Response([p.to_dict() for p in previsoes])
        except Exception as e:
            logger.error(f"Erro ao listar previsões de orçamento: {str(e)}")
            return Response(
                {"error": f"Erro ao listar previsões: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubscriptionViewSet(FirestoreViewSet):
    """ViewSet para gerenciar assinaturas."""
    collection_name = "subscriptions"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = SubscriptionService()
        
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Busca todas as assinaturas ativas."""
        user_id = request.firebase_user.get('uid')
        
        subscriptions = self.service.get_all_active_by_user(user_id)
        serialized_subscriptions = [s.to_dict() for s in subscriptions]
        return Response(serialized_subscriptions)
    
    @action(detail=False, methods=['post'])
    def criar_com_despesa(self, request):
        """Cria uma nova assinatura e a primeira despesa associada."""
        user_id = request.firebase_user.get('uid')
        data = request.data.copy()
        data['user_id'] = user_id
        
        try:
            subscription = Subscription(**data)
            
            # Usar o serviço de integração
            integration_service = IntegrationService()
            subscription, despesa = integration_service.criar_assinatura_com_despesa(
                subscription, user_id
            )
            
            # Preparar resposta
            response_data = {
                'subscription': subscription.to_dict(),
                'despesa': despesa.to_dict()
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao criar assinatura: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class NotificationViewSet(FirestoreViewSet):
    """ViewSet para gerenciar notificações."""
    collection_name = "notifications"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = NotificationService()
        
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Busca notificações não lidas."""
        user_id = request.firebase_user.get('uid')
        
        notifications = self.service.get_unread_by_user(user_id)
        serialized_notifications = [n.to_dict() for n in notifications]
        return Response(serialized_notifications)
        
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marca uma notificação como lida."""
        try:
            notification = self.service.mark_as_read(pk)
            return Response(notification.to_dict())
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReportViewSet(FirestoreViewSet):
    """ViewSet para gerenciar relatórios."""
    collection_name = "reports"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = ReportService()
        
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Gera um novo relatório para o período especificado."""
        user_id = request.firebase_user.get('uid')
        tipo = request.data.get('tipo', 'mensal')
        
        # Buscar as datas do período
        try:
            # Permitir o frontend especificar datas de início e fim
            inicio_str = request.data.get('periodo_inicio')
            fim_str = request.data.get('periodo_fim')
            
            if inicio_str and fim_str:
                inicio = datetime.fromisoformat(inicio_str)
                fim = datetime.fromisoformat(fim_str)
            else:
                # Ou usar o mês atual como padrão
                hoje = datetime.now()
                if tipo == 'mensal':
                    inicio = datetime(hoje.year, hoje.month, 1)
                    # Último dia do mês
                    if hoje.month == 12:
                        fim = datetime(hoje.year + 1, 1, 1) - timedelta(days=1)
                    else:
                        fim = datetime(hoje.year, hoje.month + 1, 1) - timedelta(days=1)
                elif tipo == 'semanal':
                    # Início da semana (segunda-feira)
                    inicio = hoje - timedelta(days=hoje.weekday())
                    # Fim da semana (domingo)
                    fim = inicio + timedelta(days=6)
                else:  # diário
                    inicio = datetime(hoje.year, hoje.month, hoje.day)
                    fim = inicio + timedelta(days=1) - timedelta(seconds=1)
                    
            # Aqui, buscaríamos dados para o relatório
            # Este é um exemplo simplificado
            
            # Criar o relatório
            report = Report(
                user_id=user_id,
                tipo=tipo,
                data_geracao=datetime.now(),
                periodo_inicio=inicio,
                periodo_fim=fim,
                dados={
                    "gerado": True,
                    "mensagem": f"Relatório {tipo} gerado com sucesso"
                    # Adicionar mais dados aqui
                }
            )
            
            saved_report = self.service.create(report)
            return Response(saved_report.to_dict(), status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"detail": f"Erro ao gerar relatório: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def mensal(self, request):
        """
        Gera um relatório mensal com dados integrados de despesas,
        orçamentos e assinaturas.
        """
        user_id = request.firebase_user.get('uid')
        
        # Obter mês e ano da requisição ou usar o atual
        try:
            ano = int(request.data.get('ano', datetime.now().year))
            mes = int(request.data.get('mes', datetime.now().month))
            
            # Usar o serviço de integração
            integration_service = IntegrationService()
            report = integration_service.gerar_relatorio_mensal(user_id, ano, mes)
            
            return Response(report.to_dict(), status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao gerar relatório mensal: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReceitaViewSet(FirestoreViewSet):
    """ViewSet para gerenciar receitas."""
    collection_name = "receitas"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = ReceitaService()
        
    def list(self, request):
        """Lista todas as receitas do usuário."""
        user_id = self.get_user_id(request)
        
        try:
            receitas = self.service.get_all_by_user(user_id)
            serialized_receitas = [r.to_dict() for r in receitas]
            return Response(serialized_receitas)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao listar receitas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request):
        """Cria uma nova receita."""
        user_id = self.get_user_id(request)
        data = request.data.copy()
        data['user_id'] = user_id
        
        try:
            receita = Receita(**data)
            integration_service = IntegrationService()
            receita, saldo, resumo = integration_service.registrar_receita(receita, user_id)
            
            response_data = {
                'receita': receita.to_dict(),
                'saldo': saldo.to_dict(),
                'resumo_mensal': resumo.to_dict() if resumo else None
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao criar receita: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def registrar_salario(self, request):
        """Registra o salário mensal do usuário."""
        user_id = self.get_user_id(request)
        
        try:
            # Verificar se a data foi fornecida
            data_str = request.data.get('data')
            data = None
            if data_str:
                data = datetime.fromisoformat(data_str)
            
            integration_service = IntegrationService()
            receita, saldo, resumo = integration_service.registrar_salario_mensal(user_id, data)
            
            response_data = {
                'receita': receita.to_dict(),
                'saldo': saldo.to_dict(),
                'resumo_mensal': resumo.to_dict() if resumo else None
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao registrar salário: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def por_periodo(self, request):
        """Busca receitas em um período específico."""
        user_id = self.get_user_id(request)
        
        try:
            # Obter parâmetros de data
            inicio_str = request.query_params.get('inicio')
            fim_str = request.query_params.get('fim')
            
            if not inicio_str or not fim_str:
                return Response(
                    {"detail": "Parâmetros 'inicio' e 'fim' são obrigatórios."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            inicio = datetime.fromisoformat(inicio_str)
            fim = datetime.fromisoformat(fim_str)
            
            receitas = self.service.get_by_periodo(user_id, inicio, fim)
            serialized_receitas = [r.to_dict() for r in receitas]
            
            return Response(serialized_receitas)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao buscar receitas por período: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConfiguracaoFinanceiraViewSet(FirestoreViewSet):
    """ViewSet para gerenciar configurações financeiras."""
    collection_name = "configuracoes_financeiras"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = ConfiguracaoFinanceiraService()
    
    def retrieve(self, request, pk=None):
        """Obtém as configurações financeiras do usuário."""
        user_id = self.get_user_id(request)
        
        try:
            config = self.service.get_or_create_default(user_id)
            return Response(config.to_dict())
        except Exception as e:
            return Response(
                {"detail": f"Erro ao obter configurações: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, pk=None):
        """Atualiza as configurações financeiras do usuário."""
        user_id = self.get_user_id(request)
        data = request.data.copy()
        data['user_id'] = user_id
        
        try:
            config = ConfiguracaoFinanceira(**data)
            updated_config = self.service.create_or_update(config)
            return Response(updated_config.to_dict())
        except Exception as e:
            return Response(
                {"detail": f"Erro ao atualizar configurações: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class SaldoViewSet(FirestoreViewSet):
    """ViewSet para gerenciar saldos."""
    collection_name = "saldos"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = SaldoService()
    
    def list(self, request):
        """Lista todos os registros de saldo do usuário."""
        user_id = self.get_user_id(request)
        
        try:
            saldos = self.service.query([
                ("user_id", "==", user_id)
            ])
            serialized_saldos = [s.to_dict() for s in saldos]
            return Response(serialized_saldos)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao listar saldos: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    @permission_classes([AllowAny])
    def atual(self, request):
        """Obtém o saldo atual do usuário."""
        # Para teste, vamos usar o ID do usuário autenticado se disponível,
        # caso contrário, usamos um ID de usuário fixo
        user_id = self.get_user_id(request)
        if not user_id:
            user_id = "user_teste_123"
        
        try:
            saldo_atual = self.service.get_saldo_atual(user_id)
            return Response({"saldo": saldo_atual})
        except Exception as e:
            return Response(
                {"detail": f"Erro ao obter saldo atual: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def ajustar(self, request):
        """Ajusta manualmente o saldo do usuário."""
        user_id = self.get_user_id(request)
        
        try:
            valor = request.data.get('valor')
            descricao = request.data.get('descricao', 'Ajuste manual de saldo')
            
            if valor is None:
                return Response(
                    {"detail": "O parâmetro 'valor' é obrigatório."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            saldo = self.service.registrar_movimentacao(
                user_id=user_id,
                valor=float(valor),
                tipo="ajuste",
                referencia_id="",
                descricao=descricao
            )
            
            return Response(saldo.to_dict())
        except Exception as e:
            return Response(
                {"detail": f"Erro ao ajustar saldo: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class ResumoMensalViewSet(FirestoreViewSet):
    """ViewSet para gerenciar resumos mensais."""
    collection_name = "resumos_mensais"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = ResumoMensalService()
    
    def list(self, request):
        """Lista todos os resumos mensais do usuário."""
        user_id = self.get_user_id(request)
        
        try:
            resumos = self.service.query([
                ("user_id", "==", user_id)
            ])
            serialized_resumos = [r.to_dict() for r in resumos]
            return Response(serialized_resumos)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao listar resumos mensais: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def por_periodo(self, request):
        """Obtém o resumo mensal para um período específico."""
        user_id = self.get_user_id(request)
        
        try:
            # Obter parâmetros
            ano = request.query_params.get('ano')
            mes = request.query_params.get('mes')
            
            if not ano or not mes:
                return Response(
                    {"detail": "Parâmetros 'ano' e 'mes' são obrigatórios."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            resumo = self.service.get_by_periodo(user_id, int(ano), int(mes))
            if not resumo:
                # Criar um novo resumo
                resumo = self.service.atualizar_resumo(user_id, int(ano), int(mes))
            
            return Response(resumo.to_dict())
        except Exception as e:
            return Response(
                {"detail": f"Erro ao obter resumo mensal: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def balanco_completo(self, request):
        """
        Obtém um balanço financeiro completo com receitas, despesas, saldo e projeções.
        """
        user_id = self.get_user_id(request)
        
        try:
            # Obter parâmetros ou usar o mês atual
            hoje = datetime.now()
            ano = int(request.query_params.get('ano', hoje.year))
            mes = int(request.query_params.get('mes', hoje.month))
            
            integration_service = IntegrationService()
            balanco = integration_service.calcular_balanco_mensal(user_id, ano, mes)
            
            return Response(balanco)
        except Exception as e:
            return Response(
                {"detail": f"Erro ao calcular balanço mensal: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
