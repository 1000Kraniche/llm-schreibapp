// ====================================================
// LLM-INTEGRATION.JS - ALLE LLM-FUNKTIONEN
// ====================================================
//
// 🤖 Diese Datei enthält:
//    → LLM Chat-Integration für Workspace
//    → LLM Status-Checks (Settings, Help)
//    → API-Calls zu /api/llm/chat und /api/llm/status
//    → Antwort-Formatierung und UI-Updates
//
// 📍 Wird geladen in:
//    → workspace.html.twig (für Chat)
//    → Könnte auch global geladen werden für Status-Checks
//
// ====================================================

console.log('🤖 LLM-Integration.js wird geladen...');

// Globale LLM-Variablen
let currentProjectSlug = null;
let llmChatEnabled = true;

// ====================================================
// LLM CHAT FUNKTIONEN (WORKSPACE)
// ====================================================

/**
 * LLM Chat initialisieren (nur Workspace)
 */
function initializeLLMChat() {
    console.log('🤖 LLM Chat wird initialisiert');
    
    // Projekt-Slug aus DOM extrahieren
    const workspaceElement = document.querySelector('[data-project-slug]');
    if (workspaceElement) {
        currentProjectSlug = workspaceElement.dataset.projectSlug;
        console.log('📊 Projekt-Slug für LLM:', currentProjectSlug);
    }
    
    // Enter-Taste Support für das Textarea
    const llmInput = document.getElementById('llm-input');
    if (llmInput) {
        llmInput.addEventListener('keydown', function(e) {
            console.log('🔍 Taste gedrückt:', e.key, 'Shift:', e.shiftKey);
            // Enter ohne Shift = Submit
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Verhindert Zeilenumbruch
                console.log('✅ Enter gedrückt - sende Formular');
                document.getElementById('llm-form').dispatchEvent(new Event('submit'));
            }
            // Shift+Enter = neue Zeile (normales Verhalten)
        });
    }

    // Form Submit Handler
    const llmForm = document.getElementById('llm-form');
    if (llmForm) {
        llmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLLMSubmit();
        });
    }
    
    // Quick-Prompt Buttons hinzufügen
    addQuickPrompts();
    
    console.log('✅ LLM Chat erfolgreich initialisiert');
}

/**
 * LLM Form Submit Handler
 */
async function handleLLMSubmit() {
    const promptInput = document.getElementById('llm-input');
    const responseDiv = document.getElementById('llm-response');
    
    if (!promptInput || !responseDiv) {
        console.error('❌ LLM Chat Elemente nicht gefunden');
        return;
    }
    
    const prompt = promptInput.value.trim();
    if (!prompt) return;
    
    console.log('🤖 LLM Anfrage:', prompt.substring(0, 50) + '...');
    
    // Loading-UI anzeigen
    responseDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-spinner fa-spin me-2"></i> 
            <span>Der KI-Assistent analysiert dein Projekt und denkt nach...</span>
        </div>
    `;
    
    try {
        const requestData = { 
            prompt: prompt
        };
        
        // Projekt-Kontext hinzufügen falls verfügbar
        if (currentProjectSlug) {
            // Bei Slug-basierter API: project_slug verwenden
            requestData.project_slug = currentProjectSlug;
            console.log('📊 Sende mit Projekt-Kontext:', currentProjectSlug);
        }
        
        const response = await fetch('/api/llm/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
            signal: AbortSignal.timeout(120000) // 2 Minuten Timeout
        });
        
        const data = await response.json();
        
        if (data.response) {
            console.log('✅ LLM Antwort erhalten');
            
            // Schönere Antwort-Darstellung
            responseDiv.innerHTML = `
                <div class="llm-answer">
                    <small class="text-muted">
                        <i class="fas fa-robot"></i> KI-Assistent${currentProjectSlug ? ' (mit Projekt-Kontext)' : ''}:
                    </small>
                    <div class="mt-2">${formatLLMResponse(data.response)}</div>
                </div>
            `;
            
            // Optional: Antwort in Editor einfügen
            const insertCheckbox = document.getElementById('insert-to-editor');
            if (insertCheckbox && insertCheckbox.checked && typeof window.insertIntoEditor === 'function') {
                const formattedResponse = `
                    <blockquote class="llm-suggestion">
                        <small><i class="fas fa-robot"></i> KI-Vorschlag:</small><br>
                        ${data.response}
                    </blockquote>
                `;
                window.insertIntoEditor(formattedResponse);
            }
            
            promptInput.value = ''; // Input leeren
            
            // Success-Feedback
            if (typeof window.showTempMessage === 'function') {
                window.showTempMessage('✅ KI-Assistent hat geantwortet!', 'success');
            }
            
        } else {
            console.error('❌ LLM Fehler-Response:', data);
            responseDiv.innerHTML = `
                <div class="text-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Fehler: ${data.error || 'Unbekannter Fehler'}
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ LLM Verbindungsfehler:', error);
        responseDiv.innerHTML = `
            <div class="text-danger">
                <i class="fas fa-wifi"></i> 
                Verbindungsfehler: ${error.name === 'TimeoutError' ? 'Anfrage zu langsam (Timeout)' : error.message}
            </div>
        `;
    }
}

/**
 * LLM-Antworten schöner formatieren
 * @param {string} response - Rohe LLM-Antwort
 * @returns {string} Formatierte HTML-Antwort
 */
function formatLLMResponse(response) {
    if (!response) return '';
    
    // Einfache Formatierung: Zeilenumbrüche zu HTML
    return response
        .replace(/\n\n/g, '</p><p>')  // Doppelte Zeilenumbrüche = neue Absätze
        .replace(/\n/g, '<br>')       // Einzelne Zeilenumbrüche = <br>
        .replace(/^(.*)$/, '<p>$1</p>'); // Gesamten Text in <p> wrappen
}

/**
 * Quick-Prompt Buttons hinzufügen
 */
function addQuickPrompts() {
    const quickPrompts = [
        "Hilf mir beim Weiterschreiben",
        "Fasse den bisherigen Text zusammen", 
        "Welche Ideen hast du für dieses Projekt?",
        "Verbessere meinen letzten Absatz",
        "Erstelle eine Gliederung basierend auf meinen Notizen"
    ];
    
    const llmForm = document.getElementById('llm-form');
    if (!llmForm) return;
    
    let buttonsHtml = '<div class="quick-prompts mb-2">';
    quickPrompts.forEach(prompt => {
        buttonsHtml += `
            <button type="button" class="btn btn-outline-primary btn-sm me-1 mb-1" 
                    onclick="useQuickPrompt('${prompt.replace(/'/g, "\\'")}')">
                ${prompt}
            </button>
        `;
    });
    buttonsHtml += '</div>';
    
    llmForm.insertAdjacentHTML('afterbegin', buttonsHtml);
    console.log('✅ Quick-Prompt Buttons hinzugefügt');
}

/**
 * Quick-Prompt verwenden
 * @param {string} prompt - Vordefinierter Prompt
 */
function useQuickPrompt(prompt) {
    const llmInput = document.getElementById('llm-input');
    if (llmInput) {
        llmInput.value = prompt;
        handleLLMSubmit();
    }
}

// ====================================================
// LLM STATUS FUNKTIONEN (SETTINGS & HELP)
// ====================================================

/**
 * LLM Status prüfen (für Settings-Seite)
 */
async function refreshLLMStatus() {
    const statusDiv = document.getElementById('llm-current-status');
    
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span class="text-muted">Status wird geprüft...</span>
        `;
    }
    
    try {
        const response = await fetch('/api/llm/status');
        const data = await response.json();
        
        if (statusDiv) {
            if (data.status === 'online') {
                statusDiv.innerHTML = `
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <span class="text-success fw-bold">Online</span>
                    <small class="text-muted ms-2">(${data.models?.models?.length || 0} Modelle)</small>
                `;
            } else {
                throw new Error('Offline');
            }
        }
        
        if (typeof window.showTempMessage === 'function') {
            window.showTempMessage('✅ LLM Status aktualisiert', 'success');
        }
        
    } catch (error) {
        console.error('❌ LLM Status Fehler:', error);
        
        if (statusDiv) {
            statusDiv.innerHTML = `
                <i class="fas fa-times-circle text-danger me-2"></i>
                <span class="text-danger fw-bold">Offline</span>
                <small class="text-muted ms-2">(Verbindung fehlgeschlagen)</small>
            `;
        }
        
        if (typeof window.showTempMessage === 'function') {
            window.showTempMessage('❌ LLM ist offline', 'danger');
        }
    }
}

/**
 * LLM Status für Help-Seite prüfen (mit eigenem UI)
 */
async function checkLLMStatus() {
    const btn = document.getElementById('check-llm-btn');
    const statusDiv = document.getElementById('llm-status');
    const statusContent = document.getElementById('status-content');
    
    if (!btn || !statusDiv || !statusContent) {
        console.error('❌ Help-Seite LLM-Status Elemente nicht gefunden');
        return;
    }
    
    // Button disabled, Status anzeigen
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Prüfe...';
    statusDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/llm/status');
        const data = await response.json();
        
        if (data.status === 'online') {
            statusContent.innerHTML = `
                <div class="text-success">
                    <i class="fas fa-check-circle fa-2x mb-3"></i>
                    <h6>✅ LLM ist online und bereit!</h6>
                    <p class="mb-2">Verfügbare Modelle: ${data.models?.models?.length || 'Unbekannt'}</p>
                    <small class="text-muted">Verbindung zu Ollama erfolgreich</small>
                </div>
            `;
        } else {
            throw new Error(data.message || 'LLM nicht erreichbar');
        }
    } catch (error) {
        statusContent.innerHTML = `
            <div class="text-danger">
                <i class="fas fa-times-circle fa-2x mb-3"></i>
                <h6>❌ LLM ist offline</h6>
                <p class="mb-2">Fehler: ${error.message}</p>
                <small class="text-muted">
                    Stelle sicher dass Ollama läuft: <code>ollama serve</code>
                </small>
            </div>
        `;
    }
    
    // Button zurücksetzen
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-search me-2"></i>Erneut prüfen';
}

// ====================================================
// LLM CHAT STEUERUNG
// ====================================================

/**
 * LLM Chat ein-/ausklappen (Sidebar)
 */
function toggleLLMChat() {
    console.log('🤖 Toggle LLM Chat');
    
    const content = document.getElementById('llm-content');
    const btn = document.getElementById('llm-toggle-btn');
    
    if (content && btn) {
        if (content.classList.contains('collapsed')) {
            // Chat aufklappen
            content.classList.remove('collapsed');
            btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            console.log('✅ LLM Chat aufgeklappt');
        } else {
            // Chat zuklappen
            content.classList.add('collapsed');
            btn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            console.log('✅ LLM Chat zugeklappt');
        }
    } else {
        console.error('❌ LLM Chat Toggle-Elemente nicht gefunden');
    }
}

/**
 * LLM Chat aktivieren/deaktivieren
 * @param {boolean} enabled - Ob Chat aktiviert werden soll
 */
function setLLMChatEnabled(enabled) {
    llmChatEnabled = enabled;
    
    const llmInput = document.getElementById('llm-input');
    const llmForm = document.getElementById('llm-form');
    
    if (llmInput) {
        llmInput.disabled = !enabled;
        llmInput.placeholder = enabled ? 
            'Frage an den KI-Assistenten...' : 
            'LLM-Chat ist deaktiviert';
    }
    
    if (llmForm) {
        llmForm.style.opacity = enabled ? '1' : '0.5';
    }
    
    console.log('🤖 LLM Chat', enabled ? 'aktiviert' : 'deaktiviert');
}

// ====================================================
// GLOBALE FUNKTIONEN VERFÜGBAR MACHEN
// ====================================================

// Workspace-spezifische LLM-Funktionen
window.initializeLLMChat = initializeLLMChat;
window.handleLLMSubmit = handleLLMSubmit;
window.formatLLMResponse = formatLLMResponse;
window.useQuickPrompt = useQuickPrompt;
window.toggleLLMChat = toggleLLMChat;
window.setLLMChatEnabled = setLLMChatEnabled;

// Status-Check Funktionen (für alle Seiten)
window.refreshLLMStatus = refreshLLMStatus;
window.checkLLMStatus = checkLLMStatus;

// ====================================================
// AUTO-INITIALISIERUNG
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 LLM-Integration DOM ready');
    
    // LLM Chat nur initialisieren wenn workspace.html.twig
    if (document.getElementById('llm-form')) {
        console.log('🤖 Workspace erkannt - initialisiere LLM Chat');
        setTimeout(() => {
            initializeLLMChat();
        }, 500); // Kurz warten bis andere Scripts geladen sind
    }
    
    // Settings-Seite: LLM Status laden
    if (document.getElementById('llm-current-status')) {
        console.log('⚙️ Settings erkannt - lade LLM Status');
        setTimeout(refreshLLMStatus, 1000);
    }
    
    console.log('✅ LLM-Integration bereit');
});

console.log('🤖 LLM-Integration.js vollständig geladen!');