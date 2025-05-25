# 📝 llm-schreibapp

Eine dokumentenzentrierte Schreibanwendung mit Symfony, Twig, Docker und integriertem lokalen LLM (OpenHermes via Ollama).  
Ziel ist es, kreative Projekte wie Romane, Drehbücher oder Notizsammlungen zu verwalten, bearbeiten und mit KI-Unterstützung zu entwickeln.

## 🚀 Voraussetzungen

- PHP >= 8.1
- Docker & Docker Compose
- Node.js & npm
- Composer
- Ollama (für LLMs wie OpenHermes)

---

## ⚙️ Symfony-Pakete installieren

Falls du das Projekt frisch aufsetzt, stelle sicher, dass folgende Symfony-Bundles installiert sind:

```bash
composer require symfony/twig-bundle
composer require symfony/http-client
composer require symfony/asset
composer require symfony/webpack-encore-bundle
composer require annotations
```

> Falls `annotations` bereits aktiv sind, kannst du den letzten Befehl weglassen.

---

## 📦 Frontend-Assets (manuell oder via CDN)

### CDN (Standard)
Bootstrap & Icons werden aktuell über CDN eingebunden.

### Lokale Variante (optional)
Falls du die Ressourcen lokal speichern willst:

```bash
mkdir -p public/assets/css public/assets/js
curl -o public/assets/css/bootstrap.min.css https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css
curl -o public/assets/css/bootstrap-icons.min.css https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css
curl -o public/assets/js/bootstrap.bundle.min.js https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js
```

---

## 🧠 LLM (Ollama + OpenHermes)

1. Installiere [Ollama](https://ollama.com) (Mac: `brew install ollama`)
2. Starte den Dienst:  
   ```bash
   ollama serve
   ```
3. LLM-Modell laden (Beispiel OpenHermes):
   ```bash
   ollama pull openhermes
   ```

> Das Modell liegt lokal unter:  
> `~/.ollama/models` (macOS/Linux)  
> `C:\Users\USERNAME\.ollama\models` (Windows)

---

## 🧪 Status prüfen

- Öffne `http://localhost/llm/status.html` im Browser, um die Verbindung zu prüfen.
- Die JSON-API ist unter `/api/llm/status` erreichbar.

---

## 📚 Verfügbare Seiten

- `/` – Startseite
- `/workspace` – Hauptarbeitsbereich mit Editor und LLM
- Weitere Routen folgen

---

## ✍️ Beteiligte Entitäten

- `AppUser`
- `Project` → 1 User hat mehrere
- `TextDocument` → gehört zu einem Projekt (versionierbar)
- `Note` → gehört zu einem Projekt (mit Self-Relation für Ordnerstruktur)
- `LLMInteraction` → speichert einzelne LLM-Eingaben & Antworten

---

## 📂 Ordnerstruktur (Twig)

```text
templates/
├── base.html.twig
├── include/
│   ├── header.html.twig
│   └── footer.html.twig
├── page/
│   ├── index.html.twig
│   └── workspace.html.twig
```

---

## 📌 Nächste Schritte

- LLM-Chatverlauf speichern
- Notes in verschachtelter Baumstruktur darstellen
- Editor-Integration (z. B. TipTap)
- Benutzer-Login & Projektauswahl

---

> Letzte Änderung: 2025-05-04
