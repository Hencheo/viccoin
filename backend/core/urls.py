"""
URL configuration for core project.

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
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

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

urlpatterns = [
    path('api/health/', health_check, name='health_check'),
    path('api/', include('firestore_api.urls')),  # Incluindo as URLs do nosso app Firestore
    # As URLs específicas das aplicações serão adicionadas quando as coleções do Firestore forem configuradas
]
