from django.shortcuts import render
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from .services import UserService
from .serializers import UserSerializer
from viccoin.firebase import db
import datetime
import logging

# Configurar logger
logger = logging.getLogger(__name__)

# Create your views here.

@csrf_exempt
@require_http_methods(['POST'])
def register(request):
    """
    View para registrar um novo usuário.
    """
    try:
        # Obter dados da requisição
        data = json.loads(request.body)
        
        # Validar dados
        validated_data = UserSerializer.validate_registration(data)
        
        # Criar usuário
        user = UserService.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            nome=validated_data['nome']
        )
        
        # Retornar resposta de sucesso
        return JsonResponse({
            'success': True,
            'message': 'Usuário registrado com sucesso',
            'user': UserSerializer.serialize(user)
        }, status=201)
        
    except ValidationError as e:
        # Erro de validação
        return JsonResponse({
            'success': False,
            'message': 'Erro de validação',
            'errors': e.message_dict if hasattr(e, 'message_dict') else {"detail": str(e)}
        }, status=400)
        
    except ValueError as e:
        # Erro de valor (email já em uso)
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)
        
    except Exception as e:
        # Erro interno
        logger.error(f"Erro ao registrar usuário: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'message': 'Erro interno do servidor',
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(['POST'])
def login(request):
    """
    View para fazer login.
    """
    try:
        # Obter dados da requisição
        data = json.loads(request.body)
        
        # Validar dados
        validated_data = UserSerializer.validate_login(data)
        
        # Verificar usuário
        user = UserService.verify_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Verificar se o usuário existe
        if user is None:
            return JsonResponse({
                'success': False,
                'message': 'Email ou senha incorretos'
            }, status=401)
        
        # Retornar resposta de sucesso
        return JsonResponse({
            'success': True,
            'message': 'Login realizado com sucesso',
            'user': UserSerializer.serialize(user)
        })
        
    except ValidationError as e:
        # Erro de validação
        return JsonResponse({
            'success': False,
            'message': 'Erro de validação',
            'errors': e.message_dict if hasattr(e, 'message_dict') else {"detail": str(e)}
        }, status=400)
        
    except Exception as e:
        # Erro interno
        logger.error(f"Erro ao fazer login: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'message': 'Erro interno do servidor',
            'error': str(e)
        }, status=500)

@require_http_methods(['GET'])
def hello_world(request):
    """
    View de teste para verificar se a API está funcionando.
    """
    return JsonResponse({
        'message': 'Hello, World! API VicCoin está funcionando!'
    })

@require_http_methods(['GET'])
def firebase_test(request):
    """
    View de teste para verificar a comunicação com o Firebase.
    Realiza operações básicas de leitura e escrita no Firestore.
    """
    results = {
        'success': True,
        'timestamp': datetime.datetime.now().isoformat(),
        'tests': {}
    }
    
    try:
        # Teste 1: Verificar conexão com o Firestore
        results['tests']['connection'] = {
            'status': 'success',
            'message': 'Conexão com Firebase estabelecida'
        }
        
        # Teste 2: Operação de escrita
        test_doc_ref = db.collection('firebase_tests').document('test_connection')
        test_data = {
            'timestamp': datetime.datetime.now().isoformat(),
            'environment': 'render',
            'test_id': f"test_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        }
        
        test_doc_ref.set(test_data)
        results['tests']['write_operation'] = {
            'status': 'success',
            'message': 'Operação de escrita bem-sucedida',
            'data': test_data
        }
        
        # Teste 3: Operação de leitura
        read_result = test_doc_ref.get().to_dict()
        results['tests']['read_operation'] = {
            'status': 'success',
            'message': 'Operação de leitura bem-sucedida',
            'data': read_result
        }
        
        # Teste 4: Consulta com filtro
        query = db.collection('firebase_tests').where('environment', '==', 'render').limit(5).get()
        query_results = [doc.to_dict() for doc in query]
        results['tests']['query_operation'] = {
            'status': 'success',
            'message': 'Operação de consulta bem-sucedida',
            'count': len(query_results)
        }
        
        return JsonResponse(results)
        
    except Exception as e:
        logger.error(f"Erro no teste do Firebase: {str(e)}", exc_info=True)
        
        # Se houver erro, atualizar o status geral
        results['success'] = False
        results['error'] = str(e)
        
        # Adicionar informação sobre o erro ao teste específico que falhou
        if 'connection' not in results['tests']:
            results['tests']['connection'] = {
                'status': 'error',
                'message': f'Falha na conexão com Firebase: {str(e)}'
            }
        
        return JsonResponse(results, status=500)
