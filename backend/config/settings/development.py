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


INSTALLED_APPS += [
    "corsheaders",
]

# Agregar middleware de CORS al inicio
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
] + MIDDLEWARE

# Permitir todas las solicitudes cross-origin en desarrollo
CORS_ALLOW_ALL_ORIGINS = True