# 📝 LLM Schreibapp

Eine moderne, Docker-basierte Schreibanwendung mit Symfony, Summernote-Editor und integrierter KI-Unterstützung über lokale LLMs.

## 🎯 Projektbeschreibung

**LLM Schreibapp** ist eine webbasierte Schreibumgebung für **kreatives und wissenschaftliches Schreiben**. Die Anwendung kombiniert einen funktionalen Rich-Text-Editor mit hierarchischem Notiz-Management und KI-gestützter Schreibhilfe über lokale LLMs.

### Kernfeatures

- **Rich-Text-Editor** mit Summernote (Tabellen, Links, Formatierungen, etc.)
- **Hierarchisches Notiz-System** für strukturierte Projektorganisation  
- **Lokale LLM-Integration** über Ollama (OpenHermes, DeepSeek, etc.)
- **Projekt-basierte Dokumentenverwaltung**
- **Responsive Design** mit Bootstrap 5 und FontAwesome Icons
- **Docker-basierte Entwicklung** für einfache Portabilität
- **Geplant**: Erweiterung für wissenschaftliches Arbeiten

---

## 🚀 Schnellstart

### Voraussetzungen

- **Docker Desktop** (v4.0+) mit Docker Compose
- **Git** für Repository-Management
- **Ollama** für lokale LLM-Integration (optional)

> **Hinweis**: Kein Node.js/npm Build erforderlich! Alle Frontend-Assets über CDN.

### Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/1000Kraniche/llm-schreibapp.git
   cd llm-schreibapp
   ```

2. **Docker-Container starten**
   ```bash
   docker compose build --no-cache
   docker compose up -d --wait
   ```

3. **Composer Dependencies installieren**
   ```bash
   docker compose exec php composer install
   ```

4. **Datenbank initialisieren**
   ```bash
   docker compose exec php bin/console doctrine:migrations:migrate
   ```

5. **Anwendung öffnen**
   ```
   https://localhost
   ```
   
   > **Hinweis**: Akzeptiere das selbst-signierte TLS-Zertifikat im Browser

---

## 🔧 Technischer Stack

### Backend
- **Symfony 7.2** (PHP 8.3.19+)
- **FrankenPHP** mit Caddy Webserver
- **Doctrine ORM 3.3** mit PostgreSQL
- **Twig Template Engine**
- **Symfony Security Bundle** für Authentifizierung
- **HTTP Client** für LLM-API-Aufrufe

### Frontend
- **Summernote Editor** (Rich-Text über CDN)
- **Bootstrap 5.3** für UI/UX
- **FontAwesome Icons** (über CDN)
- **Vanilla JavaScript** (keine Build-Tools erforderlich)

### Infrastructure
- **Docker** mit Multi-Container Setup
- **PostgreSQL 15** als Datenbank
- **Ollama** für lokale LLM-APIs

---

## 📦 Abhängigkeiten

### PHP Dependencies (composer.json)
```json
{
  "require": {
    "php": ">=8.3.19",
    "ext-ctype": "*",
    "ext-iconv": "*",
    "doctrine/dbal": "^3",
    "doctrine/doctrine-bundle": "^2.14",
    "doctrine/doctrine-migrations-bundle": "^3.4",
    "doctrine/orm": "^3.3",
    "runtime/frankenphp-symfony": "^0.2.0",
    "symfony/asset": "7.2.*",
    "symfony/console": "7.2.*",
    "symfony/dotenv": "7.2.*",
    "symfony/flex": "^2",
    "symfony/form": "7.2.*",
    "symfony/framework-bundle": "7.2.*",
    "symfony/http-client": "7.2.*",
    "symfony/runtime": "7.2.*",
    "symfony/security-bundle": "7.2.*",
    "symfony/twig-bundle": "7.2.*",
    "symfony/ux-twig-component": "*",
    "symfony/validator": "7.2.*",
    "symfony/yaml": "7.2.*"
  },
  "require-dev": {
    "squizlabs/php_codesniffer": "^3.13",
    "symfony/maker-bundle": "^1.63",
    "symfony/web-profiler-bundle": "7.2.*"
  }
}
```

### Symfony Bundles
```php
// config/bundles.php
return [
    Symfony\Bundle\FrameworkBundle\FrameworkBundle::class => ['all' => true],
    Symfony\Bundle\MakerBundle\MakerBundle::class => ['dev' => true],
    Doctrine\Bundle\DoctrineBundle\DoctrineBundle::class => ['all' => true],
    Doctrine\Bundle\MigrationsBundle\DoctrineMigrationsBundle::class => ['all' => true],
    Symfony\Bundle\TwigBundle\TwigBundle::class => ['all' => true],
    Symfony\Bundle\SecurityBundle\SecurityBundle::class => ['all' => true],
];
```

### Frontend Assets (CDN)
```html
<!-- Bootstrap 5.3 CSS & JS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js">

<!-- Summernote Editor -->
<link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote.min.css">
<script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote.min.js">

<!-- FontAwesome Icons -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
```

---

## 🗂️ Projektstruktur

```
llm-schreibapp/
├── src/                    # Symfony Anwendungscode
│   ├── Controller/         # Routen & Controller
│   ├── Entity/            # Doctrine Entities
│   └── Repository/        # Datenbank-Repositories
├── templates/             # Twig Templates
│   ├── base.html.twig
│   ├── include/
│   └── page/
├── public/                # Web-Assets
│   ├── assets/
│   │   ├── css/          # Custom CSS + Summernote Styles
│   │   └── js/           # Vanilla JavaScript
│   └── index.php
├── config/                # Symfony Konfiguration
├── migrations/            # Doctrine Migrationen
├── docker-compose.yaml    # Docker Services
├── Dockerfile            # PHP Container
└── composer.json         # PHP Dependencies
```

---

## 🗃️ Datenbank-Schema

### Entitäten

- **AppUser**: Benutzer-Management
- **Project**: Projekte (1 User → n Projects)
- **TextDocument**: Hauptdokumente
- **Note**: Hierarchische Notizen (Self-Relation)
- **LLMInteraction**: KI-Chat-Verlauf

### Doctrine Migrationen

```bash
# Migration erstellen
docker compose exec php bin/console make:migration

# Migration ausführen
docker compose exec php bin/console doctrine:migrations:migrate
```

---

## 🔌 LLM-Integration

### Ollama Setup

1. **Ollama installieren**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Ollama-Service starten**
   ```bash
   ollama serve
   ```

3. **Modell herunterladen**
   ```bash
   ollama pull openhermes
   # oder andere Modelle:
   # ollama pull deepseek-coder
   # ollama pull llama2
   ```

4. **API-Verbindung testen**
   ```bash
   curl http://localhost:11434/api/generate \
     -d '{"model": "openhermes", "prompt": "Test"}'
   ```

### Status-Endpoints

- **Web-Interface**: `http://localhost/llm/status.html`
- **JSON-API**: `http://localhost/api/llm/status`

---

## 🛠️ Entwickler-Workflows

### Container-Management

```bash
# Alle Container starten
docker compose up -d

# Container neu builden
docker compose build --no-cache

# Container stoppen
docker compose down

# Logs anzeigen
docker compose logs -f

# PHP-Container betreten
docker compose exec php bash
```

### Symfony-Befehle

```bash
# Cache leeren
docker compose exec php bin/console cache:clear

# Routen anzeigen
docker compose exec php bin/console debug:router

# Doctrine Schema updaten
docker compose exec php bin/console doctrine:schema:update --force
```

### Frontend-Development

Da alle Assets über CDN geladen werden, ist kein Build-Prozess erforderlich:

```bash
# Custom CSS bearbeiten
public/assets/css/style.css

# Custom JavaScript bearbeiten  
public/assets/js/workspace.js
public/assets/js/main.js
```

---

## 🌐 Verfügbare Routen

| Route | Beschreibung |
|-------|-------------|
| `/` | Startseite |
| `/workspace/{slug}` | Hauptarbeitsbereich mit Editor |
| `/projects` | Projektübersicht |
| `/api/llm/status` | LLM-Status API |
| `/api/notes/project/{slug}` | Notizen-API |

---

## ⚙️ Konfiguration

### Umgebungsvariablen

```bash
# .env (wird automatisch erstellt)
DATABASE_URL="postgresql://app:!ChangeMe!@database:5432/app?serverVersion=15&charset=utf8"
SERVER_NAME="localhost"
```

### Docker Konfiguration

```yaml
# compose.yaml (Auszug)
services:
  php:
    build: .
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
  
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_PASSWORD: "!ChangeMe!"
      POSTGRES_USER: app
```

---

## 🐛 Troubleshooting

### Häufige Probleme

**1. Docker-Container starten nicht**
```bash
# Alle Container stoppen und neu starten
docker compose down --remove-orphans
docker compose up -d --wait
```

**2. Datenbank-Verbindung fehlgeschlagen**
```bash
# Datenbank-Status prüfen
docker compose exec database pg_isready -U app -d app
```

**3. TLS-Zertifikat-Fehler**
- Im Browser das selbst-signierte Zertifikat akzeptieren
- Alternativ: `http://localhost` verwenden (ohne SSL)

**4. Ollama-Verbindung fehlgeschlagen**
```bash
# Ollama-Status prüfen
curl http://localhost:11434/api/tags

# Ollama neu starten
ollama serve
```

**5. Summernote Editor lädt nicht**
- Browser DevTools → Console für JavaScript-Fehler prüfen
- CDN-Verbindung testen

### Debug-Modi

```bash
# Symfony Debug-Modus
export APP_ENV=dev

# Docker Logs in Echtzeit
docker compose logs -f php

# JavaScript Debugging
# Browser DevTools → Console für Fehlermeldungen
```

---

## 📋 Make-Commands (Optional)

Erstelle eine `Makefile` für häufige Befehle:

```makefile
.PHONY: help build up down logs

help:
	@echo "Verfügbare Befehle:"
	@echo "  make build  - Docker Images builden"
	@echo "  make up     - Container starten"
	@echo "  make down   - Container stoppen"

build:
	docker compose build --no-cache

up:
	docker compose up -d --wait

down:
	docker compose down --remove-orphans

logs:
	docker compose logs -f
```

**Nutzung:**
```bash
make build
make up
```

---

## 🚢 Deployment

### Production Setup

1. **Production Docker Compose verwenden**
   ```bash
   docker compose -f compose.yaml -f compose.prod.yaml up -d
   ```

2. **Umgebungsvariablen setzen**
   ```bash
   export APP_ENV=prod
   export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

3. **Cache optimieren**
   ```bash
   docker compose exec php bin/console cache:clear --env=prod
   ```

---

## 🤝 Entwicklung & Contribution

### Git-Workflow

```bash
# Feature-Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen committen
git add .
git commit -m "feat: neue Funktion hinzugefügt"

# Branch pushen
git push origin feature/neue-funktion
```

### Code-Standards

- **PHP**: PSR-12 Standard
- **JavaScript**: Vanilla JS, keine Frameworks
- **CSS**: BEM-Notation empfohlen

---

## 📄 Lizenz

Dieses Projekt steht unter der **MIT License**.

---

## 👨‍💻 Team & Support

**Repository**: https://github.com/1000Kraniche/llm-schreibapp  
**Issues**: https://github.com/1000Kraniche/llm-schreibapp/issues

**Entwickler**: 
- Peer Guminski
- Joyce Prisheyly

**KI-Support**: ChatGPT und Claude.ai

---

*Letzte Aktualisierung: Juni 2025*