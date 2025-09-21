# ==========================================
# Makefile para desarrollo Docker Compose
# ==========================================

# Variables
COMPOSE_FILE=docker-compose.dev.yml
COMPOSE_CMD=docker compose -f $(COMPOSE_FILE)

# Exporta variables del env (opcional)
include .env
export

# ==========================================
# ENTORNO COMPLETO
# ==========================================

# Levanta todos los contenedores en modo desarrollo
up:
	$(COMPOSE_CMD) up -d --build

# Detiene y elimina todos los contenedores del entorno dev
down:
	$(COMPOSE_CMD) down

# Reinicia todo el entorno
restart: down up

# Muestra logs en tiempo real de todos los contenedores
logs:
	$(COMPOSE_CMD) logs -f

# ==========================================
# COMANDOS FRONTEND
# ==========================================

# Abre un shell interactivo en un contenedor nuevo del frontend
run-frontend:
	$(COMPOSE_CMD) run --rm frontend bash

# Accede a un contenedor frontend en ejecución
exec-frontend:
	$(COMPOSE_CMD) exec frontend bash

# Levanta solo el frontend
start-frontend:
	$(COMPOSE_CMD) up -d --no-deps frontend

# Apaga solo el frontend
stop-frontend:
	$(COMPOSE_CMD) stop frontend

# Muestra logs en tiempo real del frontend
logs-frontend:
	$(COMPOSE_CMD) logs -f frontend

# Build del frontend
build-frontend:
	$(COMPOSE_CMD) build frontend

# ==========================================
# COMANDOS BACKEND
# ==========================================

# Abre un shell interactivo en un contenedor nuevo del backend
run-backend:
	$(COMPOSE_CMD) run --rm backend bash

# Accede a un contenedor backend en ejecución
exec-backend:
	$(COMPOSE_CMD) exec backend bash

# Levanta solo el backend
start-backend:
	$(COMPOSE_CMD) up -d --no-deps backend

# Apaga solo el backend
stop-backend:
	$(COMPOSE_CMD) stop backend

# Muestra logs en tiempo real del backend
logs-backend:
	$(COMPOSE_CMD) logs -f backend

# Build del backend
build-backend:
	$(COMPOSE_CMD) build backend

# Build del backend sin usar cache
rebuild-backend:
	$(COMPOSE_CMD) build --no-cache backend



# ==========================================
# MIGRACIONES DJANGO
# ==========================================

# Crea las migraciones a partir de los cambios en models.py
# Variable opcional DOMAIN, por defecto vacía
makemigrate:
	$(COMPOSE_CMD) exec backend python manage.py makemigrations
	$(COMPOSE_CMD) exec backend python manage.py migrate


reset-db-only:
	@echo "🔹 Eliminando base de datos SQLite..."
	@$(COMPOSE_CMD) exec backend rm -f db.sqlite3 || true
	@echo "🔹 Borrando migraciones de todos los dominios..."
	@$(COMPOSE_CMD) exec backend bash -c '\
	for d in domains/*/; do \
	  echo "  - Limpiando migraciones de $$d"; \
	  rm -f $$d/migrations/000*.py; \
	done \
	'
	@echo "✅ Base de datos y migraciones borradas. Ahora puedes ejecutar 'make makemigrate' por separado."


# Reinicia la base de datos y aplica migraciones (opcional)
reset-db:
	@echo "🔹 Eliminando base de datos SQLite..."
	@$(COMPOSE_CMD) exec backend rm -f db.sqlite3 || true
	@echo "🔹 Borrando migraciones y recreando migraciones iniciales..."
	@$(COMPOSE_CMD) exec backend bash -c '\
	for d in domains/*/; do \
	  echo "  - Limpiando migraciones de $$d"; \
	  rm -f $$d/migrations/000*.py; \
	  app=$$(basename $$d); \
	  echo "  - Creando migraciones iniciales para $$app"; \
	  python manage.py makemigrations $$app; \
	done \
	'
	@echo "🔹 Aplicando migrate..."
	@$(COMPOSE_CMD) exec backend python manage.py migrate



# ==========================================
# COMANDOS SCRIPTS
# ==========================================

# Abre un shell interactivo en un contenedor nuevo del scripts
run-scripts:
	$(COMPOSE_CMD) run --rm scripts bash

	
# ==========================================
# UTILIDADES
# ==========================================

# Imprime URLs de desarrollo
show-urls:
	@echo "Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "Backend:  http://localhost:$(BACKEND_PORT)/admin/"


# Levanta todos los contenedores excepto el mock
up-no-mock:
	$(COMPOSE_CMD) up -d --build backend frontend scripts swagger-ui
