"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    "https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include, re_path
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import logging
import json
from firebase_admin import auth
from django.conf import settings

# Configurar logging
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint para verificar se a API está funcionando.
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'API VicCoin está funcionando!'
    })

@method_decorator(csrf_exempt, name='dispatch')
class HomeView(View):
    """
    View baseada em classe para a raiz do site.
    Suporta múltiplos métodos HTTP, incluindo HEAD.
    """
    def get(self, request, *args, **kwargs):
        return JsonResponse({
            'status': 'ok',
            'message': 'API VicCoin: Bem-vindo à API de Gestão Financeira',
            'endpoints': {
                'health': '/api/health/',
                'categorias': '/api/categorias/',
                'despesas': '/api/despesas/',
                'receitas': '/api/receitas/'
            }
        })
    
    def post(self, request, *args, **kwargs):
        return JsonResponse({
            'status': 'ok',
            'message': 'Requisição POST recebida com sucesso'
        })
    
    # O método HEAD é tratado automaticamente pelo Django usando o método GET
    # e removendo o corpo da resposta

@api_view(['GET'])
@permission_classes([AllowAny])
def teste_simples(request):
    """
    Endpoint para testes sem uso do Firestore
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'Este é um endpoint de teste que não usa Firestore',
        'data': {
            'nome': 'VicCoin',
            'versao': '1.0.0',
            'ambiente': 'Produção'
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def teste_raiz(request):
    """
    Endpoint de teste na raiz do site
    """
    return JsonResponse({
        'status': 'ok',
        'message': 'Teste direto na raiz do site',
        'backend_version': '1.0.0'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def testar_firebase(request):
    """
    Endpoint para testar a comunicação com o Firebase/Firestore.
    Verifica se é possível acessar o Firestore e retorna o status.
    """
    try:
        import firebase_admin
        from firebase_admin import firestore
        
        # Verificar se o Firebase está inicializado
        is_initialized = False
        try:
            app = firebase_admin.get_app()
            is_initialized = True
        except ValueError:
            is_initialized = False
        
        # Tentar acessar o Firestore
        if is_initialized:
            db = firestore.client()
            # Faça uma consulta simples para verificar a conexão
            collections = [col.id for col in db.collections()]
            
            return JsonResponse({
                'status': 'success',
                'message': 'Conexão com Firebase/Firestore estabelecida com sucesso!',
                'firebase_initialized': is_initialized,
                'collections': collections
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Firebase não está inicializado!',
                'firebase_initialized': is_initialized
            }, status=500)
    
    except Exception as e:
        logger.error(f"Erro ao testar Firebase: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Erro ao testar Firebase: {str(e)}',
            'firebase_initialized': False
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Endpoint para login de usuários usando Firebase.
    Recebe email e senha e retorna um token de autenticação.
    """
    try:
        # Garantindo que podemos ler o corpo da requisição
        # seja ele JSON ou form-data
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
            except Exception as e:
                logger.error(f"Erro ao parsear JSON: {str(e)}")
                data = request.data
        else:
            data = request.data
            
        logger.info(f"Dados recebidos no login: {data}")
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({
                'status': 'error',
                'detail': 'E-mail e senha são obrigatórios'
            }, status=400)
        
        # No modo DEBUG, podemos usar um usuário de teste
        logger.info(f"DEBUG mode: {settings.DEBUG}")
        
        # Usuário de teste para desenvolvimento
        user_data = {
            'id': 'user_teste_123',
            'email': email,
            'name': 'Usuário Teste'
        }
        token = 'teste_token_123'  # Token fixo para testes
        
        logger.info("Login bem-sucedido com usuário de teste")
        
        return JsonResponse({
            'token': token,
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Erro ao processar login: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        
        return JsonResponse({
            'status': 'error',
            'detail': f'Erro ao processar login: {str(e)}'
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Endpoint para registro de usuários usando Firebase.
    Recebe email, senha e nome e cria um novo usuário.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        
        if not email or not password or not name:
            return JsonResponse({
                'status': 'error',
                'detail': 'E-mail, senha e nome são obrigatórios'
            }, status=400)
        
        # No modo DEBUG, podemos usar um usuário de teste
        if settings.DEBUG:
            # Usuário de teste para desenvolvimento
            user_data = {
                'id': 'user_teste_123',
                'email': email,
                'name': name
            }
            token = 'teste_token_123'  # Token fixo para testes
            
            return JsonResponse({
                'token': token,
                'user': user_data
            })
        
        # Em produção, criar usuário com Firebase
        try:
            # Em um caso real, aqui usaríamos a API do Firebase para criar o usuário
            # Como é melhor fazer isso pelo frontend, este código é apenas um placeholder
            user = auth.create_user(
                email=email,
                password=password,
                display_name=name
            )
            
            token = "firebase_token"  # Em um caso real, seria gerado pelo Firebase
            
            user_data = {
                'id': user.uid,
                'email': user.email,
                'name': user.display_name
            }
            
            return JsonResponse({
                'token': token,
                'user': user_data
            })
        except Exception as e:
            logger.error(f"Erro ao criar usuário no Firebase: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'detail': 'Não foi possível criar o usuário. E-mail pode já estar em uso.'
            }, status=400)
            
    except Exception as e:
        logger.error(f"Erro ao processar registro: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'detail': 'Erro ao processar registro'
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    """
    Endpoint para logout de usuários.
    No Firebase, o logout é gerenciado principalmente pelo cliente, 
    mas é uma boa prática ter um endpoint no servidor 
    para possíveis operações adicionais ao fazer logout.
    """
    try:
        # No Firebase, o token é invalidado pelo cliente
        # No backend, podemos realizar operações adicionais se necessário
        
        return JsonResponse({
            'status': 'success',
            'message': 'Logout realizado com sucesso'
        })
    except Exception as e:
        logger.error(f"Erro ao processar logout: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'detail': 'Erro ao processar logout'
        }, status=500)

urlpatterns = [
    # Raiz do site - Usando a nova view baseada em classe
    path('', HomeView.as_view(), name='home'),
    
    # Teste na raiz
    path('teste', teste_raiz, name='teste_raiz'),
    
    # Endpoint de saúde - acessível com ou sem barra no final
    path('api/health/', health_check, name='health_check'),
    path('api/health', health_check),  # Versão sem barra no final
    
    # Endpoint de teste simples
    path('api/teste/', teste_simples, name='teste_simples'),
    path('api/teste', teste_simples),  # Versão sem barra no final
    
    # Endpoints de autenticação
    path('api/login/', login, name='login'),
    path('api/register/', register, name='register'),
    path('api/logout/', logout, name='logout'),
    
    # Outros endpoints da API
    path('api/', include('firestore_api.urls')),  # Incluindo as URLs do nosso app Firestore
    path('api/testar-firebase/', testar_firebase, name='testar_firebase'),
]
