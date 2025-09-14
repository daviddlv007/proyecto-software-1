from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]  # abierto en desarrollo

# Base de datos simple (sqlite por defecto)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
