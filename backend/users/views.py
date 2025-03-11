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
    View de teste para verificar se a API está funcionando.
    """
    return JsonResponse({
        'message': 'Hello, World! API VicCoin está funcionando!'
    })
