from .base import *
import os

DEBUG = False

# Hosts públicos desde la variable de entorno
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "").split(",")

# Hosts internos para healthchecks y requests desde el mismo contenedor
INTERNAL_HOSTS = ["127.0.0.1", "localhost"]
ALLOWED_HOSTS.extend(INTERNAL_HOSTS)

ROOT_URLCONF = "config.urls"

# Base de datos productiva (ej: PostgreSQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv("POSTGRES_DB", "config"),
        'USER': os.getenv("POSTGRES_USER", "postgres"),
        'PASSWORD': os.getenv("POSTGRES_PASSWORD", ""),
        'HOST': os.getenv("POSTGRES_HOST", "db"),
        'PORT': os.getenv("POSTGRES_PORT", "5432"),
    }
}

# Archivos estáticos recolectados
STATIC_ROOT = "/vol/django_static"
