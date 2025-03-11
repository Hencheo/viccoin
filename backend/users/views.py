from django.shortcuts import render
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from .services import UserService
from .serializers import UserSerializer

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
        return JsonResponse({
            'success': False,
            'message': 'Erro interno do servidor',
            'error': str(e)
        }, status=500)

@require_http_methods(['GET'])
def hello_world(request):
    """
    Endpoint simples para verificar se a API está funcionando.
    """
    return JsonResponse({'message': 'Hello, World! API VicCoin está funcionando!'})

@require_http_methods(['GET'])
def firebase_test(request):
    """
    Endpoint para testar a conexão com o Firebase.
    Realiza operações básicas de leitura e escrita para verificar a funcionalidade.
    """
    import json
    import datetime
    import logging
    from viccoin.firebase import db
    
    # Configurar logger
    logger = logging.getLogger(__name__)
    
    response = {
        'timestamp': datetime.datetime.now().isoformat(),
        'tests': {
            'connection': {'status': 'pending', 'message': ''},
            'write': {'status': 'pending', 'message': ''},
            'read': {'status': 'pending', 'message': ''},
            'query': {'status': 'pending', 'message': ''}
        },
        'overall_status': 'pending'
    }
    
    try:
        # Teste 1: Verificar conexão
        if db is not None:
            response['tests']['connection']['status'] = 'success'
            response['tests']['connection']['message'] = 'Conexão com Firestore estabelecida'
            logger.info("Teste de Firebase: Conexão estabelecida")
        else:
            response['tests']['connection']['status'] = 'error'
            response['tests']['connection']['message'] = 'Falha ao conectar com Firestore'
            logger.error("Teste de Firebase: Falha na conexão")
            raise ValueError("Cliente Firestore não inicializado")
        
        # Teste 2: Operação de escrita
        test_doc_ref = db.collection('firebase_tests').document('test_' + datetime.datetime.now().strftime('%Y%m%d%H%M%S'))
        test_data = {
            'timestamp': datetime.datetime.now().isoformat(),
            'test_value': 'test_data',
            'random_number': datetime.datetime.now().microsecond
        }
        test_doc_ref.set(test_data)
        response['tests']['write']['status'] = 'success'
        response['tests']['write']['message'] = f'Documento criado com sucesso: {test_doc_ref.id}'
        logger.info(f"Teste de Firebase: Escrita bem-sucedida em {test_doc_ref.id}")
        
        # Teste 3: Operação de leitura
        read_data = test_doc_ref.get().to_dict()
        if read_data and read_data.get('test_value') == 'test_data':
            response['tests']['read']['status'] = 'success'
            response['tests']['read']['message'] = 'Leitura de documento bem-sucedida'
            logger.info("Teste de Firebase: Leitura bem-sucedida")
        else:
            response['tests']['read']['status'] = 'error'
            response['tests']['read']['message'] = 'Falha ao ler documento ou dados incorretos'
            logger.error("Teste de Firebase: Falha na leitura")
        
        # Teste 4: Operação de consulta
        query_result = db.collection('firebase_tests').where('test_value', '==', 'test_data').limit(10).get()
        count = len(query_result)
        response['tests']['query']['status'] = 'success'
        response['tests']['query']['message'] = f'Consulta retornou {count} documentos'
        logger.info(f"Teste de Firebase: Consulta retornou {count} documentos")
        
        # Definir status geral
        all_success = all(test['status'] == 'success' for test in response['tests'].values())
        response['overall_status'] = 'success' if all_success else 'error'
        
    except Exception as e:
        logger.error(f"Erro no teste de Firebase: {str(e)}")
        # Atualizar status dos testes que ainda estão pendentes
        for test_name, test_data in response['tests'].items():
            if test_data['status'] == 'pending':
                test_data['status'] = 'error'
                test_data['message'] = 'Teste não executado devido a erro anterior'
        
        response['overall_status'] = 'error'
        response['error'] = str(e)
    
    # Retornar resposta com código de status apropriado
    status_code = 200 if response['overall_status'] == 'success' else 500
    return JsonResponse(response, status=status_code)
