from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('hello-world/', views.hello_world, name='hello_world'),
    path('firebase-test/', views.firebase_test, name='firebase_test'),
    path('perfil/', views.perfil, name='perfil'),
] 