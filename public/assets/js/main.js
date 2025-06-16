// ====================================================
// MAIN.JS - GLOBALER SCRIPT FÜR ALLE SEITEN
// ====================================================
//
// 📁 DATEI-ÜBERSICHT:
// ==================
// 
// 🌍 main.js (diese Datei)
//    → Globale Hilfsfunktionen für alle Seiten
//    → Project-List Funktionen (deleteProject, createNewProject)
//    → Settings Funktionen (saveAppPreferences, refreshLLMStatus)
//    → Help Funktionen (checkLLMStatus)
//
// 🎛️ script.js 
//    → Navigation & Menu-Funktionen (Hamburger-Menu, Responsive)
//    → Escape-Key Handler, Resize-Handler
//
// 📝 workspace.js (nur workspace.html.twig)
//    → Summernote Editor Setup & Funktionen
//    → Auto-Save, Word-Count, Editor-Toolbar
//    → saveAsNote(), toggleAutoSave(), saveNow()
//
// 📋 notes-manager.js (nur workspace.html.twig) 
//    → Alle Notizen-Funktionen (CRUD)
//    → Modal-Management für Notizen-Übersicht
//    → openNote(), saveCurrentNote(), deleteCurrentNote()
//
// 🎛️ sidebar.js (nur workspace.html.twig)
//    → Sidebar-spezifische Funktionen  
//    → toggleLLMChat(), updateNoteDisplay()
//    → Notizen-Sidebar-Management
//
// 🤖 llm-chat.js (global geladen)
//    → LLM Chat Funktionen
//    → API-Calls zu /api/llm/chat
//
// ====================================================

console.log('🌍 Main.js global geladen');

// ====================================================
// GLOBALE HILFSFUNKTIONEN
// ====================================================

/**
 * Zeigt temporäre Toast-Nachrichten an
 * @param {string} message - Die Nachricht
 * @param {string} type - success, danger, warning, info
 */
function showTempMessage(message, type = 'info') {
    console.log(`📢 Toast: ${message} (${type})`);
    
    const alertClass = `alert-${type}`;
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-Hide nach 3 Sekunden
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            if (alert.textContent.includes(message.replace(/<[^>]*>/g, ''))) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }
        });
    }, 3000);
}

/**
 * Escape HTML für XSS-Schutz
 * @param {string} text - Text zum escapen
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formatiert Datum/Zeit für Anzeige
 * @param {Date} date - Datum
 * @returns {string} Formatiertes Datum
 */
function formatDateTime(date) {
    if (!date) return 'Unbekannt';
    
    const options = {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('de-DE', options);
}

// ====================================================
// PROJECT-LIST FUNKTIONEN
// ====================================================

/**
 * Neues Projekt erstellen (Modal)
 */
async function createNewProject() {
    const title = document.getElementById('projectTitle')?.value.trim();
    const description = document.getElementById('projectDescription')?.value.trim();
    
    if (!title) {
        showTempMessage('Bitte gib einen Projekt-Titel ein!', 'warning');
        return;
    }
    
    console.log('📁 Erstelle neues Projekt:', title);
    
    try {
        const response = await fetch('/api/project/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showTempMessage('✅ Projekt "' + title + '" erstellt!', 'success');
            // Zum neuen Projekt weiterleiten
            window.location.href = data.project.workspace_url;
        } else {
            showTempMessage('❌ Fehler: ' + (data.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Erstellen:', error);
        showTempMessage('❌ Verbindungsfehler beim Erstellen!', 'danger');
    }
}

/**
 * Projekt löschen mit Bestätigung
 * @param {string} slug - Projekt-Slug
 * @param {string} title - Projekt-Titel
 */
async function deleteProject(slug, title) {
    if (!confirm(`Projekt "${title}" wirklich löschen?\n\nAlle Texte und Notizen gehen verloren!`)) {
        return;
    }
    
    console.log('🗑️ Lösche Projekt:', title);
    
    try {
        const response = await fetch(`/api/project/${slug}/delete`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showTempMessage('✅ Projekt "' + title + '" gelöscht!', 'success');
            location.reload(); // Seite neu laden
        } else {
            showTempMessage('❌ Fehler beim Löschen: ' + (data.error || 'Unbekannter Fehler'), 'danger');
        }
    } catch (error) {
        console.error('❌ Fehler beim Löschen:', error);
        showTempMessage('❌ Verbindungsfehler beim Löschen!', 'danger');
    }
}

// ====================================================
// SETTINGS FUNKTIONEN
// ====================================================

/**
 * App-Einstellungen speichern
 */
function saveAppPreferences() {
    const defaultProject = document.getElementById('default-project')?.value;
    const language = document.getElementById('language')?.value;
    const autosaveDefault = document.getElementById('autosave-default')?.value;
    const editorTheme = document.getElementById('editor-theme')?.value;
    
    // Simulate saving (in real app: API call)
    const preferences = {
        defaultProject,
        language,
        autosaveDefault: autosaveDefault === 'true',
        editorTheme
    };
    
    console.log('💾 Speichere Einstellungen:', preferences);
    
    // TODO: Hier würde API-Call stehen
    // fetch('/api/user/preferences', { method: 'PUT', body: JSON.stringify(preferences) })
    
    showTempMessage('✅ Einstellungen gespeichert!', 'success');
}

/**
 * App-Einstellungen zurücksetzen
 */
function resetAppPreferences() {
    if (document.getElementById('default-project')) {
        document.getElementById('default-project').value = '';
    }
    if (document.getElementById('language')) {
        document.getElementById('language').value = 'de';
    }
    if (document.getElementById('autosave-default')) {
        document.getElementById('autosave-default').value = 'true';
    }
    if (document.getElementById('editor-theme')) {
        document.getElementById('editor-theme').value = 'default';
    }
    
    showTempMessage('🔄 Einstellungen zurückgesetzt!', 'info');
}

/**
 * Account löschen bestätigen (Settings)
 */
function confirmDeleteAccount() {
    if (confirm('Wirklich den Account und alle Projekte löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!')) {
        if (confirm('Letzte Warnung!\n\nAlle deine Texte und Notizen gehen verloren!')) {
            // In real app: API call to delete account
            showTempMessage('⚠️ Account-Löschung würde hier durchgeführt werden.', 'warning');
        }
    }
}

// ====================================================
// MODAL HELPER
// ====================================================

/**
 * Modal reset beim Öffnen
 */
function resetProjectModal() {
    const form = document.getElementById('createProjectForm');
    const titleInput = document.getElementById('projectTitle');
    
    if (form) {
        form.reset();
    }
    
    if (titleInput) {
        setTimeout(() => titleInput.focus(), 300);
    }
}

// ====================================================
// GLOBALE INITIALISIERUNG
// ====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Main.js DOM ready - initialisiere globale Funktionen');
    
    // Modal Event-Listener für Project-List
    const createProjectModal = document.getElementById('createProjectModal');
    if (createProjectModal) {
        createProjectModal.addEventListener('show.bs.modal', resetProjectModal);
        console.log('✅ Project Modal Events registriert');
    }
    
    console.log('✅ Main.js Initialisierung abgeschlossen');
});

// ====================================================
// GLOBALE FUNKTIONEN VERFÜGBAR MACHEN
// ====================================================

// Diese Funktionen müssen global verfügbar sein für HTML onclick
window.showTempMessage = showTempMessage;
window.escapeHtml = escapeHtml;
window.formatDateTime = formatDateTime;
window.createNewProject = createNewProject;
window.deleteProject = deleteProject;
window.saveAppPreferences = saveAppPreferences;
window.resetAppPreferences = resetAppPreferences;
window.confirmDeleteAccount = confirmDeleteAccount;

console.log('🌍 Main.js vollständig geladen!');