"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

settings_module = os.getenv('DJANGO_SETTINGS_MODULE')
if not settings_module:
    raise RuntimeError(
        "ERROR: debes definir DJANGO_SETTINGS_MODULE, "
        "ejemplo: export DJANGO_SETTINGS_MODULE=config.settings.development"
    )
os.environ['DJANGO_SETTINGS_MODULE'] = settings_module


application = get_wsgi_application()
