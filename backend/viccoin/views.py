import json
import logging
import jwt
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .firebase import firestore_client

logger = logging.getLogger(__name__)

def get_user_id_from_token(request):
    """
    Extrai o user_id do token JWT de autorização.
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except Exception as e:
        logger.error(f"Erro ao decodificar token: {str(e)}")
        return None

@csrf_exempt
@require_http_methods(["POST"])
def adicionar_despesa(request):
    """
    Adiciona uma nova despesa para o usuário.
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        dados = json.loads(request.body)
        
        # Validar dados
        if 'valor' not in dados or not dados['valor']:
            return JsonResponse({'success': False, 'message': 'Valor é obrigatório'}, status=400)
        
        if 'data' not in dados or not dados['data']:
            dados['data'] = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # Adicionar despesa
        despesa_id = firestore_client.add_despesa(user_id, dados)
        
        return JsonResponse({
            'success': True, 
            'message': 'Despesa adicionada com sucesso',
            'despesa_id': despesa_id
        })
    except Exception as e:
        logger.error(f"Erro ao adicionar despesa: {str(e)}")
        return JsonResponse({
            'success': False, 
            'message': f'Erro ao adicionar despesa: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def adicionar_ganho(request):
    """
    Adiciona um novo ganho para o usuário.
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        dados = json.loads(request.body)
        
        # Validar dados
        if 'valor' not in dados or not dados['valor']:
            return JsonResponse({'success': False, 'message': 'Valor é obrigatório'}, status=400)
        
        if 'data' not in dados or not dados['data']:
            dados['data'] = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # Adicionar ganho
        ganho_id = firestore_client.add_ganho(user_id, dados)
        
        return JsonResponse({
            'success': True, 
            'message': 'Ganho adicionado com sucesso',
            'ganho_id': ganho_id
        })
    except Exception as e:
        logger.error(f"Erro ao adicionar ganho: {str(e)}")
        return JsonResponse({
            'success': False, 
            'message': f'Erro ao adicionar ganho: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def adicionar_salario(request):
    """
    Adiciona um novo registro de salário para o usuário.
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        dados = json.loads(request.body)
        
        # Validar dados
        if 'valor' not in dados or not dados['valor']:
            return JsonResponse({'success': False, 'message': 'Valor é obrigatório'}, status=400)
        
        if 'data_recebimento' not in dados or not dados['data_recebimento']:
            dados['data_recebimento'] = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # Adicionar salário
        salario_id = firestore_client.add_salario(user_id, dados)
        
        return JsonResponse({
            'success': True, 
            'message': 'Salário adicionado com sucesso',
            'salario_id': salario_id
        })
    except Exception as e:
        logger.error(f"Erro ao adicionar salário: {str(e)}")
        return JsonResponse({
            'success': False, 
            'message': f'Erro ao adicionar salário: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def listar_transacoes(request):
    """
    Lista todas as transações de um usuário ou filtra por tipo.
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        tipo = request.GET.get('tipo', None)
        limite = int(request.GET.get('limite', 10))
        
        transacoes = firestore_client.get_transacoes(user_id, tipo, limite)
        
        return JsonResponse({
            'success': True,
            'transacoes': transacoes
        })
    except Exception as e:
        logger.error(f"Erro ao listar transações: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Erro ao listar transações: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def obter_resumo_financeiro(request):
    """
    Obtém um resumo financeiro do usuário com saldo e totais.
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        # Obter documento do usuário
        usuario_ref = firestore_client.document(f"users/{user_id}")
        usuario = usuario_ref.get()
        
        if not usuario.exists:
            return JsonResponse({'success': False, 'message': 'Usuário não encontrado'}, status=404)
        
        dados_usuario = usuario.to_dict()
        saldo = dados_usuario.get('saldo', 0)
        
        # Obter transações recentes
        transacoes = firestore_client.get_transacoes(user_id, limite=5)
        
        # Calcular totais
        total_despesas = sum(t['valor'] for t in transacoes if t.get('tipo') == 'despesa')
        total_ganhos = sum(t['valor'] for t in transacoes if t.get('tipo') in ['ganho', 'salario'])
        
        return JsonResponse({
            'success': True,
            'saldo': saldo,
            'total_despesas': total_despesas,
            'total_ganhos': total_ganhos,
            'transacoes_recentes': transacoes[:5]
        })
    except Exception as e:
        logger.error(f"Erro ao obter resumo financeiro: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Erro ao obter resumo financeiro: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def relatorio_por_periodo(request):
    """
    Obtém um relatório financeiro filtrado por período.
    
    Parâmetros de consulta:
    - periodo: 'semanal', 'mensal', 'anual' (opcional)
    - data_inicio: Data inicial no formato 'YYYY-MM-DD' (opcional)
    - data_fim: Data final no formato 'YYYY-MM-DD' (opcional)
    - tipo: Tipo de transação ('despesa', 'ganho', 'salario') (opcional)
    - limite: Número máximo de transações por tipo (opcional, padrão 100)
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        # Obter parâmetros da consulta
        periodo = request.GET.get('periodo')
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        tipo = request.GET.get('tipo')
        
        # Obter limite (com valor padrão)
        try:
            limite = int(request.GET.get('limite', 100))
        except ValueError:
            limite = 100
        
        # Validar período
        if periodo and periodo not in ['semanal', 'mensal', 'anual']:
            return JsonResponse({
                'success': False,
                'message': "Período inválido. Use 'semanal', 'mensal' ou 'anual'."
            }, status=400)
        
        # Validar tipo
        if tipo and tipo not in ['despesa', 'ganho', 'salario']:
            return JsonResponse({
                'success': False,
                'message': "Tipo inválido. Use 'despesa', 'ganho' ou 'salario'."
            }, status=400)
        
        # Validar datas (formato YYYY-MM-DD)
        if data_inicio:
            try:
                datetime.datetime.strptime(data_inicio, '%Y-%m-%d')
            except ValueError:
                return JsonResponse({
                    'success': False, 
                    'message': "Formato de data_inicio inválido. Use o formato 'YYYY-MM-DD'."
                }, status=400)
        
        if data_fim:
            try:
                datetime.datetime.strptime(data_fim, '%Y-%m-%d')
            except ValueError:
                return JsonResponse({
                    'success': False, 
                    'message': "Formato de data_fim inválido. Use o formato 'YYYY-MM-DD'."
                }, status=400)
        
        # Obter relatório
        logger.info(f"Gerando relatório para usuário {user_id} (período: {periodo}, de {data_inicio} até {data_fim})")
        resultado = firestore_client.get_transacoes_por_periodo(
            user_id, 
            periodo=periodo, 
            data_inicio=data_inicio, 
            data_fim=data_fim, 
            tipo=tipo, 
            limite=limite
        )
        
        return JsonResponse({
            'success': True,
            'relatorio': resultado
        })
    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Erro ao gerar relatório: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def atualizar_salario(request, salario_id):
    """
    Atualiza um registro de salário existente.
    
    Args:
        request: Objeto de requisição HTTP
        salario_id: ID do registro de salário a ser atualizado
    
    Returns:
        JsonResponse: Resposta com o resultado da operação
    """
    user_id = get_user_id_from_token(request)
    if not user_id:
        return JsonResponse({'success': False, 'message': 'Usuário não autenticado'}, status=401)
    
    try:
        dados = json.loads(request.body)
        
        # Validar dados
        if 'valor' not in dados or not dados['valor']:
            return JsonResponse({'success': False, 'message': 'Valor é obrigatório'}, status=400)
        
        if 'data_recebimento' not in dados or not dados['data_recebimento']:
            dados['data_recebimento'] = datetime.datetime.now().strftime('%Y-%m-%d')
        
        # Verificar se o registro existe e pertence ao usuário
        salario = firestore_client.document(f"users/{user_id}/salario/{salario_id}").get()
        
        if not salario.exists:
            return JsonResponse({'success': False, 'message': 'Registro de salário não encontrado'}, status=404)
        
        # Obter o valor antigo para ajustar o saldo
        dados_antigos = salario.to_dict()
        valor_antigo = float(dados_antigos.get('valor', 0))
        valor_novo = float(dados.get('valor', 0))
        
        # Atualizar registro
        firestore_client.document(f"users/{user_id}/salario/{salario_id}").update({
            'valor': valor_novo,
            'data_recebimento': dados.get('data_recebimento'),
            'periodo': dados.get('periodo', 'mensal'),
            'recorrente': dados.get('recorrente', True),
            'tipo': 'salario'
        })
        
        # Atualizar saldo do usuário (subtrair valor antigo e adicionar valor novo)
        usuario_ref = firestore_client.document(f"users/{user_id}")
        usuario = usuario_ref.get()
        
        if usuario.exists:
            saldo_atual = usuario.to_dict().get('saldo', 0)
            novo_saldo = saldo_atual - valor_antigo + valor_novo
            usuario_ref.update({'saldo': novo_saldo})
        
        return JsonResponse({
            'success': True, 
            'message': 'Salário atualizado com sucesso'
        })
        
    except Exception as e:
        logging.error(f"Erro ao atualizar salário: {str(e)}")
        return JsonResponse({
            'success': False, 
            'message': f'Erro ao atualizar salário: {str(e)}'
        }, status=500) 