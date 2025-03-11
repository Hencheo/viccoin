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
            'health': '/health/',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_root, name='api_root'),
    path('api/users/', include('users.urls', namespace='users')),
    path('health/', health_check_view, name='health_check'),
]
