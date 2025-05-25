Hier ist die vollständige Zusammenfassung deines aktuellen Setups und Projekts, damit du notfalls nahtlos in einem neuen Gespräch weiterarbeiten kannst:

🔧 Technisches Setup
System: Windows mit WSL2 (Ubuntu 24.04) eingerichtet

Docker: Docker Desktop ist installiert und WSL2-Integration aktiviert

GitHub: Repository ist online unter
👉 https://github.com/1000Kraniche/llm-schreibapp

Lokaler Projektordner:
~/symfony-docker in Ubuntu (WSL)
→ alle relevanten Projektdateien befinden sich in:
~/symfony-docker/public/
(z. B. index.html, style.css, script.js)

📦 Projektstruktur
Projekt basiert auf dem Symfony Docker Setup von dunglas/symfony-docker

Start mit docker compose up --build funktioniert

Symfony-Projekt ist im Container installiert

Git-Konfiguration erfolgt mit User: Peer und Email: pguminski@gmx.de

Personal Access Token für GitHub-Pushs wurde genutzt (nicht gespeichert)

🎨 Frontend-Details
CSS & Design

Bootstrap 5.3 + Bootstrap Icons (CDN eingebunden)

Schriftart: Inter über Google Fonts

Hauptabstände: 30px, kleinere Abstände: 15px

Eigene CSS-Datei mit vollständiger Reset-/Layout-/Responsive-Struktur

Sidebar kann ein-/ausklappen, wird standardmäßig minimiert angezeigt (nur Icons)

HTML-Aufbau

index.html mit:

Header mit Logo und Navigation

Sidebar (links) mit Icons + ausfahrbarem Text via Hamburger (Icon dreht sich)

Page Content (<section>) mit 2-Spalten-Layout:

Links: Texteditor-Bereich

Rechts: Suchfeld, LLM-Textfeld, LLM-Chatfeld (50/50-höhenverteilt)

Footer

💡 Ziel des Projekts
Erstellung einer webbasierten Schreibumgebung, unterstützt durch ein lokal laufendes LLM (z. B. DeepSeek über Ollama)

Ursprünglich für Romanarbeit gedacht, aber nach außen hin als wissenschaftliche Schreibhilfe oder kollaborative Umgebung präsentiert

Fokus auf klar strukturierte UI + Möglichkeit, später mit anderen Personen zusammen daran zu arbeiten (Team-Ready, Mac-kompatibel)

Wenn du später weiterarbeiten willst, sag einfach z. B.:

"Lass uns im Projekt llm-schreibapp weitermachen"
Dann weiß ich direkt alles Relevante.