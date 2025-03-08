"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import sys

# Adicionar o diretório atual ao PYTHONPATH
current_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_path not in sys.path:
    sys.path.append(current_path)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()
