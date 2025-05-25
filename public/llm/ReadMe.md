# 🧠 Lokales LLM-Setup für die Schreib-App

## Modellinformationen

- **Modellname:** `openhermes`
- **Modellversion:** 2.5
- **Verwendung:** Textgenerierung, kreatives Schreiben, dramaturgische Unterstützung
- **Bereitstellung:** Lokaler Ollama-Server

## Speicherort der heruntergeladenen LLMs (Ollama)

- **macOS:** `~/.ollama/models`
- **Windows:** `C:\Users\<DeinBenutzername>\.ollama\models`
- **Linux:** `~/.ollama/models`

## Technische Daten

- **API-Endpunkt:** `http://localhost:11434`
- **Standard-Route:** `POST /api/generate`
- **Kontextlänge (tokens):** 4096 (modellabhängig)
- **Aktives Modell:** `openhermes`

## Hinweise

- Ollama muss aktiv laufen (`ollama serve`) oder als Hintergrunddienst (`brew services start ollama`).
- Das Modell wird **nicht im Projektverzeichnis** gespeichert – es bleibt global im Ollama-Modellverzeichnis.
- Über die App kann der Verbindungsstatus unter `/llm/status.html` geprüft werden.

---

> Letzte Aktualisierung: 2025-05-04
