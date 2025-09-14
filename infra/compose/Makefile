# Variables
ENV_FILE=../../.env
COMPOSE_FILE=docker-compose.dev.yml
COMPOSE_CMD=docker compose -f $(COMPOSE_FILE) --env-file $(ENV_FILE)

# Exporta variables del env
include ../../.env
export

# Levanta todos los contenedores en modo desarrollo
up:
	$(COMPOSE_CMD) up -d --build

# Detiene y elimina contenedores del entorno dev
down:
	$(COMPOSE_CMD) down

# Muestra logs en tiempo real de todos los contenedores
logs:
	$(COMPOSE_CMD) logs -f

# Abre un shell interactivo en el contenedor del backend
run-backend:
	$(COMPOSE_CMD) run --rm backend bash

# Abre un shell interactivo en el contenedor del frontend
run-frontend:
	$(COMPOSE_CMD) run --rm frontend bash

# Reinicia todo el entorno
restart: down up

# Imprime URLs de desarrollo
show-urls:
	@echo "Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "Backend:  http://localhost:$(BACKEND_PORT)/admin/"
