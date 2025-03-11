"""
URL configuration for viccoin project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
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
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from .health import health_check_view
from . import views

def api_root(request):
    """
    Endpoint raiz da API que lista os endpoints disponíveis.
    """
    return JsonResponse({
        'message': 'Bem-vindo à API do VicCoin!',
        'version': '1.0.0',
        'endpoints': {
            'users': {
                'register': '/api/users/register/',
                'login': '/api/users/login/',
                'hello_world': '/api/users/hello-world/',
                'firebase_test': '/api/users/firebase-test/',
            },
            'transacoes': {
                'despesa': '/api/transacoes/despesa/',
                'ganho': '/api/transacoes/ganho/',
                'salario': '/api/transacoes/salario/',
                'listar': '/api/transacoes/listar/',
                'resumo': '/api/transacoes/resumo/',
                'relatorio': '/api/transacoes/relatorio/',
            },
            'health': '/health/',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_root, name='api_root'),
    path('api/users/', include('users.urls', namespace='users')),
    path('health/', health_check_view, name='health_check'),
    
    # Novas rotas para transações financeiras
    path('api/transacoes/despesa/', views.adicionar_despesa, name='adicionar_despesa'),
    path('api/transacoes/ganho/', views.adicionar_ganho, name='adicionar_ganho'),
    path('api/transacoes/salario/', views.adicionar_salario, name='adicionar_salario'),
    path('api/transacoes/listar/', views.listar_transacoes, name='listar_transacoes'),
    path('api/transacoes/resumo/', views.obter_resumo_financeiro, name='obter_resumo_financeiro'),
    path('api/transacoes/relatorio/', views.relatorio_por_periodo, name='relatorio_por_periodo'),
]
