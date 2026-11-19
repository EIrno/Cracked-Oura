COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

.PHONY: help install dev build-docker start up stop down restart status logs build-frontend build-backend build-desktop

help:
	@echo "Available targets:"
	@echo "  make install         Install backend venv deps and frontend npm deps"
	@echo "  make dev             Run local development environment (React + Electron)"
	@echo "  make build-docker    Build Docker image (frontend + backend + Playwright)"
	@echo "  make start           Build (if needed) and start Docker container"
	@echo "  make stop            Stop Docker container (preserves persistent data)"
	@echo "  make restart         Rebuild and restart Docker container"
	@echo "  make status          Show Docker container status"
	@echo "  make logs            Follow Docker container logs"
	@echo "  make build-frontend  Build React web bundle in frontend/dist"
	@echo "  make build-backend   Package Python backend via PyInstaller"
	@echo "  make build-desktop   Build full Electron desktop package"

install:
	cd backend && ( [ -d venv ] || python3 -m venv venv ) && ./venv/bin/pip install -r requirements.txt
	cd frontend && npm install

dev:
	cd frontend && npm run dev

build-docker:
	$(COMPOSE) build

start up:
	./DockerStart.sh

stop down:
	./DockerStop.sh

restart:
	./DockerStop.sh
	./DockerStart.sh --build

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f

build-frontend:
	cd frontend && npm run build:web

build-backend:
	cd frontend && npm run build:backend

build-desktop:
	cd frontend && npm run build
